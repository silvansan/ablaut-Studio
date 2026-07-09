import Link from 'next/link'

export type BreadcrumbSegment = {
  href?: string
  label: string
}

type AppBreadcrumbsProps = {
  segments: BreadcrumbSegment[]
}

export function AppBreadcrumbs({ segments }: AppBreadcrumbsProps) {
  if (segments.length === 0) {
    return null
  }

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center gap-2 text-sm leading-6">
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1

          return (
            <li className="flex items-center gap-2" key={`${segment.label}-${index}`}>
              {index > 0 ? (
                <span aria-hidden="true" style={{ color: 'var(--us-muted)' }}>
                  /
                </span>
              ) : null}
              {segment.href && !isLast ? (
                <Link className="font-medium hover:underline" href={segment.href} style={{ color: 'var(--us-blue-dark)' }}>
                  {segment.label}
                </Link>
              ) : (
                <span className="font-semibold" style={{ color: 'var(--us-green-dark)' }}>
                  {segment.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
