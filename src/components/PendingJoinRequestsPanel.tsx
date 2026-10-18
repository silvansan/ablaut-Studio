import { JoinRequestRow } from '@/components/JoinRequestRow'
import { ListBody, ListPanel } from '@/components/ListKit'
import type { OrganizationMembership } from '@/payload-types'

type PendingJoinRequestsPanelProps = {
  memberships: OrganizationMembership[]
  returnPath?: string
}

export function PendingJoinRequestsPanel({ memberships, returnPath = '/users' }: PendingJoinRequestsPanelProps) {
  if (memberships.length === 0) {
    return null
  }

  return (
    <ListPanel count={memberships.length} title="Join requests">
      <ListBody itemLabel="requests">
        {memberships.map((membership) => (
          <JoinRequestRow key={membership.id} membership={membership} returnPath={returnPath} />
        ))}
      </ListBody>
    </ListPanel>
  )
}
