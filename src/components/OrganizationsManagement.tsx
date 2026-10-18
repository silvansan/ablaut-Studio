'use client'

import { createOrganizationAction, requestOrganizationMembershipAction } from '@/app/organizations/actions'
import { DrawerActionForm, DrawerTrigger } from '@/components/DrawerTrigger'
import { Field } from '@/components/FormFields'

type OrganizationsManagementProps = {
  isSuperAdmin: boolean
}

export function OrganizationsManagement({ isSuperAdmin }: OrganizationsManagementProps) {
  return (
    <>
      <DrawerTrigger buttonLabel="Join organization" variant="secondary">
        <DrawerActionForm action={requestOrganizationMembershipAction} submitLabel="Send request">
          <Field hint="Ask an organization manager for its URL name." label="Organization URL name">
            <input className="us-input" name="organizationSlug" placeholder="default" required />
          </Field>
        </DrawerActionForm>
      </DrawerTrigger>

      {isSuperAdmin ? (
        <DrawerTrigger buttonLabel="New organization">
          <DrawerActionForm action={createOrganizationAction} submitLabel="Create">
            <Field label="Name">
              <input className="us-input" name="name" required />
            </Field>
            <Field hint="Leave empty to create it from the name." label="URL name">
              <input className="us-input" name="slug" />
            </Field>
          </DrawerActionForm>
        </DrawerTrigger>
      ) : null}
    </>
  )
}
