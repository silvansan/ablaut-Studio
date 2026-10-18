'use client'

import { ParticipantEvent, Room, RoomEvent, Track, type LocalTrackPublication } from 'livekit-client'
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react'

import { AudioEffectToggle } from '@/components/AudioEffectToggle'

type SpeakerAccessPanelProps = {
  audioQualityDefaults?: AudioQualityControls
  channelSlug: string
  eventSlug: string
  hasAccess: boolean
  passwordRequired: boolean
}

type AudioQualityControls = {
  autoGainControl: boolean
  echoCancellation: boolean
  noiseSuppression: boolean
}

type SpeakerTokenResponse = {
  error?: string
  token: string
  url: string
}

type PublishState = 'idle' | 'loading-devices' | 'connecting' | 'publishing' | 'error'

async function resolvePublishedMicrophoneTrackSid(room: Room): Promise<string | undefined> {
  const existing = room.localParticipant.getTrackPublication(Track.Source.Microphone)?.trackSid

  if (existing) {
    return existing
  }

  return new Promise((resolve) => {
    const timeout = window.setTimeout(() => {
      room.localParticipant.off(ParticipantEvent.LocalTrackPublished, onPublished)
      resolve(room.localParticipant.getTrackPublication(Track.Source.Microphone)?.trackSid)
    }, 5000)

    const onPublished = (publication: LocalTrackPublication) => {
      if (publication.source !== Track.Source.Microphone || !publication.trackSid) {
        return
      }

      window.clearTimeout(timeout)
      room.localParticipant.off(ParticipantEvent.LocalTrackPublished, onPublished)
      resolve(publication.trackSid)
    }

    room.localParticipant.on(ParticipantEvent.LocalTrackPublished, onPublished)
  })
}

export function SpeakerAccessPanel({
  audioQualityDefaults,
  channelSlug,
  eventSlug,
  hasAccess: initialHasAccess,
  passwordRequired,
}: SpeakerAccessPanelProps) {
  const roomRef = useRef<Room | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [hasAccess, setHasAccess] = useState(initialHasAccess || !passwordRequired)
  const [loading, setLoading] = useState(false)
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([])
  const [publishMessage, setPublishMessage] = useState<string | null>(null)
  const [publishState, setPublishState] = useState<PublishState>('idle')
  const [password, setPassword] = useState('')
  const [selectedDeviceID, setSelectedDeviceID] = useState('')
  const [audioQuality, setAudioQuality] = useState<AudioQualityControls>({
    autoGainControl: audioQualityDefaults?.autoGainControl ?? false,
    echoCancellation: audioQualityDefaults?.echoCancellation ?? false,
    noiseSuppression: audioQualityDefaults?.noiseSuppression ?? false,
  })

  const audioConstraints = useCallback((deviceID?: string): MediaTrackConstraints => {
    return {
      autoGainControl: audioQuality.autoGainControl,
      deviceId: deviceID ? { exact: deviceID } : undefined,
      echoCancellation: audioQuality.echoCancellation,
      noiseSuppression: audioQuality.noiseSuppression,
    }
  }, [audioQuality])

  function updateAudioQuality(key: keyof AudioQualityControls, value: boolean) {
    setAudioQuality((current) => ({
      ...current,
      [key]: value,
    }))
  }

  useEffect(() => {
    return () => {
      roomRef.current?.disconnect()
      roomRef.current = null
    }
  }, [])

  const loadMicrophones = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) {
      setPublishState('error')
      setPublishMessage('This browser does not expose microphone device selection.')
      return
    }

    setPublishState('loading-devices')
    setPublishMessage('Loading microphones...')

    try {
      await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints(),
      })

      const devices = await navigator.mediaDevices.enumerateDevices()
      const audioInputs = devices.filter((device) => device.kind === 'audioinput')
      setMicrophones(audioInputs)
      setSelectedDeviceID((current) => current || audioInputs[0]?.deviceId || '')
      setPublishState('idle')
      setPublishMessage(audioInputs.length > 0 ? 'Choose a microphone, then start publishing.' : 'No microphone was found.')
    } catch (loadError) {
      console.error('Unable to load microphones', loadError)
      setPublishState('error')
      setPublishMessage('Microphone permission was denied or no microphone is available.')
    }
  }, [audioConstraints])

  useEffect(() => {
    if (!passwordRequired && initialHasAccess) {
      void fetch('/api/speaker/verify-password', {
        body: JSON.stringify({
          channelSlug,
          eventSlug,
          password: '',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })
    }
  }, [channelSlug, eventSlug, initialHasAccess, passwordRequired])

  useEffect(() => {
    if (hasAccess) {
      void loadMicrophones()
    }
  }, [hasAccess, loadMicrophones])

  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    const response = await fetch('/api/speaker/verify-password', {
      body: JSON.stringify({
        channelSlug,
        eventSlug,
        password,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })

    setLoading(false)

    if (!response.ok) {
      setError('That speaker password did not work. Check it and try again.')
      return
    }

    setHasAccess(true)
    setPassword('')
  }

  async function startPublishing() {
    if (!selectedDeviceID) {
      setPublishState('error')
      setPublishMessage('Select a microphone before publishing.')
      return
    }

    setPublishState('connecting')
    setPublishMessage('Requesting speaker token...')

    const response = await fetch('/api/livekit/speaker-token', {
      body: JSON.stringify({
        channelSlug,
        eventSlug,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })

    const tokenResponse = (await response.json().catch(() => null)) as SpeakerTokenResponse | null

    if (!response.ok || !tokenResponse?.token || !tokenResponse.url) {
      setPublishState('error')
      setPublishMessage(tokenResponse?.error ?? 'Unable to get a speaker token for this channel.')
      return
    }

    const { token, url } = tokenResponse

    try {
      roomRef.current?.disconnect()

      const room = new Room({
        audioCaptureDefaults: audioConstraints(),
      })
      roomRef.current = room

      room.on(RoomEvent.Disconnected, () => {
        setPublishState('idle')
        setPublishMessage('Disconnected from the speaker channel.')
      })

      await room.connect(url, token, {
        autoSubscribe: true,
      })

      await room.localParticipant.setMicrophoneEnabled(
        true,
        audioConstraints(selectedDeviceID),
        {
          name: 'speaker-microphone',
        },
      )

      setPublishState('publishing')
      setPublishMessage('Publishing microphone audio with the selected audio quality controls.')

      const audioTrackId = await resolvePublishedMicrophoneTrackSid(room)

      void fetch('/api/livekit/start-hls-egress', {
        body: JSON.stringify({
          audioTrackId,
          channelSlug,
          eventSlug,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })
    } catch (publishError) {
      console.error('Speaker publishing failed', publishError)
      const message = publishError instanceof Error ? publishError.message : null
      roomRef.current?.disconnect()
      roomRef.current = null
      setPublishState('error')

      const liveKitConnectionFailed =
        message?.includes('Failed to fetch') ||
        message?.includes('signal connection') ||
        message?.includes('serverUnreachable')

      setPublishMessage(
        liveKitConnectionFailed
          ? `Cannot reach LiveKit at ${url}. If the app uses HTTPS, set LIVEKIT_URL or Settings → LiveKit public URL to your browser-reachable wss:// address and ensure ports 7880/7881 and UDP 50000-50100 are open.`
          : message
            ? `Publishing failed: ${message}`
            : 'Publishing failed. Check microphone permissions, LiveKit settings, and channel availability.',
      )
    }
  }

  function stopPublishing() {
    roomRef.current?.disconnect()
    roomRef.current = null
    setPublishState('idle')
    setPublishMessage('Publishing stopped.')
  }

  if (!hasAccess) {
    return (
      <article className="us-panel px-6 py-7">
        <span className="us-chip us-chip-warning">Speaker password required</span>
        <h2 className="mt-4 text-2xl font-semibold tracking-tight" style={{ color: 'var(--us-green-dark)' }}>
          Enter the speaker password
        </h2>
        <p className="mt-3 text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
          Unlocks this speaker page only.
        </p>
        <form onSubmit={submitPassword} className="mt-5 space-y-3">
          <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
            Speaker password
            <input
              autoComplete="current-password"
              className="us-input mt-2"
              onChange={(event) => setPassword(event.target.value)}
              required
              style={{ borderColor: 'var(--us-border)', color: 'var(--us-text)' }}
              type="password"
              value={password}
            />
          </label>
          {error ? (
            <p className="text-sm" style={{ color: 'var(--us-danger)' }}>
              {error}
            </p>
          ) : null}
          <button disabled={loading} type="submit" className="us-button-primary w-full px-5 py-3 text-sm font-medium">
            {loading ? 'Checking...' : 'Unlock speaker controls'}
          </button>
        </form>
      </article>
    )
  }

  return (
    <article className="us-panel px-6 py-7">
      <span className="us-chip us-chip-blue">Speaker access ready</span>
      {typeof window !== 'undefined' && !window.isSecureContext ? (
        <p className="mt-4 rounded-2xl border px-4 py-3 text-sm leading-6" style={{ borderColor: 'var(--us-border)', color: 'var(--us-danger)' }}>
          Microphone access requires a secure page. On this computer, open the speaker URL as{' '}
          <strong>http://localhost:3000/speak/…</strong> instead of a LAN IP address. Your phone can still listen via
          the LAN URL while you publish from localhost.
        </p>
      ) : null}
      <h2 className="mt-4 text-2xl font-semibold tracking-tight" style={{ color: 'var(--us-green-dark)' }}>
        Publish controls
      </h2>
      <p className="mt-3 text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
        Select the microphone to publish to this channel. Browser echo cancellation, noise suppression, and auto gain
        control stay off by default, to preserve music and natural source audio.
      </p>
      <label className="mt-5 block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
        Microphone
        <select
          className="us-input mt-2"
          disabled={publishState === 'connecting' || publishState === 'publishing'}
          onChange={(event) => setSelectedDeviceID(event.target.value)}
          style={{ borderColor: 'var(--us-border)', color: 'var(--us-text)' }}
          value={selectedDeviceID}
        >
          {microphones.length === 0 ? <option value="">No microphone loaded</option> : null}
          {microphones.map((device, index) => (
            <option key={device.deviceId || index} value={device.deviceId}>
              {device.label || `Microphone ${index + 1}`}
            </option>
          ))}
        </select>
      </label>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          className="us-button-secondary px-5 py-3 text-sm font-medium"
          disabled={publishState === 'loading-devices' || publishState === 'connecting' || publishState === 'publishing'}
          onClick={loadMicrophones}
        >
          Refresh microphones
        </button>
        {publishState === 'publishing' ? (
          <button type="button" className="us-button-primary px-5 py-3 text-sm font-medium" onClick={stopPublishing}>
            Stop publishing
          </button>
        ) : (
          <button
            type="button"
            className="us-button-primary px-5 py-3 text-sm font-medium"
            disabled={publishState === 'loading-devices' || publishState === 'connecting'}
            onClick={startPublishing}
          >
            {publishState === 'connecting' ? 'Starting...' : 'Start publishing audio'}
          </button>
        )}
      </div>
      {publishMessage ? (
        <p className="mt-4 text-sm leading-6" style={{ color: publishState === 'error' ? 'var(--us-danger)' : 'var(--us-muted)' }}>
          {publishMessage}
        </p>
      ) : null}

      <div className="mt-6 rounded-2xl border px-4 py-4" style={{ borderColor: 'var(--us-border)' }}>
        <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
          Audio quality controls
        </p>
        <p className="mt-2 text-xs leading-5" style={{ color: 'var(--us-muted)' }}>
          These affect this speaker session only. Stop publishing before changing them.
        </p>
        <div className="mt-4 space-y-3">
          <AudioEffectToggle
            checked={audioQuality.echoCancellation}
            disabled={publishState === 'publishing' || publishState === 'connecting'}
            hint="Off by default to avoid music distortion"
            label="Echo cancellation"
            onChange={(checked) => updateAudioQuality('echoCancellation', checked)}
            tone="green"
          />
          <AudioEffectToggle
            checked={audioQuality.noiseSuppression}
            disabled={publishState === 'publishing' || publishState === 'connecting'}
            hint="Off by default for natural source audio"
            label="Noise suppression"
            onChange={(checked) => updateAudioQuality('noiseSuppression', checked)}
            tone="blue"
          />
          <AudioEffectToggle
            checked={audioQuality.autoGainControl}
            disabled={publishState === 'publishing' || publishState === 'connecting'}
            hint="Off by default to preserve dynamics"
            label="Auto gain control"
            onChange={(checked) => updateAudioQuality('autoGainControl', checked)}
            tone="green"
          />
        </div>
      </div>
    </article>
  )
}
