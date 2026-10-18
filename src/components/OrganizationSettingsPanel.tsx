import { deleteOrganizationAction, updateOrganizationAction } from '@/app/organizations/actions'
import { ConfirmSubmitButton } from '@/components/ConfirmSubmitButton'
import type { Organization } from '@/payload-types'

type OrganizationSettingsPanelProps = {
  canDelete: boolean
  organization: Organization
}

export function OrganizationSettingsPanel({ canDelete, organization }: OrganizationSettingsPanelProps) {
  const deleteFormId = `delete-organization-${organization.id}`

  return (
    <article className="us-panel space-y-5 px-6 py-6">
      <div>
        <h3 className="text-lg font-semibold" style={{ color: 'var(--us-green-dark)' }}>
          Organization settings
        </h3>
      </div>

      <form action={updateOrganizationAction} className="grid gap-4 md:grid-cols-2">
        <input name="organizationId" type="hidden" value={organization.id} />
        <input name="originalSlug" type="hidden" value={organization.slug} />
        <label className="block text-sm font-medium md:col-span-2" style={{ color: 'var(--us-text)' }}>
          Name
          <input
            className="us-input mt-2"
            defaultValue={organization.name}
            name="name"
            required
          />
        </label>
        <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
          Slug
          <input
            className="us-input mt-2"
            defaultValue={organization.slug}
            name="slug"
            required
          />
        </label>
        <label className="flex items-center gap-3 rounded-2xl bg-white/70 px-4 py-3 text-sm" style={{ color: 'var(--us-text)' }}>
          <input defaultChecked={organization.active !== false} name="active" type="checkbox" />
          <span>Active</span>
        </label>
        <label className="flex items-center gap-3 rounded-2xl bg-white/70 px-4 py-3 text-sm md:col-span-2" style={{ color: 'var(--us-text)' }}>
          <input defaultChecked={organization.productionMode === true} name="productionMode" type="checkbox" />
          <span>Production mode (hide beta banner for members)</span>
        </label>
        <label className="block text-sm font-medium md:col-span-2" style={{ color: 'var(--us-text)' }}>
          Description
          <textarea
            className="us-input mt-2 min-h-28"
            defaultValue={organization.description ?? ''}
            name="description"
          />
        </label>
        <div className="md:col-span-2">
          <button className="us-button-primary px-5 py-3 text-sm font-medium" type="submit">
            Save settings
          </button>
        </div>
      </form>

      {canDelete ? (
        <div className="border-t pt-5" style={{ borderColor: 'var(--us-border)' }}>
          <p className="text-sm leading-6" style={{ color: 'var(--us-muted)' }}>
            Delete this organization only when it has no events. Member records are removed with the organization.
          </p>
          <form action={deleteOrganizationAction} className="mt-4" id={deleteFormId}>
            <input name="organizationId" type="hidden" value={organization.id} />
            <ConfirmSubmitButton
              action={deleteOrganizationAction}
              confirmMessage="Delete this organization permanently?"
              formId={deleteFormId}
              title="Delete organization"
            >
              Delete organization
            </ConfirmSubmitButton>
          </form>
        </div>
      ) : null}
    </article>
  )
}
