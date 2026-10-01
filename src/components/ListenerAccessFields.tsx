'use client'

import Link from 'next/link'
import { useState } from 'react'

type ListenerTokenMode = 'password' | 'private' | 'public'

type ListenerAccessFieldsProps = {
  defaultMode?: ListenerTokenMode | null
  eventListenerPasswordConfigured: boolean
  eventSlug: string
}

export function ListenerAccessFields({
  defaultMode = 'public',
  eventListenerPasswordConfigured,
  eventSlug,
}: ListenerAccessFieldsProps) {
  const [mode, setMode] = useState<ListenerTokenMode>(defaultMode ?? 'public')
  const missingEventPassword = mode === 'password' && !eventListenerPasswordConfigured

  return (
    <div className="rounded-2xl border px-4 py-4" style={{ borderColor: 'var(--us-border)' }}>
      <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
        Listener access
      </p>
      <p className="mt-2 text-xs leading-5" style={{ color: 'var(--us-muted)' }}>
        Password mode uses one listener password for the whole event (not per channel). Set it under event Settings.
      </p>
      <label className="mt-4 block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
        Listener token mode
        <select
          className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
          name="listenerTokenMode"
          onChange={(event) => setMode(event.target.value as ListenerTokenMode)}
          style={{ borderColor: 'var(--us-border)' }}
          value={mode}
        >
          <option value="public">Public — anyone with the link can listen</option>
          <option value="password">Password — listeners must enter the event password</option>
          <option value="private">Private — listeners blocked until admin flow is extended</option>
        </select>
      </label>

      {missingEventPassword ? (
        <div className="us-callout-warning mt-4 rounded-2xl border px-4 py-4">
          <p className="text-sm font-semibold" style={{ color: 'var(--us-warning-ink)' }}>
            Event listener password is missing
          </p>
          <p className="mt-2 text-sm leading-6" style={{ color: 'var(--us-text)' }}>
            This channel requires a listener password, but the event does not have one yet. Listeners will not be able to
            connect until you set it on the event.
          </p>
          <Link
            className="us-button-primary mt-4 inline-flex px-4 py-2.5 text-sm font-medium"
            href={`/events/${eventSlug}?settings=open`}
          >
            Set listener password on event
          </Link>
        </div>
      ) : null}

      {mode === 'password' && eventListenerPasswordConfigured ? (
        <p className="mt-3 text-xs leading-5" style={{ color: 'var(--us-green-dark)' }}>
          Event listener password is configured. Listeners on this channel will be prompted for it.
        </p>
      ) : null}
    </div>
  )
}
