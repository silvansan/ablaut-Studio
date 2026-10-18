export type OrganizationOption = {
  id: number
  name: string
  slug?: string
}

type OrganizationSelectFieldProps = {
  defaultOrganizationId?: number
  labelClassName?: string
  name?: string
  organizations: OrganizationOption[]
  required?: boolean
  selectClassName?: string
}

export function OrganizationSelectField({
  defaultOrganizationId,
  labelClassName = 'us-field',
  name = 'organizationId',
  organizations,
  required = true,
  selectClassName = 'us-input',
}: OrganizationSelectFieldProps) {
  if (organizations.length === 0) {
    return (
      <p className="text-sm" style={{ color: 'var(--us-muted)' }}>
        No organizations yet. Create or join one first.
      </p>
    )
  }

  if (organizations.length === 1) {
    return <input name={name} type="hidden" value={organizations[0].id} />
  }

  const selectedOrganizationId = defaultOrganizationId ?? organizations[0]?.id

  return (
    <label className={labelClassName}>
      <span className="us-field__label">Organization</span>
      <select
        className={selectClassName}
        defaultValue={selectedOrganizationId}
        name={name}
        required={required}
      >
        {organizations.map((organization) => (
          <option key={organization.id} value={organization.id}>
            {organization.name}
          </option>
        ))}
      </select>
    </label>
  )
}

function relationshipOrganizationId(
  value: number | { id?: number | null } | null | undefined,
): number | undefined {
  if (typeof value === 'number') {
    return value
  }

  return typeof value?.id === 'number' ? value.id : undefined
}

export function organizationIdFromEvent(event?: { organization?: number | { id?: number | null } | null }): number | undefined {
  return relationshipOrganizationId(event?.organization ?? undefined)
}
