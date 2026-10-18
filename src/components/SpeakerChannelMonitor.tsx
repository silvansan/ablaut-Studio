'use client'

import { Room, RoomEvent, Track, type RemoteParticipant, type RemoteTrack, type RemoteTrackPublication } from 'livekit-client'
import { useCallback, useEffect, useRef, useState } from 'react'

import { LiveAudioPlayerShell } from '@/components/LiveAudioPlayerShell'

type MonitorChannel = {
  enabled?: boolean | null
  languageLabel?: string | null
  name: string
  slug: string
  webrtcEnabled?: boolean | null
}

type SpeakerChannelMonitorProps = {
  currentChannel: MonitorChannel
  eventSlug: string
  fallbackUrl?: string | null
  monitorChannels: MonitorChannel[]
  publishChannelSlug: string
}

type ListenerTokenResponse = {
  error?: string
  token: string
  url: string
}

type MonitorState = 'idle' | 'connecting' | 'connected' | 'unavailable' | 'error'

function monitorChannelLabel(channel: MonitorChannel, isCurrentChannel: boolean): string {
  if (isCurrentChannel) {
    return 'This channel'
  }

  if (channel.languageLabel && channel.languageLabel !== channel.name) {
    return `${channel.name} (${channel.languageLabel})`
  }

  return channel.name
}

function monitorChannelDescription(channel: MonitorChannel, isCurrentChannel: boolean): string {
  if (isCurrentChannel) {
    return channel.name
  }

  return channel.languageLabel ?? channel.name
}

function isSpeakerAudioTrack(participant: RemoteParticipant, track: RemoteTrack): boolean {
  return track.kind === Track.Kind.Audio && participant.identity.startsWith('speaker_')
}

export function SpeakerChannelMonitor({
  currentChannel,
  eventSlug,
  fallbackUrl,
  monitorChannels,
  publishChannelSlug,
}: SpeakerChannelMonitorProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const attachedTrackRef = useRef<RemoteTrack | null>(null)
  const monitorSessionRef = useRef(0)
  const roomRef = useRef<Room | null>(null)
  const [activeChannelSlug, setActiveChannelSlug] = useState(currentChannel.slug)
  const [message, setMessage] = useState<string | null>(null)
  const [state, setState] = useState<MonitorState>('idle')
  const [isPlaying, setIsPlaying] = useState(false)
  const [isBuffering, setIsBuffering] = useState(false)
  const [isMuted, setIsMuted] = useState(false)

  const otherChannels = monitorChannels.filter((channel) => channel.slug !== currentChannel.slug)
  const activeChannel =
    activeChannelSlug === currentChannel.slug
      ? currentChannel
      : otherChannels.find((channel) => channel.slug === activeChannelSlug) ?? currentChannel
  const showPlayer = state === 'connecting' || state === 'connected'

  const syncPlaybackState = useCallback(() => {
    const audio = audioRef.current

    if (!audio) {
      return
    }

    setIsPlaying(!audio.paused && !audio.ended)
    setIsMuted(audio.muted)
  }, [])

  useEffect(() => {
    const audio = audioRef.current

    if (!audio) {
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
  }, [syncPlaybackState, showPlayer])

  useEffect(() => {
    return () => {
      monitorSessionRef.current += 1
      detachAudioTrack()
      roomRef.current?.disconnect()
      roomRef.current = null
    }
  }, [])

  function detachAudioTrack() {
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

    setIsPlaying(false)
    setIsBuffering(false)
  }

  function attachSpeakerTrack(
    track: RemoteTrack,
    participant: RemoteParticipant,
    channel: MonitorChannel,
    session: number,
  ) {
    if (session !== monitorSessionRef.current) {
      return
    }

    if (!isSpeakerAudioTrack(participant, track)) {
      return
    }

    const audio = audioRef.current

    if (!audio) {
      return
    }

    if (attachedTrackRef.current?.sid === track.sid) {
      return
    }

    detachAudioTrack()
    attachedTrackRef.current = track
    track.attach(audio)
    void audio.play().catch(() => {})

    setState('connected')
    setMessage(
      channel.slug === currentChannel.slug
        ? 'Monitoring listener audio on this channel.'
        : `Monitoring listener audio for ${monitorChannelDescription(channel, false)}.`,
    )
    syncPlaybackState()
  }

  function attachSpeakerTrackFromRoom(room: Room, channel: MonitorChannel, session: number) {
    for (const participant of room.remoteParticipants.values()) {
      if (!participant.identity.startsWith('speaker_')) {
        continue
      }

      for (const publication of participant.trackPublications.values()) {
        if (publication.track) {
          attachSpeakerTrack(publication.track, participant, channel, session)
          return
        }
      }
    }
  }

  function bindRoomAudioHandlers(room: Room, channel: MonitorChannel, session: number) {
    room.on(
      RoomEvent.TrackSubscribed,
      (track: RemoteTrack, _publication: RemoteTrackPublication, participant: RemoteParticipant) => {
        attachSpeakerTrack(track, participant, channel, session)
      },
    )

    room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
      if (attachedTrackRef.current?.sid === track.sid) {
        detachAudioTrack()
      }
    })

    room.on(RoomEvent.Disconnected, () => {
      if (session !== monitorSessionRef.current) {
        return
      }

      detachAudioTrack()
      setState('idle')
      setMessage('Stopped monitoring the listener feed.')
    })
  }

  async function startMonitor(channelSlug = activeChannelSlug) {
    const selectedChannel =
      channelSlug === currentChannel.slug
        ? currentChannel
        : otherChannels.find((channel) => channel.slug === channelSlug) ?? currentChannel
    const selectedLabel = monitorChannelDescription(selectedChannel, selectedChannel.slug === currentChannel.slug)

    if (selectedChannel.enabled === false) {
      setState('unavailable')
      setMessage('This channel is disabled.')
      return
    }

    if (selectedChannel.webrtcEnabled === false) {
      setState('unavailable')
      setMessage('WebRTC is disabled for listeners on this channel.')
      return
    }

    stopMonitor(false)
    const session = monitorSessionRef.current + 1
    monitorSessionRef.current = session
    setActiveChannelSlug(selectedChannel.slug)
    setState('connecting')
    setIsBuffering(true)
    setMessage(
      selectedChannel.slug === currentChannel.slug
        ? 'Connecting to this channel...'
        : `Connecting to ${selectedLabel}...`,
    )

    const response = await fetch('/api/livekit/listener-token', {
      body: JSON.stringify({
        channelSlug: selectedChannel.slug,
        eventSlug,
        speakerPublishChannelSlug: publishChannelSlug,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })
    const tokenResponse = (await response.json().catch(() => null)) as ListenerTokenResponse | null

    if (session !== monitorSessionRef.current) {
      return
    }

    if (!response.ok || !tokenResponse?.token || !tokenResponse.url) {
      setState(response.status === 403 ? 'unavailable' : 'error')
      setIsBuffering(false)
      setMessage(tokenResponse?.error ?? 'Unable to connect to the listener feed right now.')
      return
    }

    try {
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
      })
      roomRef.current = room
      bindRoomAudioHandlers(room, selectedChannel, session)

      await room.connect(tokenResponse.url, tokenResponse.token, {
        autoSubscribe: true,
      })

      if (session !== monitorSessionRef.current) {
        room.disconnect()
        return
      }

      attachSpeakerTrackFromRoom(room, selectedChannel, session)
      setState('connected')
      setMessage(
        selectedChannel.slug === currentChannel.slug
          ? 'Connected to this channel. Waiting for live audio if no player appears yet.'
          : `Connected to ${selectedLabel}. Waiting for live audio if no player appears yet.`,
      )
    } catch (error) {
      if (session !== monitorSessionRef.current) {
        return
      }

      console.error('Speaker listener monitor failed', error)
      const errorMessage = error instanceof Error ? error.message : null
      setState('error')
      setIsBuffering(false)
      setMessage(errorMessage ? `Listener monitor failed: ${errorMessage}` : 'Listener monitor failed.')
    }
  }

  function stopMonitor(updateMessage = true) {
    monitorSessionRef.current += 1
    detachAudioTrack()
    roomRef.current?.disconnect()
    roomRef.current = null
    setState('idle')

    if (updateMessage) {
      setMessage('Stopped monitoring the listener feed.')
    }
  }

  const togglePlayback = useCallback(async () => {
    const audio = audioRef.current

    if (!audio || !showPlayer) {
      return
    }

    try {
      if (audio.paused) {
        await audio.play()
      } else {
        audio.pause()
      }
    } catch {
      setMessage('Unable to start playback. Tap play again.')
    }

    syncPlaybackState()
  }, [showPlayer, syncPlaybackState])

  const toggleMute = useCallback(() => {
    const audio = audioRef.current

    if (!audio) {
      return
    }

    audio.muted = !audio.muted
    setIsMuted(audio.muted)
  }, [])

  return (
    <div className="rounded-3xl border bg-white/70 px-4 py-4" style={{ borderColor: 'var(--us-border)' }}>
      <p className="text-sm font-semibold" style={{ color: 'var(--us-green-dark)' }}>
        Listener monitor
      </p>
      <p className="mt-1 text-xs leading-5" style={{ color: 'var(--us-muted)' }}>
        Hear what listeners hear on this channel or another channel in the same event. Choose a source below, then start monitoring.
      </p>

      <label className="mt-4 block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
        Monitor channel
        <select
          className="us-input mt-2"
          disabled={state === 'connecting'}
          onChange={(event) => {
            stopMonitor()
            setActiveChannelSlug(event.target.value)
          }}
          value={activeChannelSlug}
        >
          <option value={currentChannel.slug}>{monitorChannelLabel(currentChannel, true)}</option>
          {otherChannels.map((channel) => (
            <option
              disabled={channel.enabled === false || channel.webrtcEnabled === false}
              key={channel.slug}
              value={channel.slug}
            >
              {monitorChannelLabel(channel, false)}
              {channel.enabled === false ? ' (disabled)' : channel.webrtcEnabled === false ? ' (no WebRTC)' : ''}
            </option>
          ))}
        </select>
        <span className="mt-2 block text-xs leading-5" style={{ color: 'var(--us-muted)' }}>
          {otherChannels.length === 0
            ? `Only ${currentChannel.name} is available in this event right now.`
            : activeChannel.slug === currentChannel.slug
              ? `Listening to ${currentChannel.name} while you publish here.`
              : `Listening to ${monitorChannelDescription(activeChannel, false)} while you publish on ${currentChannel.name}.`}
        </span>
      </label>

      <div className="mt-4 flex flex-wrap gap-2">
        {state === 'connected' ? (
          <button type="button" className="us-button-primary px-4 py-2.5 text-sm font-medium" onClick={() => stopMonitor()}>
            Stop listening
          </button>
        ) : (
          <button
            type="button"
            className="us-button-primary px-4 py-2.5 text-sm font-medium"
            disabled={state === 'connecting'}
            onClick={() => startMonitor(activeChannelSlug)}
          >
            {state === 'connecting' ? 'Connecting...' : 'Listen here'}
          </button>
        )}
        {fallbackUrl && activeChannel.slug === currentChannel.slug ? (
          <a href={fallbackUrl} className="us-button-secondary px-4 py-2.5 text-sm font-medium" rel="noreferrer" target="_blank">
            Open fallback
          </a>
        ) : null}
      </div>
      {message ? (
        <p className="mt-3 text-sm leading-6" style={{ color: state === 'error' ? 'var(--us-danger)' : 'var(--us-muted)' }}>
          {message}
        </p>
      ) : null}

      <audio ref={audioRef} className="hidden" playsInline preload="auto" />

      {showPlayer ? (
        <LiveAudioPlayerShell
          disabled={state === 'connecting'}
          isBuffering={isBuffering}
          isMuted={isMuted}
          isPlaying={isPlaying}
          label="Live"
          mode={`Monitoring ${monitorChannelDescription(activeChannel, activeChannel.slug === currentChannel.slug)}`}
          onToggleMute={toggleMute}
          onTogglePlayback={() => {
            void togglePlayback()
          }}
        />
      ) : null}
    </div>
  )
}
