import { EventPermissionIcon } from '@/components/EventPermissionIcon'
import { EVENT_PERMISSIONS, type EventPermissions } from '@/lib/event-permissions'

/** The "Can" toggle chips shared by every form that grants event access. */
export function EventPermissionFields({ values }: { values?: EventPermissions }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium" style={{ color: 'var(--us-text)' }}>
        Can
      </legend>
      <div className="flex flex-wrap gap-2">
        {EVENT_PERMISSIONS.map((permission) => (
          <label className="us-perm" key={permission.key}>
            <input defaultChecked={values ? values[permission.key] : permission.defaultOn} name={permission.key} type="checkbox" />
            <EventPermissionIcon permission={permission.key} />
            {permission.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
