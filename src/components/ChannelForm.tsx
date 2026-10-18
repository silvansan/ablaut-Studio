import { AudioEffectToggle } from '@/components/AudioEffectToggle'
import { Field, FormSection, SwitchField } from '@/components/FormFields'
import { ListenerAccessFields } from '@/components/ListenerAccessFields'
import type { Channel } from '@/payload-types'

type ChannelFormProps = {
  action?: (formData: FormData) => Promise<void>
  channel?: Channel
  /** `none` drops the panel border/padding, for use inside a drawer. */
  chrome?: 'none' | 'panel'
  embedded?: boolean
  eventListenerPasswordConfigured?: boolean
  eventSlug: string
  submitLabel: string
  variant?: 'advanced' | 'full'
}

export function ChannelForm({
  action,
  channel,
  chrome = 'panel',
  embedded = false,
  eventListenerPasswordConfigured = false,
  eventSlug,
  submitLabel,
  variant = 'full',
}: ChannelFormProps) {
  const isAdvanced = variant === 'advanced'
  const useEmbedded = embedded || (isAdvanced && !action)
  const Wrapper = useEmbedded ? 'div' : 'form'
  const wrapperClassName = isAdvanced || chrome === 'none' ? 'space-y-4' : 'us-panel space-y-4 px-6 py-6'

  const expertOptions = (
    <>
      <ListenerAccessFields
        defaultMode={channel?.listenerTokenMode ?? 'public'}
        eventListenerPasswordConfigured={eventListenerPasswordConfigured}
        eventSlug={eventSlug}
      />

      <div>
        <p className="us-subheading pb-1">Speaker access</p>
        <SwitchField
          defaultChecked={channel?.speakerPasswordEnabled ?? false}
          hint="Overrides the event speaker password."
          label="Speaker password"
          name="speakerPasswordEnabled"
        />
        <Field label="New speaker password">
          <input
            autoComplete="new-password"
            className="us-input"
            name="speakerPassword"
            placeholder={channel?.speakerPasswordHash ? 'Leave blank to keep the current one' : 'Set a password'}
            type="password"
          />
        </Field>
      </div>

      <Field label="Icecast fallback URL">
        <input className="us-input" defaultValue={channel?.icecastFallbackUrl ?? ''} name="icecastFallbackUrl" />
      </Field>

      <div>
        <p className="us-subheading pb-1">Listening modes</p>
        <SwitchField
          defaultChecked={channel?.webrtcEnabled ?? true}
          hint="Lowest delay. Works in most browsers."
          label="Live (low delay)"
          name="webrtcEnabled"
        />
        <SwitchField
          defaultChecked={channel?.hlsEnabled ?? true}
          hint="A few seconds behind, but works almost everywhere."
          label="Compatibility"
          name="hlsEnabled"
        />
      </div>

      <div>
        <p className="us-subheading pb-1">Speaker audio defaults</p>
        <div className="space-y-2">
          <AudioEffectToggle
            defaultChecked={channel?.audioQuality?.echoCancellation ?? false}
            hint="Off by default to avoid music distortion"
            label="Echo cancellation"
            name="audioQuality.echoCancellation"
            tone="green"
          />
          <AudioEffectToggle
            defaultChecked={channel?.audioQuality?.noiseSuppression ?? false}
            hint="Off by default for natural source audio"
            label="Noise suppression"
            name="audioQuality.noiseSuppression"
            tone="blue"
          />
          <AudioEffectToggle
            defaultChecked={channel?.audioQuality?.autoGainControl ?? false}
            hint="Off by default to preserve dynamics"
            label="Auto gain control"
            name="audioQuality.autoGainControl"
            tone="green"
          />
        </div>
      </div>
    </>
  )

  return (
    <Wrapper {...(useEmbedded ? {} : { action })} className={wrapperClassName}>
      <input name="eventSlug" type="hidden" value={eventSlug} />
      {channel ? (
        <>
          <input name="id" type="hidden" value={channel.id} />
          <input name="originalSlug" type="hidden" value={channel.slug} />
          {isAdvanced ? <input name="name" type="hidden" value={channel.name} /> : null}
        </>
      ) : null}

      {!isAdvanced ? (
        <div className="grid gap-3 md:grid-cols-12">
          <Field className="md:col-span-9" label="Channel name">
            <input className="us-input" defaultValue={channel?.name ?? ''} name="name" required />
          </Field>
          <Field className="md:col-span-3" hint="Lower numbers are listed first." label="Order">
            <input className="us-input" defaultValue={channel?.sortOrder ?? 0} name="sortOrder" type="number" />
          </Field>
          <Field className="md:col-span-12" label="Description">
            <textarea className="us-input" defaultValue={channel?.description ?? ''} name="description" rows={2} />
          </Field>
        </div>
      ) : (
        <>
          <input name="description" type="hidden" value={channel?.description ?? ''} />
          <input name="sortOrder" type="hidden" value={channel?.sortOrder ?? 0} />
          <Field hint="Changing it breaks links and QR codes that use it. Private links are not affected." label="URL name">
            <input className="us-input" defaultValue={channel?.slug ?? ''} name="slug" />
          </Field>
        </>
      )}

      <div>
        <SwitchField defaultChecked={channel?.enabled ?? true} label="Channel enabled" name="enabled" />
        <SwitchField defaultChecked={channel?.listenerPageEnabled ?? true} label="Listener page" name="listenerPageEnabled" />
        <SwitchField defaultChecked={channel?.speakerPageEnabled ?? true} label="Speaker page" name="speakerPageEnabled" />
      </div>

      <FormSection title="Expert options">{expertOptions}</FormSection>

      <div className="pt-1">
        <button className="us-button-primary px-4 py-2 text-sm font-medium" type="submit">
          {submitLabel}
        </button>
      </div>
    </Wrapper>
  )
}
