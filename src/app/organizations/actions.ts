'use server'

import configPromise from '@payload-config'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'

import { requireAppUser } from '@/lib/app-auth'
import {
  generateOrganizationRequestEmailHTML,
  generateOrganizationRequestEmailSubject,
  getBaseUrl,
  joinUrl,
} from '@/lib/email'
import { getManageableOrganizationIDs, hasOrganizationManagementAccess } from '@/lib/organizations'
import { revalidateOrganizationPaths } from '@/lib/revalidate-organization-paths'
import { isSuperAdminUser } from '@/lib/permissions'
import type { User } from '@/payload-types'

function stringValue(formData: FormData, key: string): string | undefined {
  const value = formData.get(key)

  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
}

function numericValue(formData: FormData, key: string): number | undefined {
  const value = stringValue(formData, key)
  const parsed = value ? Number(value) : NaN

  return Number.isFinite(parsed) ? parsed : undefined
}

function slugifyOrganizationName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function deleteAllOrganizationMemberships(
  payload: Awaited<ReturnType<typeof getPayload>>,
  organizationID: number,
  currentUser: User,
) {
  const pageSize = 100

  while (true) {
    const memberships = await payload.find({
      collection: 'organization-memberships',
      depth: 0,
      limit: pageSize,
      overrideAccess: true,
      pagination: false,
      where: {
        organization: {
          equals: organizationID,
        },
      },
    })

    if (memberships.docs.length === 0) {
      return
    }

    for (const membership of memberships.docs) {
      await payload.delete({
        id: membership.id,
        collection: 'organization-memberships',
        overrideAccess: true,
        user: currentUser,
      })
    }
  }
}

async function assertCanManageOrganization(
  payload: Awaited<ReturnType<typeof getPayload>>,
  currentUser: User,
  organizationID: number,
) {
  if (isSuperAdminUser(currentUser)) {
    return
  }

  const manageableOrganizationIDs = await getManageableOrganizationIDs({
    payload,
    user: currentUser,
  } as never)

  if (manageableOrganizationIDs === null || manageableOrganizationIDs.includes(organizationID)) {
    return
  }

  throw new Error('You do not have permission to manage this organization.')
}

export async function createOrganizationAction(formData: FormData) {
  const currentUser = await requireAppUser()

  if (!isSuperAdminUser(currentUser)) {
    throw new Error('Only super admins can create organizations.')
  }

  const name = stringValue(formData, 'name')
  const slugInput = stringValue(formData, 'slug')

  if (!name) {
    throw new Error('Organization name is required.')
  }

  const slug = slugInput ?? slugifyOrganizationName(name)

  if (!slug) {
    throw new Error('Organization slug could not be generated from the name.')
  }

  const payload = await getPayload({ config: configPromise })

  const organization = await payload.create({
    collection: 'organizations',
    data: {
      active: true,
      createdBy: currentUser.id,
      name,
      slug,
    },
    overrideAccess: true,
    user: currentUser,
  })

  revalidateOrganizationPaths(organization.slug)
  redirect(`/organizations/${organization.slug}?tab=events`)
}

export async function updateOrganizationAction(formData: FormData) {
  const currentUser = await requireAppUser()
  const payload = await getPayload({ config: configPromise })

  if (!(await hasOrganizationManagementAccess({ payload, user: currentUser } as never))) {
    throw new Error('You do not have permission to update organizations.')
  }

  const organizationID = numericValue(formData, 'organizationId')
  const originalSlug = stringValue(formData, 'originalSlug')
  const name = stringValue(formData, 'name')

  if (!organizationID || !originalSlug || !name) {
    throw new Error('Organization ID, original slug, and name are required.')
  }

  await assertCanManageOrganization(payload, currentUser, organizationID)

  const organization = await payload.update({
    id: organizationID,
    collection: 'organizations',
    data: {
      active: formData.get('active') === 'on',
      description: stringValue(formData, 'description'),
      name,
      productionMode: formData.get('productionMode') === 'on',
      slug: slugifyOrganizationName(stringValue(formData, 'slug') ?? name),
    },
    overrideAccess: false,
    user: currentUser,
  })

  revalidateOrganizationPaths(originalSlug)
  if (organization.slug !== originalSlug) {
    revalidateOrganizationPaths(organization.slug)
  }

  redirect(`/organizations/${organization.slug}?tab=settings`)
}

export async function deleteOrganizationAction(formData: FormData) {
  const currentUser = await requireAppUser()

  if (!isSuperAdminUser(currentUser)) {
    throw new Error('Only super admins can delete organizations.')
  }

  const organizationID = numericValue(formData, 'organizationId')

  if (!organizationID) {
    throw new Error('Organization ID is required.')
  }

  const payload = await getPayload({ config: configPromise })

  const organization = await payload.findByID({
    id: organizationID,
    collection: 'organizations',
    depth: 0,
    overrideAccess: true,
    user: currentUser,
  })

  const events = await payload.count({
    collection: 'events',
    overrideAccess: true,
    where: {
      organization: {
        equals: organizationID,
      },
    },
  })

  if (events.totalDocs > 0) {
    throw new Error(
      `Remove or reassign all ${events.totalDocs} event${events.totalDocs === 1 ? '' : 's'} in this organization before deleting it.`,
    )
  }

  await deleteAllOrganizationMemberships(payload, organizationID, currentUser)

  await payload.delete({
    id: organizationID,
    collection: 'organizations',
    overrideAccess: true,
    user: currentUser,
  })

  revalidateOrganizationPaths(organization.slug)
  redirect('/organizations')
}

export async function requestOrganizationMembershipAction(formData: FormData) {
  const currentUser = await requireAppUser()
  const organizationSlug = stringValue(formData, 'organizationSlug')

  if (!organizationSlug) {
    throw new Error('Organization slug is required.')
  }

  const payload = await getPayload({ config: configPromise })
  const organizations = await payload.find({
    collection: 'organizations',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      and: [
        {
          slug: {
            equals: organizationSlug,
          },
        },
        {
          active: {
            equals: true,
          },
        },
      ],
    },
  })

  const organization = organizations.docs[0]

  if (!organization) {
    throw new Error('Organization not found.')
  }

  const existingMembership = await payload.find({
    collection: 'organization-memberships',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      and: [
        {
          organization: {
            equals: organization.id,
          },
        },
        {
          user: {
            equals: currentUser.id,
          },
        },
      ],
    },
  })

  if (existingMembership.docs.length > 0) {
    throw new Error('You already have a membership request or membership for this organization.')
  }

  await payload.create({
    collection: 'organization-memberships',
    data: {
      organization: organization.id,
      requestedAt: new Date().toISOString(),
      requestedBy: currentUser.id,
      roleInOrganization: 'moderator',
      status: 'pending',
      user: currentUser.id,
    },
    overrideAccess: true,
    user: currentUser,
  })

  const managers = await payload.find({
    collection: 'organization-memberships',
    depth: 1,
    limit: 50,
    overrideAccess: true,
    pagination: false,
    where: {
      and: [
        {
          organization: {
            equals: organization.id,
          },
        },
        {
          status: {
            equals: 'active',
          },
        },
        {
          roleInOrganization: {
            in: ['owner', 'manager'],
          },
        },
      ],
    },
  })

  const manageUrl = joinUrl(getBaseUrl(), `/organizations/${organization.slug}?tab=users`)

  for (const membership of managers.docs) {
    const manager = typeof membership.user === 'object' ? membership.user : null
    const managerEmail = manager && typeof manager.email === 'string' ? manager.email : null

    if (!managerEmail) {
      continue
    }

    await payload.sendEmail({
      html: generateOrganizationRequestEmailHTML({
        manageUrl,
        organizationName: organization.name,
        requesterEmail: currentUser.email ?? 'A user',
      }),
      subject: generateOrganizationRequestEmailSubject({ organizationName: organization.name }),
      to: managerEmail,
    })
  }

  revalidateOrganizationPaths(organization.slug)
}
