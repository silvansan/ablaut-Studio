import { requestOrganizationMembershipAction } from '@/app/organizations/actions'
import { Field } from '@/components/FormFields'

type JoinOrganizationFormProps = {
  organizations: Array<{ id: number; name: string; slug: string }>
}

export function JoinOrganizationForm({ organizations }: JoinOrganizationFormProps) {
  if (organizations.length === 0) {
    return (
      <p className="text-sm" style={{ color: 'var(--us-muted)' }}>
        No other organizations to join.
      </p>
    )
  }

  return (
    <form action={requestOrganizationMembershipAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <Field className="flex-1" label="Organization">
        <select className="us-input" defaultValue="" name="organizationSlug" required>
          <option disabled value="">
            Choose an organization
          </option>
          {organizations.map((organization) => (
            <option key={organization.id} value={organization.slug}>
              {organization.name}
            </option>
          ))}
        </select>
      </Field>
      <button className="us-button-primary px-4 py-2 text-sm font-medium" type="submit">
        Request access
      </button>
    </form>
  )
}
