import { Field, FormSection, SwitchField } from '@/components/FormFields'
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
  const wrapperClassName = isDrawer ? 'space-y-4' : 'us-panel space-y-4 px-6 py-6'

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

      <div className="grid gap-3 md:grid-cols-12">
        <Field className="md:col-span-8" label="Title">
          <input className="us-input" defaultValue={event?.title ?? ''} name="title" required />
        </Field>
        <Field className="md:col-span-4" label="Status">
          <select className="us-input" defaultValue={event?.status ?? 'active'} name="status">
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </Field>
        <Field className="md:col-span-4" label="Starts">
          <input className="us-input" defaultValue={dateTimeValue(event?.dateStart)} name="dateStart" type="datetime-local" />
        </Field>
        <Field className="md:col-span-4" label="Ends">
          <input className="us-input" defaultValue={dateTimeValue(event?.dateEnd)} name="dateEnd" type="datetime-local" />
        </Field>
        <Field className="md:col-span-4" label="Language">
          <input className="us-input" defaultValue={event?.defaultLanguage ?? 'en'} name="defaultLanguage" />
        </Field>
        <Field className="md:col-span-12" label="Description">
          <textarea className="us-input" defaultValue={event?.description ?? ''} name="description" rows={2} />
        </Field>
      </div>

      <div>
        <SwitchField
          defaultChecked={event?.publicListenerEnabled ?? true}
          hint="Off hides the public listener pages for every channel."
          label="Public listener pages"
          name="publicListenerEnabled"
        />
        <SwitchField
          defaultChecked={event?.unifiedListenerQrEnabled ?? false}
          hint="Listeners pick their channel after scanning."
          label="One QR for all languages"
          name="unifiedListenerQrEnabled"
        />
        <SwitchField
          defaultChecked={event?.privateLinksEnabled ?? false}
          hint="Random, unguessable links instead of readable ones."
          label="Private links"
          name="privateLinksEnabled"
          note="Turning this on or off changes every listener and speaker link and QR code."
        />
      </div>

      <FormSection title="Passwords and URL">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <SwitchField
              defaultChecked={event?.listenerPasswordEnabled ?? false}
              hint="Used by channels set to password mode."
              label="Listener password"
              name="listenerPasswordEnabled"
            />
            <Field label="New listener password">
              <input
                autoComplete="new-password"
                className="us-input"
                name="listenerPassword"
                placeholder={event?.listenerPasswordHash ? 'Leave blank to keep the current one' : 'Set a password'}
                type="password"
              />
            </Field>
          </div>
          <div>
            <SwitchField
              defaultChecked={event?.speakerPasswordEnabled ?? false}
              hint="Unless a channel sets its own."
              label="Speaker password"
              name="speakerPasswordEnabled"
            />
            <Field label="New speaker password">
              <input
                autoComplete="new-password"
                className="us-input"
                name="speakerPassword"
                placeholder={event?.speakerPasswordHash ? 'Leave blank to keep the current one' : 'Set a password'}
                type="password"
              />
            </Field>
          </div>
        </div>
        <Field hint="Changing it breaks links and QR codes that use it. Private links are not affected." label="URL name">
          <input className="us-input" defaultValue={event?.slug ?? ''} name="slug" />
        </Field>
      </FormSection>

      <div className="pt-1">
        <button
          className="us-button-primary px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!canSubmit}
          type="submit"
        >
          {submitLabel}
        </button>
      </div>
    </Wrapper>
  )
}
