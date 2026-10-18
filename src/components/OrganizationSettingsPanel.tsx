import { deleteOrganizationAction, updateOrganizationAction } from '@/app/organizations/actions'
import { TrashIcon } from '@/components/ActionIcons'
import { ConfirmSubmitButton } from '@/components/ConfirmSubmitButton'
import { Field, SwitchField } from '@/components/FormFields'
import type { Organization } from '@/payload-types'

type OrganizationSettingsPanelProps = {
  canDelete: boolean
  organization: Organization
}

export function OrganizationSettingsPanel({ canDelete, organization }: OrganizationSettingsPanelProps) {
  const deleteFormId = `delete-organization-${organization.id}`

  return (
    <article className="us-panel space-y-4 px-6 py-5">
      <h3 className="text-base font-semibold" style={{ color: 'var(--us-green-dark)' }}>
        Organization settings
      </h3>

      <form action={updateOrganizationAction} className="space-y-4">
        <input name="organizationId" type="hidden" value={organization.id} />
        <input name="originalSlug" type="hidden" value={organization.slug} />
        <div className="grid gap-3 md:grid-cols-12">
          <Field className="md:col-span-8" label="Name">
            <input className="us-input" defaultValue={organization.name} name="name" required />
          </Field>
          <Field className="md:col-span-4" hint="Used in the Platform address of this organization." label="URL name">
            <input className="us-input" defaultValue={organization.slug} name="slug" required />
          </Field>
          <Field className="md:col-span-12" label="Description">
            <textarea className="us-input" defaultValue={organization.description ?? ''} name="description" rows={2} />
          </Field>
        </div>
        <div>
          <SwitchField defaultChecked={organization.active !== false} label="Active" name="active" />
          <SwitchField
            defaultChecked={organization.productionMode === true}
            hint="Hides the beta note for members."
            label="Production mode"
            name="productionMode"
          />
        </div>
        <button className="us-button-primary px-4 py-2 text-sm font-medium" type="submit">
          Save
        </button>
      </form>

      {canDelete ? (
        <form
          action={deleteOrganizationAction}
          className="flex flex-wrap items-center justify-between gap-3 border-t pt-4"
          id={deleteFormId}
          style={{ borderColor: 'var(--us-border)' }}
        >
          <input name="organizationId" type="hidden" value={organization.id} />
          <p className="text-sm" style={{ color: 'var(--us-muted)' }}>
            Only possible when it has no events.
          </p>
          <ConfirmSubmitButton
            action={deleteOrganizationAction}
            className="us-button-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium"
            confirmLabel="Delete organization"
            confirmMessage="Delete this organization permanently? Its member records are removed with it."
            formId={deleteFormId}
            title="Delete organization"
          >
            <TrashIcon />
            Delete organization
          </ConfirmSubmitButton>
        </form>
      ) : null}
    </article>
  )
}
