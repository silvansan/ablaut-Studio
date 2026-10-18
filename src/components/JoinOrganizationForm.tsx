import { requestOrganizationMembershipAction } from '@/app/organizations/actions'

type JoinOrganizationFormProps = {
  organizations: Array<{ id: number; name: string; slug: string }>
}

export function JoinOrganizationForm({ organizations }: JoinOrganizationFormProps) {
  if (organizations.length === 0) {
    return (
      <p className="text-sm leading-6" style={{ color: 'var(--us-muted)' }}>
        You already belong to every active organization, or none are available to join.
      </p>
    )
  }

  return (
    <form action={requestOrganizationMembershipAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <label className="block flex-1 text-sm font-medium" style={{ color: 'var(--us-text)' }}>
        Join an organization
        <select
          className="us-input mt-2"
          defaultValue=""
          name="organizationSlug"
          required
        >
          <option disabled value="">
            Choose an organization
          </option>
          {organizations.map((organization) => (
            <option key={organization.id} value={organization.slug}>
              {organization.name}
            </option>
          ))}
        </select>
      </label>
      <button className="us-button-primary px-4 py-2.5 text-sm font-medium" type="submit">
        Request access
      </button>
    </form>
  )
}
