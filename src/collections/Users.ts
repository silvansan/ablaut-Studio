import { APIError, type CollectionConfig, type Where } from 'payload'

import {
  generateForgotPasswordEmailHTML,
  generateForgotPasswordEmailSubject,
  generateVerificationEmailHTML,
  generateVerificationEmailSubject,
} from '@/lib/email'
import { shouldUseSecureCookies } from '@/lib/cookies'
import { getVisibleUserIDsForRequest, hasOrganizationManagementAccess } from '@/lib/organizations'
import { isAdminUser, isSuperAdminUser } from '@/lib/permissions'

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    admin: ({ req }) => isSuperAdminUser(req.user),
    create: async ({ req }) => {
      if (isSuperAdminUser(req.user) || isAdminUser(req.user)) {
        return true
      }

      return hasOrganizationManagementAccess(req)
    },
    delete: async ({ req }) => {
      if (isSuperAdminUser(req.user)) {
        return true
      }

      const visibleUserIDs = await getVisibleUserIDsForRequest(req)

      if (visibleUserIDs === null) {
        return true
      }

      if (visibleUserIDs.length === 0) {
        return false
      }

      return {
        and: [
          {
            id: {
              in: visibleUserIDs,
            },
          },
          {
            role: {
              not_equals: 'super_admin',
            },
          },
        ],
      } as Where
    },
    read: async ({ req }) => {
      if (isSuperAdminUser(req.user)) {
        return true
      }

      const visibleUserIDs = await getVisibleUserIDsForRequest(req)

      if (visibleUserIDs === null) {
        return true
      }

      if (visibleUserIDs.length === 0) {
        return false
      }

      return {
        id: {
          in: visibleUserIDs,
        },
      } as Where
    },
    update: async ({ req }) => {
      const userID = req.user?.id

      if (isSuperAdminUser(req.user)) {
        return true
      }

      const visibleUserIDs = await getVisibleUserIDsForRequest(req)

      if (visibleUserIDs === null) {
        return {
          role: {
            not_equals: 'super_admin',
          },
        } as Where
      }

      if (!userID) {
        return false
      }

      if (visibleUserIDs.length === 0) {
        return {
          id: {
            equals: userID,
          },
        } as Where
      }

      return {
        and: [
          {
            id: {
              in: visibleUserIDs,
            },
          },
          {
            role: {
              not_equals: 'super_admin',
            },
          },
        ],
      } as Where
    },
  },
  admin: {
    defaultColumns: ['email', 'name', 'role', 'active', 'lastLogin', 'updatedAt'],
    useAsTitle: 'email',
  },
  auth: {
    cookies: {
      sameSite: 'Lax',
      secure: shouldUseSecureCookies(),
    },
    forgotPassword: {
      expiration: 1000 * 60 * 60,
      generateEmailHTML: generateForgotPasswordEmailHTML,
      generateEmailSubject: generateForgotPasswordEmailSubject,
    },
    lockTime: 1000 * 60 * 15,
    maxLoginAttempts: 5,
    tokenExpiration: 60 * 60 * 2,
    useAPIKey: false,
    useSessions: true,
    verify: {
      generateEmailHTML: generateVerificationEmailHTML,
      generateEmailSubject: generateVerificationEmailSubject,
    },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'moderator',
      access: {
        create: ({ req }) => isSuperAdminUser(req.user),
        update: ({ req }) => isSuperAdminUser(req.user),
      },
      options: [
        { label: 'Super Admin', value: 'super_admin' },
        { label: 'Admin', value: 'admin' },
        { label: 'Moderator', value: 'moderator' },
      ],
      saveToJWT: true,
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      access: {
        create: ({ req }) => isSuperAdminUser(req.user),
        update: ({ req }) => isSuperAdminUser(req.user),
      },
      saveToJWT: true,
    },
    {
      name: 'preferredLanguage',
      type: 'text',
      defaultValue: 'en',
    },
    {
      name: 'lastLogin',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      type: 'collapsible',
      label: 'Invitation',
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          name: 'invitationStatus',
          type: 'select',
          defaultValue: 'none',
          options: [
            { label: 'None', value: 'none' },
            { label: 'Pending', value: 'pending' },
            { label: 'Accepted', value: 'accepted' },
            { label: 'Expired', value: 'expired' },
          ],
          admin: {
            readOnly: true,
          },
        },
        {
          name: 'invitedAt',
          type: 'date',
          admin: {
            date: {
              pickerAppearance: 'dayAndTime',
            },
            readOnly: true,
          },
        },
        {
          name: 'invitationAcceptedAt',
          type: 'date',
          admin: {
            date: {
              pickerAppearance: 'dayAndTime',
            },
            readOnly: true,
          },
        },
        {
          name: 'invitedBy',
          type: 'relationship',
          relationTo: 'users',
          admin: {
            readOnly: true,
          },
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Two-factor authentication preparation',
      admin: {
        description: 'Phase 11 only prepares fields. Full 2FA must be implemented carefully before enabling enforcement.',
        initCollapsed: true,
      },
      fields: [
        {
          name: 'twoFactorEnabled',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Reserved for a future 2FA flow.',
          },
        },
        {
          name: 'twoFactorMethod',
          type: 'select',
          options: [
            { label: 'Authenticator app', value: 'app' },
            { label: 'Email code', value: 'email' },
          ],
          admin: {
            description: 'Reserved for future 2FA method selection.',
          },
        },
        {
          name: 'twoFactorSecret',
          type: 'text',
          admin: {
            description: 'Reserved for an encrypted future 2FA secret. Do not populate until encryption is implemented.',
            hidden: true,
          },
        },
      ],
    },
  ],
  hooks: {
    beforeLogin: [
      ({ user }) => {
        if (user && 'active' in user && user.active === false) {
          throw new APIError('This account is inactive. Contact a super admin for access.')
        }

        return user
      },
    ],
    beforeChange: [
      ({ data, operation, req }) => {
        const nextData = { ...data }

        if (typeof nextData.email === 'string') {
          nextData.email = nextData.email.trim().toLowerCase()
        }

        if (operation === 'create' && isAdminUser(req.user) && !isSuperAdminUser(req.user)) {
          return {
            ...nextData,
            role: 'moderator',
          }
        }

        return nextData
      },
    ],
  },
}
