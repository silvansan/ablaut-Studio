import {
  removeMembershipAction,
  upsertUserOrganizationMembershipAction,
} from '@/app/users/actions'
import { ConfirmSubmitButton } from '@/components/ConfirmSubmitButton'
import { ListGroupRow } from '@/components/ListGroupRow'
import { TruncatedList } from '@/components/TruncatedList'
import { assignGroupTints } from '@/lib/list-group-tints'
import { INVITABLE_ORGANIZATION_ROLES } from '@/lib/organizations'
import type { Organization, OrganizationMembership } from '@/payload-types'

type UserOrganizationMembershipsSectionProps = {
  canManageMemberships: boolean
  memberships: OrganizationMembership[]
  organizations: Organization[]
  targetUserID: number
}

function organizationTitle(organization: OrganizationMembership['organization']): string {
  if (typeof organization === 'number') {
    return `Organization ${organization}`
  }

  return organization.name
}

function organizationID(organization: OrganizationMembership['organization']): string {
  if (typeof organization === 'number') {
    return String(organization)
  }

  return String(organization.id)
}

export function UserOrganizationMembershipsSection({
  canManageMemberships,
  memberships,
  organizations,
  targetUserID,
}: UserOrganizationMembershipsSectionProps) {
  const tintedMemberships = assignGroupTints(
    [...memberships].sort((a, b) => organizationTitle(a.organization).localeCompare(organizationTitle(b.organization))),
    (membership) => organizationID(membership.organization),
  )

  return (
    <div className="mt-4 rounded-2xl border px-4 py-4" style={{ borderColor: 'var(--us-border)' }}>
      <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
        Organization access
      </p>
      <p className="mt-2 text-xs leading-5" style={{ color: 'var(--us-muted)' }}>
        Add this user to organizations and set their organization role.
      </p>

      {tintedMemberships.length > 0 ? (
        <TruncatedList className="mt-4" itemLabel="organization memberships" listClassName="space-y-3">
          {tintedMemberships.map((membership) => (
            <ListGroupRow
              className="rounded-2xl px-4 py-3 text-sm"
              key={membership.id}
              rowTint={membership.rowTint}
              style={{ color: 'var(--us-text)' }}
            >
              <p className="font-semibold">{organizationTitle(membership.organization)}</p>
              <p className="mt-1 capitalize" style={{ color: 'var(--us-muted)' }}>
                {membership.roleInOrganization} · {membership.status}
              </p>
              {canManageMemberships ? (
                <form action={removeMembershipAction} className="mt-3" id={`remove-organization-membership-${membership.id}`}>
                  <input name="membershipId" type="hidden" value={membership.id} />
                  <input name="organizationId" type="hidden" value={organizationID(membership.organization)} />
                  <ConfirmSubmitButton
                    action={removeMembershipAction}
                    className="rounded-2xl border px-3 py-2 text-xs font-medium"
                    confirmMessage="Remove this user from the organization?"
                    formId={`remove-organization-membership-${membership.id}`}
                    title="Remove organization access"
                  >
                    Remove
                  </ConfirmSubmitButton>
                </form>
              ) : null}
            </ListGroupRow>
          ))}
        </TruncatedList>
      ) : (
        <p className="mt-3 text-sm" style={{ color: 'var(--us-muted)' }}>
          No organization memberships yet.
        </p>
      )}

      {canManageMemberships ? (
        organizations.length > 0 ? (
          <form action={upsertUserOrganizationMembershipAction} className="mt-5 space-y-4 border-t pt-5" style={{ borderColor: 'var(--us-border)' }}>
            <p className="text-sm font-medium" style={{ color: 'var(--us-text)' }}>
              Add or update membership
            </p>
            <input name="userID" type="hidden" value={targetUserID} />
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
                Organization
                <select
                  className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
                  name="organizationId"
                  required
                  style={{ borderColor: 'var(--us-border)' }}
                >
                  <option value="">Select organization</option>
                  {organizations.map((organization) => (
                    <option key={organization.id} value={organization.id}>
                      {organization.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
                Org role
                <select className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none" defaultValue="moderator" name="roleInOrganization" style={{ borderColor: 'var(--us-border)' }}>
                  {INVITABLE_ORGANIZATION_ROLES.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button type="submit" className="us-button-secondary px-5 py-3 text-sm font-medium">
              Save membership
            </button>
          </form>
        ) : null
      ) : null}
    </div>
  )
}
