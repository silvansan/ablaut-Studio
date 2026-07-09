import type { CollectionConfig } from 'payload'

import { isSuperAdminUser } from '@/lib/permissions'
import { getManageableOrganizationWhere } from '@/lib/organizations'

function formatSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const Organizations: CollectionConfig = {
  slug: 'organizations',
  access: {
    create: ({ req }) => isSuperAdminUser(req.user),
    delete: ({ req }) => isSuperAdminUser(req.user),
    read: async ({ req }) => {
      if (isSuperAdminUser(req.user)) {
        return true
      }

      const where = await getManageableOrganizationWhere(req)

      if (where === true) {
        return true
      }

      return where
    },
    update: async ({ req }) => {
      if (isSuperAdminUser(req.user)) {
        return true
      }

      const where = await getManageableOrganizationWhere(req)

      if (where === true) {
        return true
      }

      return where
    },
  },
  admin: {
    defaultColumns: ['name', 'slug', 'active', 'createdBy', 'updatedAt'],
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'productionMode',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'When enabled, members of this organization do not see the beta banner.',
      },
    },
    {
      name: 'supportEmail',
      type: 'email',
    },
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, operation, req }) => {
        const nextData = { ...data }

        if (typeof nextData.name === 'string' && !nextData.slug) {
          nextData.slug = formatSlug(nextData.name)
        }

        if (typeof nextData.slug === 'string') {
          nextData.slug = formatSlug(nextData.slug)
        }

        if (operation === 'create' && req.user?.id && !nextData.createdBy) {
          nextData.createdBy = req.user.id
        }

        return nextData
      },
    ],
  },
}
