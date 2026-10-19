'use client'

import { useRouter } from 'next/navigation'
import { Fragment, useId, type CSSProperties, type ReactNode } from 'react'

import { ArrowRightIcon, PencilIcon, TrashIcon } from '@/components/ActionIcons'
import { ConfirmSubmitButton } from '@/components/ConfirmSubmitButton'
import Link, { useOrgKey } from '@/components/OrgLink'
import { TruncatedList } from '@/components/TruncatedList'
import { toPublicPath } from '@/lib/org-paths'

/**
 * The one way to show a list in the app. Change a look here and every list changes with it:
 *
 *   <ListPanel title="Channels" count={3} actions={<AddButton />}>
 *     <ListBody itemLabel="channels">
 *       <ListRow lead={<RowTitle title="EN" />} chips={...} actions={<EditIconButton ... />} />
 *     </ListBody>
 *   </ListPanel>
 */

type ListPanelProps = {
  /** Buttons on the right of the header bar. */
  actions?: ReactNode
  children: ReactNode
  className?: string
  count?: number
  /** Before the title, e.g. a select-all checkbox. */
  leading?: ReactNode
  title?: string
}

export function ListPanel({ actions, children, className = '', count, leading, title }: ListPanelProps) {
  const hasHeader = Boolean(title || actions || leading)

  return (
    <section className={`us-panel overflow-hidden ${className}`}>
      {hasHeader ? (
        <div className="us-list-header">
          {leading}
          {title ? (
            <p className="text-sm font-semibold" style={{ color: 'var(--us-green-dark)' }}>
              {title}
              {count === undefined ? null : (
                <span className="ml-1.5 font-normal" style={{ color: 'var(--us-muted)' }}>
                  {count}
                </span>
              )}
            </p>
          ) : null}
          {actions ? <div className="ml-auto flex items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  )
}

/** The rows. Long lists get a "Show more" footer. */
export function ListBody({ children, itemLabel = 'items' }: { children: ReactNode; itemLabel?: string }) {
  return (
    <TruncatedList as="ul" footerClassName="px-3 pb-3" itemLabel={itemLabel} listClassName="">
      {children}
    </TruncatedList>
  )
}

export function ListEmpty({ children }: { children: ReactNode }) {
  return (
    <p className="px-3 py-5 text-sm" style={{ color: 'var(--us-muted)' }}>
      {children}
    </p>
  )
}

type ListRowProps = {
  /** Right-aligned controls. Clicks here never trigger the row itself. */
  actions?: ReactNode
  chips?: ReactNode
  className?: string
  /** Quiet text column (date, place, counts). Hidden on narrow screens. */
  detail?: ReactNode
  /** Internal path (`/users/3`); the row opens it. */
  href?: string
  lead: ReactNode
  /** Opens something other than a page (a drawer). */
  onActivate?: () => void
  selection?: { checked: boolean; disabled?: boolean; label: string; onChange: () => void }
}

export function ListRow({ actions, chips, className = '', detail, href, lead, onActivate, selection }: ListRowProps) {
  const router = useRouter()
  const orgKey = useOrgKey()
  const activate = onActivate ?? (href ? () => router.push(toPublicPath(href, orgKey)) : undefined)

  return (
    <li
      className={`us-list-row flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2.5 ${activate ? 'cursor-pointer' : ''} ${className}`}
      onClick={activate}
      onKeyDown={
        activate
          ? (event) => {
              if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
                event.preventDefault()
                activate()
              }
            }
          : undefined
      }
      role={activate ? (href ? 'link' : 'button') : undefined}
      tabIndex={activate ? 0 : undefined}
    >
      {selection ? (
        <input
          aria-label={selection.label}
          checked={selection.checked}
          disabled={selection.disabled}
          onChange={selection.onChange}
          onClick={(event) => event.stopPropagation()}
          type="checkbox"
        />
      ) : null}
      <div className="min-w-0 flex-1 basis-48">{lead}</div>
      {chips ? <div className="flex flex-wrap items-center gap-1.5">{chips}</div> : null}
      {detail ? (
        <div className="hidden w-40 truncate text-sm md:block" style={{ color: 'var(--us-muted)' }}>
          {detail}
        </div>
      ) : null}
      {actions ? (
        <div className="ml-auto flex items-center gap-1.5" onClick={(event) => event.stopPropagation()}>
          {actions}
        </div>
      ) : null}
    </li>
  )
}

const CHIP_TONES = {
  active: 'us-chip-active',
  blue: 'us-chip-blue',
  inactive: 'us-chip-inactive',
  muted: 'us-chip-muted',
  warning: 'us-chip-warning',
} as const

type ChipProps = {
  children: ReactNode
  /** Extra classes, e.g. `capitalize` or a status class from active-status.ts. */
  className?: string
  /** A leading coloured dot (for statuses). */
  dot?: boolean
  /** A leading icon; pick one per kind of chip and reuse it everywhere. */
  icon?: ReactNode
  /** Says what the chip is ("Role in Riverside"), shown on hover. */
  title?: string
  tone?: keyof typeof CHIP_TONES
}

/** The one chip: optional icon or dot, truncates instead of overflowing. */
export function Chip({ children, className = '', dot, icon, title, tone }: ChipProps) {
  return (
    <span className={`us-chip ${tone ? CHIP_TONES[tone] : ''} ${className}`} title={title}>
      {dot ? <span aria-hidden="true" className="us-chip__dot" /> : null}
      {icon}
      <span className="truncate">{children}</span>
    </span>
  )
}

/**
 * Lays chips out in fixed columns (`columns` is a CSS grid-template-columns value, e.g. "12rem 6rem").
 * Pass `null` for a chip that does not apply to keep the others aligned, and `false` for a column
 * that is not shown at all (drop it from `columns` too). Wraps on small screens.
 */
export function ChipGrid({ children, columns }: { children: ReactNode; columns: string }) {
  // Read the direct children rather than via Children.map, which turns `false` into `null`.
  const cells = (Array.isArray(children) ? children : [children]) as ReactNode[]

  return (
    <div className="us-chip-grid" style={{ '--cols': columns } as CSSProperties}>
      {cells.map((cell, index) =>
        cell === false ? null : <Fragment key={index}>{cell ?? <span />}</Fragment>,
      )}
    </div>
  )
}

/** Name with an optional quiet second line and small badges beside the name (invite pending, inactive). */
export function RowTitle({ badges, subtitle, title }: { badges?: ReactNode; subtitle?: ReactNode; title: ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="flex min-w-0 items-center gap-2">
        <p className="truncate text-sm font-semibold" style={{ color: 'var(--us-green-dark)' }}>
          {title}
        </p>
        {badges}
      </div>
      {subtitle ? (
        <p className="truncate text-xs" style={{ color: 'var(--us-muted)' }}>
          {subtitle}
        </p>
      ) : null}
    </div>
  )
}

const ICON_BUTTON_CLASS = 'us-button-secondary inline-flex h-8 w-8 items-center justify-center'

type IconButtonProps = {
  href?: string
  icon: ReactNode
  /** Accessible name and tooltip. */
  label: string
  onClick?: () => void
}

export function IconButton({ href, icon, label, onClick }: IconButtonProps) {
  if (href) {
    return (
      <Link aria-label={label} className={ICON_BUTTON_CLASS} href={href} title={label}>
        {icon}
      </Link>
    )
  }

  return (
    <button aria-label={label} className={ICON_BUTTON_CLASS} onClick={onClick} title={label} type="button">
      {icon}
    </button>
  )
}

export function EditIconButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <IconButton icon={<PencilIcon />} label={label} onClick={onClick} />
}

export function OpenIconButton({ href, label }: { href: string; label: string }) {
  return <IconButton href={href} icon={<ArrowRightIcon />} label={label} />
}

type DeleteIconButtonProps = {
  action: (formData: FormData) => Promise<void>
  confirmLabel?: string
  confirmMessage: string
  /** Hidden form fields the action needs (ids, return path). */
  fields: Record<string, number | string>
  label: string
  /** Heading of the confirmation dialog. */
  title?: string
}

/** Trash icon that asks before running a server action. */
export function DeleteIconButton({ action, confirmLabel = 'Delete', confirmMessage, fields, label, title }: DeleteIconButtonProps) {
  const formId = useId()

  return (
    <form action={action} id={formId}>
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} name={name} type="hidden" value={value} />
      ))}
      <ConfirmSubmitButton
        action={action}
        className={ICON_BUTTON_CLASS}
        confirmLabel={confirmLabel}
        confirmMessage={confirmMessage}
        formId={formId}
        title={title ?? label}
        triggerLabel={label}
      >
        <TrashIcon />
      </ConfirmSubmitButton>
    </form>
  )
}

type FilterTab = { active: boolean; href: string; label: string }

/** A row of links that filter the list below (same look as the event tabs). */
export function FilterTabs({ items, label }: { items: FilterTab[]; label: string }) {
  return (
    <nav aria-label={label} className="us-tabs">
      {items.map((item) => (
        <Link
          aria-current={item.active ? 'page' : undefined}
          className={`us-tab${item.active ? ' us-tab--active' : ''}`}
          href={item.href}
          key={item.label}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
