import { AudioEffectToggle } from '@/components/AudioEffectToggle'
import { ListenerAccessFields } from '@/components/ListenerAccessFields'
import type { Channel } from '@/payload-types'

type ChannelFormProps = {
  action?: (formData: FormData) => Promise<void>
  channel?: Channel
  embedded?: boolean
  eventListenerPasswordConfigured?: boolean
  eventSlug: string
  submitLabel: string
  variant?: 'advanced' | 'full'
}

export function ChannelForm({
  action,
  channel,
  embedded = false,
  eventListenerPasswordConfigured = false,
  eventSlug,
  submitLabel,
  variant = 'full',
}: ChannelFormProps) {
  const isAdvanced = variant === 'advanced'
  const useEmbedded = embedded || (isAdvanced && !action)
  const Wrapper = useEmbedded ? 'div' : 'form'
  const wrapperClassName = isAdvanced ? 'space-y-5' : 'us-panel space-y-5 px-6 py-6'

  return (
    <Wrapper
      {...(useEmbedded ? {} : { action })}
      className={wrapperClassName}
    >
      <input name="eventSlug" type="hidden" value={eventSlug} />
      {channel ? (
        <>
          <input name="id" type="hidden" value={channel.id} />
          <input name="originalSlug" type="hidden" value={channel.slug} />
          {isAdvanced ? <input name="name" type="hidden" value={channel.name} /> : null}
        </>
      ) : null}

      {!isAdvanced ? (
        <>
          <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
            Channel name
            <input className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none" defaultValue={channel?.name ?? ''} name="name" required style={{ borderColor: 'var(--us-border)' }} />
            <span className="mt-2 block text-xs leading-5" style={{ color: 'var(--us-muted)' }}>
              The URL name is created from the channel name when it is first saved.
            </span>
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
              Sort order
              <input className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none" defaultValue={channel?.sortOrder ?? 0} name="sortOrder" style={{ borderColor: 'var(--us-border)' }} type="number" />
            </label>
          </div>

          <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
            Description
            <textarea className="mt-2 min-h-24 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none" defaultValue={channel?.description ?? ''} name="description" style={{ borderColor: 'var(--us-border)' }} />
          </label>
        </>
      ) : (
        <>
          <input name="description" type="hidden" value={channel?.description ?? ''} />
          <input name="sortOrder" type="hidden" value={channel?.sortOrder ?? 0} />
          <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
            URL name
            <input className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none" defaultValue={channel?.slug ?? ''} name="slug" style={{ borderColor: 'var(--us-border)' }} />
            <span className="mt-2 block text-xs leading-5" style={{ color: 'var(--us-muted)' }}>
              Changing the URL name breaks existing QR codes, bookmarks, and listener sessions.
            </span>
          </label>
        </>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {[
          ['enabled', 'Channel enabled', channel?.enabled ?? true],
          ['listenerPageEnabled', 'Listener page on', channel?.listenerPageEnabled ?? true],
          ['speakerPageEnabled', 'Speaker page on', channel?.speakerPageEnabled ?? true],
        ].map(([name, label, checked]) => (
          <label key={String(name)} className="flex items-start gap-3 rounded-2xl bg-white/70 px-4 py-3 text-sm" style={{ color: 'var(--us-text)' }}>
            <input className="mt-1" defaultChecked={Boolean(checked)} name={String(name)} type="checkbox" />
            <span>{label}</span>
          </label>
        ))}
      </div>

      <details className="rounded-2xl border px-4 py-4" style={{ borderColor: 'var(--us-border)' }}>
        <summary className="cursor-pointer text-sm font-semibold" style={{ color: 'var(--us-green-dark)' }}>
          Expert options
        </summary>
        <div className="mt-4 space-y-5">
      <ListenerAccessFields
        defaultMode={channel?.listenerTokenMode ?? 'public'}
        eventListenerPasswordConfigured={eventListenerPasswordConfigured}
        eventSlug={eventSlug}
      />

      <div className="rounded-2xl border px-4 py-4" style={{ borderColor: 'var(--us-border)' }}>
        <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
          Speaker access
        </p>
        <p className="mt-2 text-xs leading-5" style={{ color: 'var(--us-muted)' }}>
          Channel speaker password overrides the event speaker password when both are enabled. Leave the password field empty to keep the current hash.
        </p>
        <label className="mt-4 flex items-start gap-3 rounded-2xl bg-white/70 px-4 py-3 text-sm" style={{ color: 'var(--us-text)' }}>
          <input className="mt-1" defaultChecked={channel?.speakerPasswordEnabled ?? false} name="speakerPasswordEnabled" type="checkbox" />
          <span>Require a speaker password for this channel</span>
        </label>
        <label className="mt-3 block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
          New speaker password
          <input
            autoComplete="new-password"
            className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
            name="speakerPassword"
            placeholder={channel?.speakerPasswordHash ? 'Leave blank to keep current password' : 'Set a speaker password'}
            style={{ borderColor: 'var(--us-border)' }}
            type="password"
          />
        </label>
      </div>

      <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
        Icecast fallback URL
        <input className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none" defaultValue={channel?.icecastFallbackUrl ?? ''} name="icecastFallbackUrl" style={{ borderColor: 'var(--us-border)' }} />
      </label>

      <div className="grid gap-3 md:grid-cols-2">
        {[
          ['webrtcEnabled', 'Low-latency listening (WebRTC)', channel?.webrtcEnabled ?? true],
          ['hlsEnabled', 'Compatibility listening (LL-HLS)', channel?.hlsEnabled ?? true],
        ].map(([name, label, checked]) => (
          <label key={String(name)} className="flex items-start gap-3 rounded-2xl bg-white/70 px-4 py-3 text-sm" style={{ color: 'var(--us-text)' }}>
            <input className="mt-1" defaultChecked={Boolean(checked)} name={String(name)} type="checkbox" />
            <span>{label}</span>
          </label>
        ))}
      </div>

      <div className="rounded-2xl border px-4 py-4" style={{ borderColor: 'var(--us-border)' }}>
        <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
          Audio quality defaults
        </p>
        <p className="mt-2 text-xs leading-5" style={{ color: 'var(--us-muted)' }}>
          These defaults load on the speaker page. Keep them off for music and natural source audio.
        </p>
        <div className="mt-4 space-y-3">
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
        </div>
      </details>

      <button type="submit" className="us-button-primary px-5 py-3 text-sm font-medium">
        {submitLabel}
      </button>
    </Wrapper>
  )
}
