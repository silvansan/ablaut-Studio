'use client'

import { useEffect, useState } from 'react'

import { inviteUserAction } from '@/app/users/actions'
import { useActionFeedback } from '@/components/AppToastProvider'
import { Drawer } from '@/components/Drawer'
import { Field } from '@/components/FormFields'
import { INVITABLE_ORGANIZATION_ROLES } from '@/lib/organizations'
import type { Organization } from '@/payload-types'

const CREATE_ORGANIZATION_VALUE = 'new'

type InviteUserPanelProps = {
  canCreateOrganization?: boolean
  canSetPlatformRole: boolean
  defaultOrganizationId?: number
  hideOrganizationSelector?: boolean
  organizations: Organization[]
}

export function InviteUserPanel({
  canCreateOrganization = false,
  canSetPlatformRole,
  defaultOrganizationId,
  hideOrganizationSelector = false,
  organizations,
}: InviteUserPanelProps) {
  const [open, setOpen] = useState(false)
  const resolvedDefaultOrganizationId =
    defaultOrganizationId ?? organizations[0]?.id ?? CREATE_ORGANIZATION_VALUE
  const [organizationChoice, setOrganizationChoice] = useState(String(resolvedDefaultOrganizationId))
  const isCreatingOrganization = organizationChoice === CREATE_ORGANIZATION_VALUE
  const [formKey, setFormKey] = useState(0)
  const { formAction, pending, state } = useActionFeedback(inviteUserAction)

  useEffect(() => {
    if (open) {
      setOrganizationChoice(String(resolvedDefaultOrganizationId))
    }
  }, [open, resolvedDefaultOrganizationId])

  // A successful invite closes the drawer and clears the form; a failure keeps the input.
  useEffect(() => {
    if (state.message && state.ok) {
      setOpen(false)
      setFormKey((key) => key + 1)
    }
  }, [state])

  if (organizations.length === 0 && !canCreateOrganization) {
    return null
  }

  return (
    <>
      <button className="us-button-primary px-5 py-2.5 text-sm font-medium" onClick={() => setOpen(true)} type="button">
        Invite user
      </button>

      <Drawer
        description="Sends an email invitation."
        onClose={() => setOpen(false)}
        open={open}
        title="Invite user"
      >
        <form action={formAction} aria-busy={pending} className="space-y-4" key={formKey}>
          {state.message && !state.ok ? (
            <p
              className="border px-3 py-2 text-sm"
              role="alert"
              style={{ borderColor: 'var(--us-danger)', borderRadius: 'var(--us-r-control)', color: 'var(--us-danger)' }}
            >
              {state.message}
            </p>
          ) : null}

          <Field label="Name">
            <input className="us-input" name="name" required />
          </Field>
          <Field label="Email">
            <input className="us-input" name="email" required type="email" />
          </Field>

          {hideOrganizationSelector ? (
            <input name="organizationId" type="hidden" value={resolvedDefaultOrganizationId} />
          ) : (
            <Field label="Organization">
              <select
                className="us-input"
                name="organizationId"
                onChange={(event) => setOrganizationChoice(event.target.value)}
                required
                value={organizationChoice}
              >
                {canCreateOrganization ? <option value={CREATE_ORGANIZATION_VALUE}>New organization...</option> : null}
                {organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name}
                  </option>
                ))}
              </select>
            </Field>
          )}
          {isCreatingOrganization ? (
            <Field label="New organization name">
              <input className="us-input" name="newOrganizationName" placeholder="Riverside Community Church" required />
            </Field>
          ) : null}

          <div className={canSetPlatformRole ? 'grid gap-3 sm:grid-cols-2' : undefined}>
            <Field hint={INVITABLE_ORGANIZATION_ROLES.map((role) => `${role.label}: ${role.description}`).join(' ')} label="Role">
              <select className="us-input" defaultValue="moderator" name="roleInOrganization">
                {INVITABLE_ORGANIZATION_ROLES.map((role) => (
                  <option key={role.value} title={role.description} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </Field>
            {canSetPlatformRole ? (
              <Field hint="Platform admins work across all organizations." label="Platform role">
                <select className="us-input" defaultValue="moderator" name="role">
                  <option value="admin">Platform admin</option>
                  <option value="moderator">Moderator</option>
                </select>
              </Field>
            ) : (
              <input name="role" type="hidden" value="moderator" />
            )}
          </div>

          <button className="us-button-primary px-4 py-2 text-sm font-medium" disabled={pending} type="submit">
            {pending ? 'Sending...' : 'Send invite'}
          </button>
        </form>
      </Drawer>
    </>
  )
}
