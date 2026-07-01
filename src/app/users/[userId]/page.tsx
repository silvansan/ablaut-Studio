import { notFound } from 'next/navigation'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { UserDetailPanel } from '@/components/UserDetailPanel'
import { Layout } from '@/components/Layout'
import { requireAppUser } from '@/lib/app-auth'
import { pageMetadata } from '@/lib/branding'
import { hasOrganizationManagementAccess } from '@/lib/organizations'
import { getUserDetailData } from '@/lib/user-detail-data'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ userId: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { userId } = await params
  const numericUserID = Number(userId)

  if (!Number.isFinite(numericUserID)) {
    return pageMetadata('User')
  }

  const data = await getUserDetailData(numericUserID)

  return pageMetadata(data?.targetUser.name ?? 'User')
}

export default async function UserDetailPage({ params }: PageProps) {
  const { userId } = await params
  const numericUserID = Number(userId)

  if (!Number.isFinite(numericUserID)) {
    notFound()
  }

  const currentUser = await requireAppUser()
  const payload = await getPayload({ config: configPromise })
  const data = await getUserDetailData(numericUserID)

  if (!data) {
    notFound()
  }

  const canManageUsers = await hasOrganizationManagementAccess({ payload, user: currentUser } as never)

  return (
    <Layout hideHeader title={data.targetUser.name}>
      <UserDetailPanel canManageUsers={canManageUsers} currentUser={currentUser} data={data} />
    </Layout>
  )
}
