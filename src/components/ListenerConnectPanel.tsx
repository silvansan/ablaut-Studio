'use client'

import { Room, RoomEvent, Track, type RemoteParticipant, type RemoteTrack, type RemoteTrackPublication } from 'livekit-client'
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react'

import { HlsAudioPlayer, isLikelySafariBrowser, unlockBrowserAudioPlayback } from '@/components/HlsAudioPlayer'
import { LiveAudioPlayerShell } from '@/components/LiveAudioPlayerShell'
import {
  bindMediaSession,
  configureMediaPlaybackSession,
  isMobileWebListener,
  resolveDefaultArtworkUrl,
} from '@/lib/streaming/media-session'
import { toLiveHlsManifestUrl } from '@/lib/streaming/ll-hls-config'

type ListenerConnectPanelProps = {
  channelName: string
  channelSlug: string
  eventSlug: string
  eventTitle: string
  fallbackUrl?: string | null
  hasListenerSession?: boolean
  hlsEnabled?: boolean | null
  hlsEgressStatus?: 'error' | 'idle' | 'live' | 'starting' | null
  hlsUrl?: string | null
  listenerPasswordEnabled?: boolean | null
  listenerTokenMode?: 'public' | 'password' | 'private' | null
  webrtcEnabled?: boolean | null
}

type ListenerTokenResponse = {
  token: string
  url: string
}

type ConnectionState = 'idle' | 'connecting' | 'connected' | 'unavailable' | 'error'
type ActiveTransport = 'hls' | 'webrtc' | null

type RestartHlsResponse = {
  hlsEgressStatus?: 'error' | 'idle' | 'live' | 'starting' | null
  hlsUrl?: string | null
  ok?: boolean
}

function passwordRequired(
  listenerPasswordEnabled?: boolean | null,
  listenerTokenMode?: 'public' | 'password' | 'private' | null,
): boolean {
  return listenerPasswordEnabled === true || listenerTokenMode === 'password'
}

function resolveCompatibilityUrl(hlsUrl?: string | null, fallbackUrl?: string | null): string | null {
  const url = hlsUrl?.trim() || fallbackUrl?.trim() || null

  return url ? toLiveHlsManifestUrl(url) : null
}

export function ListenerConnectPanel({
  channelName,
  channelSlug,
  eventSlug,
  eventTitle,
  fallbackUrl,
  hasListenerSession: initialHasListenerSession = false,
  hlsEnabled,
  hlsEgressStatus,
  hlsUrl,
  listenerPasswordEnabled,
  listenerTokenMode,
  webrtcEnabled,
}: ListenerConnectPanelProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const roomRef = useRef<Room | null>(null)
  const skipDisconnectResetRef = useRef(false)
  const mediaSessionCleanupRef = useRef<(() => void) | null>(null)
  const attachedTrackRef = useRef<RemoteTrack | null>(null)
  const pendingTrackRef = useRef<RemoteTrack | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [state, setState] = useState<ConnectionState>('idle')
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const needsPassword = passwordRequired(listenerPasswordEnabled, listenerTokenMode)
  const [hasAccess, setHasAccess] = useState(!needsPassword || initialHasListenerSession)
  const [compatibilityUrl, setCompatibilityUrl] = useState(() => resolveCompatibilityUrl(hlsUrl, fallbackUrl))
  const [activeTransport, setActiveTransport] = useState<ActiveTransport>(null)
  const [hlsSessionKey, setHlsSessionKey] = useState(0)
  const [hlsManifestReady, setHlsManifestReady] = useState(hlsEgressStatus === 'live')
  const [needsAudioUnlock, setNeedsAudioUnlock] = useState(false)
  const [hasAudioElement, setHasAudioElement] = useState(false)
  const [hlsRestarting, setHlsRestarting] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isBuffering, setIsBuffering] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const showSafariHint = isLikelySafariBrowser() && Boolean(compatibilityUrl)
  const showWebRtcPlayer = activeTransport === 'webrtc' && state !== 'idle'

  const syncPlaybackState = useCallback(() => {
    const audio = audioRef.current

    if (!audio) {
      return
    }

    setIsPlaying(!audio.paused && !audio.ended)
    setIsMuted(audio.muted)
  }, [])

  const handleHlsError = useCallback((errorMessage: string) => {
    setMessage(errorMessage)
  }, [])

  const isSpeakerAudioPublication = useCallback(
    (participant: RemoteParticipant, publication: RemoteTrackPublication): boolean => {
      return participant.identity.startsWith('speaker_') && publication.kind === Track.Kind.Audio
    },
    [],
  )

  const clearMediaSessionBinding = useCallback(() => {
    mediaSessionCleanupRef.current?.()
    mediaSessionCleanupRef.current = null
  }, [])

  const clearWebRtcAudio = useCallback(() => {
    clearMediaSessionBinding()
    pendingTrackRef.current = null

    if (attachedTrackRef.current) {
      attachedTrackRef.current.detach()
      attachedTrackRef.current = null
    }

    const audio = audioRef.current

    if (audio) {
      audio.pause()
      audio.srcObject = null
      audio.load()
    }

    setHasAudioElement(false)
    setIsPlaying(false)
    setIsBuffering(false)
  }, [clearMediaSessionBinding])

  const bindWebRtcMediaSession = useCallback(
    (element: HTMLMediaElement) => {
      clearMediaSessionBinding()
      configureMediaPlaybackSession()

      mediaSessionCleanupRef.current = bindMediaSession({
        artist: eventTitle,
        artworkUrl: resolveDefaultArtworkUrl(),
        audioElement: element,
        onPause: () => {
          element.pause()
          syncPlaybackState()
        },
        onPlay: async () => {
          await roomRef.current?.startAudio()
          await element.play()
          syncPlaybackState()
        },
        title: channelName,
      })
    },
    [channelName, clearMediaSessionBinding, eventTitle, syncPlaybackState],
  )

  const attachAudioTrack = useCallback(
    (track: RemoteTrack) => {
      if (track.kind !== Track.Kind.Audio) {
        return false
      }

      const audio = audioRef.current

      if (!audio) {
        pendingTrackRef.current = track
        return false
      }

      if (attachedTrackRef.current?.sid === track.sid) {
        return true
      }

      if (attachedTrackRef.current) {
        attachedTrackRef.current.detach()
        attachedTrackRef.current = null
      }

      attachedTrackRef.current = track
      pendingTrackRef.current = null
      track.attach(audio)
      audio.volume = 1
      audio.setAttribute('playsinline', 'true')
      audio.setAttribute('webkit-playsinline', 'true')
      bindWebRtcMediaSession(audio)
      setHasAudioElement(true)
      setState('connected')
      setActiveTransport('webrtc')
      setMessage(`Connected to ${channelName}. Audio will play when a speaker is live.`)

      void audio.play().catch(() => {
        setNeedsAudioUnlock(true)
        setMessage(`Connected to ${channelName}. Tap "Enable audio" below if you do not hear the stream.`)
      })

      void roomRef.current?.startAudio().catch(() => {
        setNeedsAudioUnlock(true)
      })

      syncPlaybackState()
      return true
    },
    [bindWebRtcMediaSession, channelName, syncPlaybackState],
  )

  const attachExistingAudio = useCallback(
    (room: Room) => {
      for (const participant of room.remoteParticipants.values()) {
        for (const publication of participant.trackPublications.values()) {
          if (!isSpeakerAudioPublication(participant, publication)) {
            continue
          }

          if (!publication.isSubscribed) {
            void publication.setSubscribed(true)
          }

          if (publication.track) {
            return attachAudioTrack(publication.track)
          }
        }
      }

      return false
    },
    [attachAudioTrack, isSpeakerAudioPublication],
  )

  useEffect(() => {
    window.localStorage.setItem(
      'ablaut:last-listener-channel',
      JSON.stringify({ channelSlug, eventSlug, savedAt: new Date().toISOString() }),
    )

    return () => {
      clearWebRtcAudio()
      roomRef.current?.disconnect()
      roomRef.current = null
    }
  }, [channelSlug, eventSlug, clearWebRtcAudio])

  useEffect(() => {
    if (activeTransport === 'hls' || !pendingTrackRef.current) {
      return
    }

    attachAudioTrack(pendingTrackRef.current)
  }, [activeTransport, attachAudioTrack])

  useEffect(() => {
    const audio = audioRef.current

    if (!audio || !showWebRtcPlayer) {
      return
    }

    const onPlaying = () => {
      setIsBuffering(false)
      syncPlaybackState()
    }
    const onPause = () => {
      setIsBuffering(false)
      syncPlaybackState()
    }
    const onWaiting = () => setIsBuffering(true)
    const onCanPlay = () => setIsBuffering(false)

    audio.addEventListener('playing', onPlaying)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('waiting', onWaiting)
    audio.addEventListener('canplay', onCanPlay)

    return () => {
      audio.removeEventListener('playing', onPlaying)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('waiting', onWaiting)
      audio.removeEventListener('canplay', onCanPlay)
    }
  }, [showWebRtcPlayer, syncPlaybackState])

  useEffect(() => {
    function resumeWebRtcAfterForeground() {
      if (document.hidden || activeTransport !== 'webrtc') {
        return
      }

      const room = roomRef.current
      const audio = audioRef.current

      if (!room || !audio) {
        return
      }

      void room
        .startAudio()
        .then(() => {
          if (audio.paused) {
            return audio.play()
          }

          return undefined
        })
        .catch(() => {})
    }

    document.addEventListener('visibilitychange', resumeWebRtcAfterForeground)

    return () => {
      document.removeEventListener('visibilitychange', resumeWebRtcAfterForeground)
    }
  }, [activeTransport])

  async function unlockAudioPlayback() {
    const room = roomRef.current

    if (!room) {
      return
    }

    try {
      await room.startAudio()
      setNeedsAudioUnlock(false)

      const audio = audioRef.current

      if (audio) {
        await audio.play()
        syncPlaybackState()
      }

      setMessage(`Connected to ${channelName}. Audio playback is enabled.`)
    } catch (error) {
      console.error('Unable to unlock listener audio playback', error)
      setMessage(`Connected to ${channelName}. Your browser blocked audio playback — use the player controls below.`)
    }
  }

  const toggleWebRtcPlayback = useCallback(async () => {
    const audio = audioRef.current

    if (!audio || !hasAudioElement) {
      return
    }

    try {
      if (audio.paused) {
        await roomRef.current?.startAudio()
        await audio.play()
      } else {
        audio.pause()
      }
    } catch {
      setNeedsAudioUnlock(true)
    }

    syncPlaybackState()
  }, [hasAudioElement, syncPlaybackState])

  const toggleWebRtcMute = useCallback(() => {
    const audio = audioRef.current

    if (!audio) {
      return
    }

    audio.muted = !audio.muted
    setIsMuted(audio.muted)
  }, [])

  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPasswordError(null)
    setPasswordLoading(true)

    const response = await fetch('/api/listener/verify-password', {
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

    setPasswordLoading(false)

    if (!response.ok) {
      setPasswordError('Incorrect listener password.')
      return
    }

    setHasAccess(true)
    setMessage('Password accepted. You can connect to the stream.')
  }

  async function connectWebRtc() {
    if (webrtcEnabled === false) {
      setState('unavailable')
      setMessage('WebRTC is disabled for this channel. Use compatibility mode if available.')
      return
    }

    if (listenerTokenMode === 'private') {
      setState('unavailable')
      setMessage('This listener channel is private. Contact the event organizer for access.')
      return
    }

    if (needsPassword && !hasAccess) {
      setState('unavailable')
      setMessage('Enter the listener password before connecting.')
      return
    }

    setState('connecting')
    setMessage('Requesting listener token...')
    setActiveTransport(null)
    setNeedsAudioUnlock(false)

    skipDisconnectResetRef.current = true
    roomRef.current?.disconnect()
    roomRef.current = null
    clearWebRtcAudio()

    let response: Response

    try {
      response = await fetch('/api/livekit/listener-token', {
        body: JSON.stringify({ channelSlug, eventSlug }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })
    } catch (error) {
      console.error('Listener token request failed', error)
      setState('error')
      setMessage(
        compatibilityUrl
          ? 'Could not reach the server for a listener token. Try compatibility mode below.'
          : 'Could not reach the server for a listener token. Try again in a moment.',
      )
      return
    }

    if (!response.ok) {
      setState(response.status === 403 ? 'unavailable' : 'error')
      setMessage(
        response.status === 403
          ? 'Unable to connect. Check that a listener password is configured on the event.'
          : 'Unable to connect to this listener channel right now.',
      )
      return
    }

    let tokenPayload: ListenerTokenResponse

    try {
      tokenPayload = (await response.json()) as ListenerTokenResponse
    } catch (error) {
      console.error('Listener token response was not valid JSON', error)
      setState('error')
      setMessage(
        compatibilityUrl
          ? 'The server returned an invalid listener token. Try compatibility mode below.'
          : 'The server returned an invalid listener token. Try again in a moment.',
      )
      return
    }

    const { token, url } = tokenPayload

    if (!token || !url) {
      setState('error')
      setMessage(
        compatibilityUrl
          ? 'The server returned an incomplete listener token. Try compatibility mode below.'
          : 'The server returned an incomplete listener token. Try again in a moment.',
      )
      return
    }

    try {
      clearWebRtcAudio()

      const room = new Room({
        adaptiveStream: false,
        dynacast: false,
      })
      roomRef.current = room

      room
        .on(
          RoomEvent.TrackSubscribed,
          (track: RemoteTrack, publication: RemoteTrackPublication, participant: RemoteParticipant) => {
            if (isSpeakerAudioPublication(participant, publication)) {
              attachAudioTrack(track)
            }
          },
        )
        .on(RoomEvent.TrackPublished, (publication, participant) => {
          if (!isSpeakerAudioPublication(participant, publication)) {
            return
          }

          if (!publication.isSubscribed) {
            void publication.setSubscribed(true)
          }

          attachExistingAudio(room)
        })
        .on(RoomEvent.AudioPlaybackStatusChanged, () => {
          setNeedsAudioUnlock(room.canPlaybackAudio === false)
        })
        .on(RoomEvent.Disconnected, () => {
          clearWebRtcAudio()

          if (skipDisconnectResetRef.current) {
            skipDisconnectResetRef.current = false
            return
          }

          setState('idle')
          setActiveTransport(null)
          setNeedsAudioUnlock(false)
          setMessage('Disconnected from the listener channel.')
        })

      await room.connect(url, token, {
        autoSubscribe: true,
      })

      try {
        await room.startAudio()
      } catch (startAudioError) {
        console.warn('LiveKit startAudio failed; user may need to tap Enable audio', startAudioError)
        setNeedsAudioUnlock(true)
      }

      const attached = attachExistingAudio(room)
      setState('connected')
      setActiveTransport('webrtc')
      setMessage(
        attached
          ? `Connected to ${channelName}.`
          : `Connected to ${channelName}. Waiting for the speaker to go live…`,
      )

      if (!attached) {
        const retryUntil = Date.now() + 15000
        const retryTimer = window.setInterval(() => {
          if (Date.now() > retryUntil || attachExistingAudio(room)) {
            window.clearInterval(retryTimer)
          }
        }, 500)
      }
    } catch (error) {
      console.error('Listener WebRTC connection failed', error)
      setState('error')
      setActiveTransport(null)
      setMessage(
        compatibilityUrl
          ? 'The WebRTC connection failed. Try compatibility mode below.'
          : 'The WebRTC connection failed. Try again or use the fallback link if available.',
      )
    }
  }

  function connectCompatibilityMode() {
    if (!compatibilityUrl) {
      setState('unavailable')
      setMessage('Compatibility mode is not configured for this channel.')
      return
    }

    if (activeTransport === 'hls' || hlsRestarting) {
      return
    }

    void beginCompatibilityMode()
  }

  async function beginCompatibilityMode() {
    if (!compatibilityUrl) {
      return
    }

    unlockBrowserAudioPlayback()
    skipDisconnectResetRef.current = true
    setHlsRestarting(true)
    setState('connecting')
    setMessage('Starting a fresh LL-HLS stream...')

    const room = roomRef.current
    roomRef.current = null
    clearWebRtcAudio()
    room?.disconnect()

    try {
      const response = await fetch('/api/livekit/restart-hls-egress', {
        body: JSON.stringify({ channelSlug, eventSlug }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      if (response.ok) {
        const payload = (await response.json()) as RestartHlsResponse
        const nextUrl = payload.hlsUrl?.trim() || compatibilityUrl

        setCompatibilityUrl(nextUrl)
        setHlsManifestReady(false)
        setHlsSessionKey((current) => current + 1)
        setActiveTransport('hls')
        setNeedsAudioUnlock(false)
        setState('connected')
        setMessage(
          payload.hlsEgressStatus === 'live'
            ? 'Listening via LL-HLS. Each switch starts a fresh stream (~2–4s behind live).'
            : 'LL-HLS is starting. Playback will begin when the first audio segment is ready.',
        )
        return
      }

      if (response.status === 403) {
        setState('unavailable')
        setMessage('Verify listener access before using compatibility mode.')
        return
      }

      setHlsSessionKey((current) => current + 1)
      setActiveTransport('hls')
      setNeedsAudioUnlock(false)
      setState('connected')
      setMessage('Could not restart LL-HLS on the server. Trying the existing stream...')
    } catch (error) {
      console.error('Failed to restart LL-HLS egress', error)
      setHlsSessionKey((current) => current + 1)
      setActiveTransport('hls')
      setNeedsAudioUnlock(false)
      setState('connected')
      setMessage('Could not reach the server to restart LL-HLS. Trying the existing stream...')
    } finally {
      setHlsRestarting(false)
    }
  }

  async function listenNow() {
    await connectWebRtc()
  }

  const listenNowLabel =
    state === 'connecting'
      ? 'Connecting…'
      : state === 'connected' && activeTransport === 'webrtc'
        ? 'Listening'
        : 'Listen now'

  if (needsPassword && !hasAccess) {
    return (
      <div className="mt-6">
        <p className="text-sm leading-6" style={{ color: 'var(--us-muted)' }}>
          This channel requires the event listener password before you can connect.
        </p>
        <form className="mt-4 space-y-3" onSubmit={submitPassword}>
          <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
            Listener password
            <input
              className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
              onChange={(event) => setPassword(event.target.value)}
              style={{ borderColor: 'var(--us-border)' }}
              type="password"
              value={password}
            />
          </label>
          {passwordError ? (
            <p className="text-sm" style={{ color: 'var(--us-danger)' }}>
              {passwordError}
            </p>
          ) : null}
          <button className="us-button-primary w-full px-6 py-3 text-sm font-medium" disabled={passwordLoading} type="submit">
            {passwordLoading ? 'Checking...' : 'Continue'}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="mt-6">
      <button
        type="button"
        className="us-button-primary w-full px-6 py-4 text-lg font-semibold"
        disabled={state === 'connecting' || hlsRestarting || (state === 'connected' && activeTransport === 'webrtc')}
        onClick={() => {
          void listenNow()
        }}
      >
        {listenNowLabel}
      </button>

      {message && activeTransport !== 'hls' ? (
        <p className="mt-4 text-sm leading-6" style={{ color: state === 'error' ? 'var(--us-danger)' : 'var(--us-muted)' }}>
          {message}
        </p>
      ) : null}

      {needsAudioUnlock && activeTransport === 'webrtc' ? (
        <button
          type="button"
          className="us-button-secondary mt-3 w-full px-6 py-3 text-sm font-medium"
          onClick={() => {
            void unlockAudioPlayback()
          }}
        >
          Enable audio
        </button>
      ) : null}

      {state === 'connected' && activeTransport === 'webrtc' && !hasAudioElement ? (
        <p className="mt-3 rounded-2xl border px-4 py-3 text-sm leading-6" style={{ borderColor: 'var(--us-border)', color: 'var(--us-muted)' }}>
          Connected. Start speaking on the speaker page for this channel, then audio will play here.
        </p>
      ) : null}

      {state === 'connected' && activeTransport === 'webrtc' && hasAudioElement && isMobileWebListener() ? (
        <p className="mt-3 rounded-2xl border px-4 py-3 text-sm leading-6" style={{ borderColor: 'var(--us-border)', color: 'var(--us-muted)' }}>
          Pause and resume from your lock screen or notification shade while listening.
        </p>
      ) : null}

      <audio ref={audioRef} className="hidden" playsInline preload="auto" />

      {showWebRtcPlayer ? (
        <LiveAudioPlayerShell
          disabled={!hasAudioElement || state === 'connecting'}
          isBuffering={isBuffering || state === 'connecting'}
          isMuted={isMuted}
          isPlaying={isPlaying}
          label="Live"
          mode="Live"
          onToggleMute={toggleWebRtcMute}
          onTogglePlayback={() => {
            void toggleWebRtcPlayback()
          }}
        />
      ) : null}

      {activeTransport === 'hls' && compatibilityUrl ? (
        <HlsAudioPlayer
          hlsUrl={compatibilityUrl}
          key={hlsSessionKey}
          manifestReady={hlsManifestReady}
          onError={handleHlsError}
          sessionKey={hlsSessionKey}
        />
      ) : null}

      <details className="mt-5 rounded-2xl border px-4 py-4" style={{ borderColor: 'var(--us-border)' }}>
        <summary className="cursor-pointer text-sm font-semibold" style={{ color: 'var(--us-green-dark)' }}>
          Having trouble?
        </summary>
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className={`us-chip ${activeTransport === 'webrtc' ? 'us-chip-blue' : 'us-chip-muted'}`}>
              {activeTransport === 'webrtc' ? 'Live: low-latency' : 'Primary: low-latency'}
            </span>
            {compatibilityUrl ? (
              <span className={`us-chip ${activeTransport === 'hls' ? 'us-chip-blue' : 'us-chip-muted'}`}>
                {activeTransport === 'hls' ? 'Live: compatibility mode' : 'Fallback: compatibility mode'}
              </span>
            ) : (
              <span className="us-chip us-chip-muted">No compatibility fallback</span>
            )}
          </div>

          {showSafariHint ? (
            <p className="rounded-2xl border px-4 py-3 text-sm leading-6" style={{ borderColor: 'var(--us-border)', color: 'var(--us-muted)' }}>
              On iPhone Safari, listening usually works right away. If not, try compatibility mode below.
            </p>
          ) : null}

          {compatibilityUrl ? (
            <button
              type="button"
              className={`${activeTransport === 'hls' ? 'us-button-primary' : 'us-button-secondary'} w-full px-6 py-3 text-sm font-medium`}
              disabled={activeTransport === 'hls' || hlsRestarting}
              onClick={connectCompatibilityMode}
            >
              {hlsRestarting
                ? 'Preparing compatibility stream…'
                : activeTransport === 'hls'
                  ? 'Listening via compatibility mode'
                  : 'Try compatibility mode (slower, more reliable)'}
            </button>
          ) : null}

          {state === 'connected' && activeTransport === 'webrtc' ? (
            <button
              type="button"
              className="us-button-secondary w-full px-6 py-3 text-sm font-medium"
              disabled={hlsRestarting}
              onClick={connectWebRtc}
            >
              Reconnect
            </button>
          ) : null}

          {hlsEnabled && !compatibilityUrl && hlsEgressStatus === 'error' ? (
            <p className="rounded-2xl border px-4 py-3 text-sm leading-6" style={{ borderColor: 'var(--us-border)', color: 'var(--us-danger)' }}>
              Compatibility streaming is unavailable right now. Contact the event organizer.
            </p>
          ) : null}

          {hlsEnabled && !compatibilityUrl && hlsEgressStatus !== 'error' ? (
            <p className="rounded-2xl border px-4 py-3 text-sm leading-6" style={{ borderColor: 'var(--us-border)', color: 'var(--us-muted)' }}>
              Compatibility mode appears after a speaker connects. It is typically a few seconds behind live.
            </p>
          ) : null}

          {activeTransport !== 'hls' && fallbackUrl && !hlsUrl ? (
            <a
              href={fallbackUrl}
              className="us-button-secondary inline-flex w-full justify-center px-6 py-3 text-sm font-medium"
              rel="noreferrer"
              target="_blank"
            >
              Open external fallback stream
            </a>
          ) : null}
        </div>
      </details>
    </div>
  )
}
