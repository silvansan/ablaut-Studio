import {
  OrganizationSelectField,
  organizationIdFromEvent,
  type OrganizationOption,
} from '@/components/OrganizationSelectField'
import type { Event } from '@/payload-types'

type EventFormProps = {
  action?: (formData: FormData) => Promise<void>
  embedded?: boolean
  event?: Event
  organizationId?: number
  organizations?: OrganizationOption[]
  submitLabel: string
  variant?: 'drawer' | 'full'
}

function dateTimeValue(value?: string | null): string {
  if (!value) {
    return ''
  }

  return new Date(value).toISOString().slice(0, 16)
}

export function EventForm({
  action,
  embedded = false,
  event,
  organizationId,
  organizations = [],
  submitLabel,
  variant = 'full',
}: EventFormProps) {
  const isDrawer = variant === 'drawer'
  const fixedOrganizationId = organizationId ?? organizationIdFromEvent(event)
  const showOrganizationSelector = !organizationId && organizations.length > 0
  const canSubmit = Boolean(event) || Boolean(organizationId) || organizations.length > 0
  const useEmbedded = embedded || (isDrawer && !action)
  const Wrapper = useEmbedded ? 'div' : 'form'
  const wrapperClassName = isDrawer ? 'space-y-5' : 'us-panel space-y-5 px-6 py-6'

  return (
    <Wrapper
      {...(useEmbedded ? {} : { action })}
      className={wrapperClassName}
    >
      {event ? (
        <>
          <input name="id" type="hidden" value={event.id} />
          <input name="originalSlug" type="hidden" value={event.slug} />
        </>
      ) : null}
      {organizationId ? <input name="organizationId" type="hidden" value={organizationId} /> : null}
      {!organizationId && !showOrganizationSelector && fixedOrganizationId ? (
        <input name="organizationId" type="hidden" value={fixedOrganizationId} />
      ) : null}
      {showOrganizationSelector ? (
        <OrganizationSelectField
          defaultOrganizationId={fixedOrganizationId}
          organizations={organizations}
        />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
          Title
          <input
            className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
            defaultValue={event?.title ?? ''}
            name="title"
            required
            style={{ borderColor: 'var(--us-border)' }}
          />
        </label>

        <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
          URL name
          <input
            className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
            defaultValue={event?.slug ?? ''}
            name="slug"
            style={{ borderColor: 'var(--us-border)' }}
          />
          <span className="mt-2 block text-xs leading-5" style={{ color: 'var(--us-muted)' }}>
            Used in listen and speak links. Changing it breaks existing QR codes and bookmarks.
          </span>
        </label>
      </div>

      <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
        Description
        <textarea
          className="mt-2 min-h-28 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
          defaultValue={event?.description ?? ''}
          name="description"
          style={{ borderColor: 'var(--us-border)' }}
        />
      </label>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
          Status
          <select
            className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
            defaultValue={event?.status ?? 'active'}
            name="status"
            style={{ borderColor: 'var(--us-border)' }}
          >
            <option value="active">Active</option>
            <option value="draft">Draft (inactive)</option>
            <option value="archived">Archived</option>
          </select>
        </label>

        <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
          Start
          <input
            className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
            defaultValue={dateTimeValue(event?.dateStart)}
            name="dateStart"
            style={{ borderColor: 'var(--us-border)' }}
            type="datetime-local"
          />
        </label>

        <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
          End
          <input
            className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
            defaultValue={dateTimeValue(event?.dateEnd)}
            name="dateEnd"
            style={{ borderColor: 'var(--us-border)' }}
            type="datetime-local"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
          Location
          <input
            className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
            defaultValue={event?.location ?? ''}
            name="location"
            style={{ borderColor: 'var(--us-border)' }}
          />
        </label>

        <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
          Default language
          <input
            className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
            defaultValue={event?.defaultLanguage ?? 'en'}
            name="defaultLanguage"
            style={{ borderColor: 'var(--us-border)' }}
          />
        </label>
      </div>

      <label className="flex items-start gap-3 rounded-2xl bg-white/70 px-4 py-3 text-sm" style={{ color: 'var(--us-text)' }}>
        <input className="mt-1" defaultChecked={event?.publicListenerEnabled ?? true} name="publicListenerEnabled" type="checkbox" />
        <span>Public listener pages enabled</span>
      </label>

      <details className="rounded-2xl border px-4 py-4" style={{ borderColor: 'var(--us-border)' }}>
        <summary className="cursor-pointer text-sm font-semibold" style={{ color: 'var(--us-green-dark)' }}>
          Sharing and access options
        </summary>
        <div className="mt-4 space-y-4">
      <div className="rounded-2xl border px-4 py-4" style={{ borderColor: 'var(--us-border)' }}>
        <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
          Listener access
        </p>
        <label className="mt-4 flex items-start gap-3 rounded-2xl bg-white/70 px-4 py-3 text-sm" style={{ color: 'var(--us-text)' }}>
          <input className="mt-1" defaultChecked={event?.unifiedListenerQrEnabled ?? false} name="unifiedListenerQrEnabled" type="checkbox" />
          <span>One QR for all languages (listeners choose a channel after scanning)</span>
        </label>
        <label className="mt-3 flex items-start gap-3 rounded-2xl bg-white/70 px-4 py-3 text-sm" style={{ color: 'var(--us-text)' }}>
          <input className="mt-1" defaultChecked={event?.listenerPasswordEnabled ?? false} name="listenerPasswordEnabled" type="checkbox" />
          <span>Require event listener password (used when channels use password mode)</span>
        </label>
        <label className="mt-3 block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
          Listener password
          <input
            autoComplete="new-password"
            className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
            name="listenerPassword"
            placeholder={event?.listenerPasswordHash ? 'Leave blank to keep current password' : 'Set listener password'}
            style={{ borderColor: 'var(--us-border)' }}
            type="password"
          />
        </label>
      </div>

      <div className="rounded-2xl border px-4 py-4" style={{ borderColor: 'var(--us-border)' }}>
        <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
          Speaker access
        </p>
        <label className="mt-4 flex items-start gap-3 rounded-2xl bg-white/70 px-4 py-3 text-sm" style={{ color: 'var(--us-text)' }}>
          <input className="mt-1" defaultChecked={event?.speakerPasswordEnabled ?? false} name="speakerPasswordEnabled" type="checkbox" />
          <span>Require event speaker password (unless a channel sets its own)</span>
        </label>
        <label className="mt-3 block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
          Speaker password
          <input
            autoComplete="new-password"
            className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
            name="speakerPassword"
            placeholder={event?.speakerPasswordHash ? 'Leave blank to keep current password' : 'Set speaker password'}
            style={{ borderColor: 'var(--us-border)' }}
            type="password"
          />
        </label>
      </div>
        </div>
      </details>

      <button
        className="us-button-primary px-5 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!canSubmit}
        type="submit"
      >
        {submitLabel}
      </button>
    </Wrapper>
  )
}
