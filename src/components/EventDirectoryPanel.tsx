'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'

import { ListGroupRow } from '@/components/ListGroupRow'
import { assignGroupTints } from '@/lib/list-group-tints'

type EventDirectoryAccessProps = {
  eventSlug: string
  hasEventListenerSession: boolean
  listenerPasswordRequired: boolean
}

export function EventDirectoryAccess({
  eventSlug,
  hasEventListenerSession: initialHasEventListenerSession,
  listenerPasswordRequired,
}: EventDirectoryAccessProps) {
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [hasAccess, setHasAccess] = useState(!listenerPasswordRequired || initialHasEventListenerSession)

  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPasswordError(null)
    setPasswordLoading(true)

    const response = await fetch('/api/listener/verify-password', {
      body: JSON.stringify({
        directory: true,
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
  }

  if (!listenerPasswordRequired || hasAccess) {
    return null
  }

  return (
    <form className="mt-6 rounded-2xl border bg-white/70 px-4 py-4 text-left" onSubmit={submitPassword} style={{ borderColor: 'var(--us-border)' }}>
      <p className="text-sm font-semibold" style={{ color: 'var(--us-green-dark)' }}>
        Event listener password
      </p>
      <p className="mt-1 text-sm leading-6" style={{ color: 'var(--us-muted)' }}>
        Enter the event password once to browse all channels.
      </p>
      <label className="mt-4 block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
        Password
        <input
          className="us-input mt-2"
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          value={password}
        />
      </label>
      {passwordError ? (
        <p className="mt-3 text-sm" style={{ color: 'var(--us-danger)' }}>
          {passwordError}
        </p>
      ) : null}
      <button className="us-button-primary mt-4 px-4 py-2.5 text-sm font-medium" disabled={passwordLoading} type="submit">
        {passwordLoading ? 'Checking...' : 'Continue'}
      </button>
    </form>
  )
}

type EventDirectoryChannelListProps = {
  channels: Array<{
    description?: string | null
    listenerTokenMode?: 'public' | 'password' | 'private' | null
    name: string
    slug: string
  }>
  eventSlug: string
  hasAccess: boolean
}

export function EventDirectoryChannelList({ channels, eventSlug, hasAccess }: EventDirectoryChannelListProps) {
  const router = useRouter()
  const sortedChannels = [...channels].sort((a, b) => a.name.localeCompare(b.name))
  const [selectedSlug, setSelectedSlug] = useState(sortedChannels[0]?.slug ?? '')

  if (!hasAccess) {
    return null
  }

  const tintedChannels = assignGroupTints(sortedChannels, () => eventSlug)

  if (tintedChannels.length === 0) {
    return (
      <p className="mt-6 rounded-2xl border px-4 py-4 text-sm leading-7" style={{ borderColor: 'var(--us-border)', color: 'var(--us-muted)' }}>
        No listener channels are available for this event right now.
      </p>
    )
  }

  function openSelectedChannel() {
    if (!selectedSlug) {
      return
    }

    router.push(`/listen/${eventSlug}/${selectedSlug}`)
  }

  return (
    <div className="mt-6 space-y-4 text-left">
      <div className="rounded-2xl border bg-white/70 px-4 py-4" style={{ borderColor: 'var(--us-border)' }}>
        <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
          Choose a channel
          <select
            className="us-input mt-2"
            onChange={(event) => setSelectedSlug(event.target.value)}
            value={selectedSlug}
          >
            {tintedChannels.map((channel) => (
              <option key={channel.slug} value={channel.slug}>
                {channel.name}
              </option>
            ))}
          </select>
        </label>
        <button
          className="us-button-primary mt-4 w-full px-6 py-3 text-sm font-medium"
          disabled={!selectedSlug}
          onClick={openSelectedChannel}
          type="button"
        >
          Listen to selected channel
        </button>
      </div>

      <ul className="space-y-3">
      {tintedChannels.map((channel) => (
        <li key={channel.slug}>
          <ListGroupRow
            as={Link}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-4 transition hover:-translate-y-0.5 hover:shadow-md"
            href={`/listen/${eventSlug}/${channel.slug}`}
            rowTint={channel.rowTint}
            style={{ borderColor: 'var(--us-border)' }}
          >
            <div>
              <p className="font-semibold" style={{ color: 'var(--us-green-dark)' }}>
                {channel.name}
              </p>
              {channel.description ? (
                <p className="mt-1 text-sm" style={{ color: 'var(--us-muted)' }}>
                  {channel.description}
                </p>
              ) : null}
            </div>
            <span className="us-chip us-chip-blue">Listen</span>
          </ListGroupRow>
        </li>
      ))}
      </ul>
    </div>
  )
}
