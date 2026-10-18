import { removeMembershipAction, upsertUserOrganizationMembershipAction } from '@/app/users/actions'
import { DrawerActionForm, DrawerTrigger } from '@/components/DrawerTrigger'
import { Field } from '@/components/FormFields'
import { ShieldIcon } from '@/components/ActionIcons'
import { Chip, ChipGrid, DeleteIconButton, ListBody, ListEmpty, ListPanel, ListRow, RowTitle } from '@/components/ListKit'
import { INVITABLE_ORGANIZATION_ROLES } from '@/lib/organizations'
import type { Organization, OrganizationMembership } from '@/payload-types'

type UserOrganizationMembershipsSectionProps = {
  canManageMemberships: boolean
  memberships: OrganizationMembership[]
  organizations: Organization[]
  targetUserID: number
}

function organizationName(organization: OrganizationMembership['organization']): string {
  return typeof organization === 'number' ? `Organization ${organization}` : organization.name
}

function organizationId(organization: OrganizationMembership['organization']): number {
  return typeof organization === 'number' ? organization : organization.id
}

export function UserOrganizationMembershipsSection({
  canManageMemberships,
  memberships,
  organizations,
  targetUserID,
}: UserOrganizationMembershipsSectionProps) {
  // Removed (revoked) and declined requests are history, not access.
  const sorted = memberships
    .filter((membership) => membership.status !== 'revoked' && membership.status !== 'rejected')
    .sort((a, b) => organizationName(a.organization).localeCompare(organizationName(b.organization)))

  return (
    <ListPanel
      actions={
        canManageMemberships && organizations.length > 0 ? (
          <DrawerTrigger buttonLabel="Add to organization">
            <DrawerActionForm action={upsertUserOrganizationMembershipAction} submitLabel="Save">
              <input name="userID" type="hidden" value={targetUserID} />
              <Field label="Organization">
                <select className="us-input" name="organizationId" required>
                  <option value="">Choose an organization</option>
                  {organizations.map((organization) => (
                    <option key={organization.id} value={organization.id}>
                      {organization.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Role">
                <select className="us-input" defaultValue="moderator" name="roleInOrganization">
                  {INVITABLE_ORGANIZATION_ROLES.map((role) => (
                    <option key={role.value} title={role.description} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </Field>
            </DrawerActionForm>
          </DrawerTrigger>
        ) : null
      }
      count={sorted.length}
      title="Organizations"
    >
      {sorted.length > 0 ? (
        <ListBody itemLabel="organizations">
          {sorted.map((membership) => (
            <ListRow
              actions={
                canManageMemberships ? (
                  <DeleteIconButton
                    action={removeMembershipAction}
                    confirmLabel="Remove"
                    confirmMessage="Remove this person from the organization?"
                    fields={{ membershipId: membership.id, organizationId: organizationId(membership.organization) }}
                    label={`Remove from ${organizationName(membership.organization)}`}
                    title="Remove organization access"
                  />
                ) : null
              }
              chips={
                <ChipGrid columns="6.5rem 6rem">
                  <Chip className="capitalize" icon={<ShieldIcon />} title="Role in this organization" tone="muted">
                    {membership.roleInOrganization}
                  </Chip>
                  {membership.status === 'active' ? null : (
                    <Chip className="capitalize" tone="warning">
                      {membership.status}
                    </Chip>
                  )}
                </ChipGrid>
              }
              key={membership.id}
              lead={<RowTitle title={organizationName(membership.organization)} />}
            />
          ))}
        </ListBody>
      ) : (
        <ListEmpty>No organizations yet.</ListEmpty>
      )}
    </ListPanel>
  )
}
