'use client'

import { useEffect, useRef, useState } from 'react'

import {
  createChannelFeedbackAction,
  updateChannelFeedbackAction,
} from '@/app/events/[eventSlug]/channels/actions'
import { useActionFeedback } from '@/components/AppToastProvider'
import { ChannelForm } from '@/components/ChannelForm'
import { Drawer } from '@/components/Drawer'
import type { Channel } from '@/payload-types'

type ChannelDrawerProps = {
  /** Present when editing; absent when adding. */
  channel?: Channel
  eventListenerPasswordConfigured: boolean
  eventSlug: string
  onClose: () => void
  open: boolean
}

/** Add or edit a channel without leaving the event. Saving closes the drawer and refreshes the list. */
export function ChannelDrawer({ channel, eventListenerPasswordConfigured, eventSlug, onClose, open }: ChannelDrawerProps) {
  const { formAction, pending, state } = useActionFeedback(
    channel ? updateChannelFeedbackAction : createChannelFeedbackAction,
  )
  const handled = useRef<typeof state | null>(null)

  useEffect(() => {
    if (state.ok && state.message && handled.current !== state) {
      handled.current = state
      onClose()
    }
  }, [onClose, state])

  return (
    <Drawer
      onClose={onClose}
      open={open}
      title={channel ? `Edit ${channel.name}` : 'Add channel'}
    >
      <form action={formAction} aria-busy={pending}>
        {state.message && !state.ok ? (
          <p className="mb-4 border px-3 py-2 text-sm" role="alert" style={{ borderColor: 'var(--us-danger)', borderRadius: 'var(--us-r-control)', color: 'var(--us-danger)' }}>
            {state.message}
          </p>
        ) : null}
        <ChannelForm
          channel={channel}
          chrome="none"
          embedded
          eventListenerPasswordConfigured={eventListenerPasswordConfigured}
          eventSlug={eventSlug}
          submitLabel={pending ? 'Saving...' : channel ? 'Save channel' : 'Add channel'}
        />
      </form>
    </Drawer>
  )
}

type AddChannelButtonProps = {
  defaultOpen?: boolean
  eventListenerPasswordConfigured: boolean
  eventSlug: string
}

export function AddChannelButton({ defaultOpen = false, eventListenerPasswordConfigured, eventSlug }: AddChannelButtonProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <>
      <button className="us-button-primary px-3 py-1.5 text-sm font-medium" onClick={() => setOpen(true)} type="button">
        Add channel
      </button>
      <ChannelDrawer
        eventListenerPasswordConfigured={eventListenerPasswordConfigured}
        eventSlug={eventSlug}
        onClose={() => setOpen(false)}
        open={open}
      />
    </>
  )
}
