import Link from 'next/link'

type IconProps = {
  className?: string
}

export function QRCodeIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M15 15h2v2h-2v-2Zm4 0h1v5h-5v-1h4v-4Zm-5 4h2v1h-2v-1Z" fill="currentColor" />
      <path d="M6.5 6.5h1v1h-1v-1Zm10 0h1v1h-1v-1Zm-10 10h1v1h-1v-1Z" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

export function OpenLinkIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path
        d="M14 5h5v5m-.5-4.5L11 13m-2-6H6.5A2.5 2.5 0 0 0 4 9.5v8A2.5 2.5 0 0 0 6.5 20h8a2.5 2.5 0 0 0 2.5-2.5V15"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

export function DownloadIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M12 4v10m0 0 4-4m-4 4-4-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M5 17v1.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V17" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  )
}

export function GitHubIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.18-3.37-1.18a2.65 2.65 0 0 0-1.11-1.46c-.91-.62.07-.6.07-.6a2.1 2.1 0 0 1 1.53 1.03 2.13 2.13 0 0 0 2.91.83 2.13 2.13 0 0 1 .64-1.34c-2.22-.25-4.56-1.11-4.56-4.94a3.87 3.87 0 0 1 1.03-2.68 3.6 3.6 0 0 1 .1-2.65s.84-.27 2.75 1.02A9.47 9.47 0 0 1 12 7c.85 0 1.7.11 2.5.34 1.9-1.29 2.74-1.02 2.74-1.02.55 1.38.2 2.4.1 2.65a3.86 3.86 0 0 1 1.03 2.68c0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.58c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
    </svg>
  )
}

export function LicenseIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M7 3.5h7l3 3V20a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 6 20V5A1.5 1.5 0 0 1 7.5 3.5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M14 3.5V7h3.5M9 12h6M9 15h6M9 18h3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  )
}

export function AndroidIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="m8 5-1.5-2M16 5l1.5-2M6 10h12m-10 0V8a4 4 0 0 1 8 0v2M7 10h10v7.5A2.5 2.5 0 0 1 14.5 20h-5A2.5 2.5 0 0 1 7 17.5V10Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M10 7.7h.01M14 7.7h.01" stroke="currentColor" strokeLinecap="round" strokeWidth="2.4" />
    </svg>
  )
}

export function PencilIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="m4 20 4.8-1.2L19 8.6 15.4 5 5.2 15.2 4 20Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="m13.8 6.6 3.6 3.6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  )
}

export function UserCircleIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path
        d="M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 7a7 7 0 0 0-14 0"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

export function PlusIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M12 5v14m-7-7h14" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  )
}

export function MinusIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M5 12h14" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  )
}

export function ExpandImageIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path
        d="M9 3H5a2 2 0 0 0-2 2v4m16-16v4a2 2 0 0 0-2 2h-4m0 12h4a2 2 0 0 0 2-2v-4M3 15v4a2 2 0 0 0 2 2h4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

export function CollapseImageIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path
        d="M9 9H5V5m14 4h-4V5M9 15H5v4m14-4h-4v4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

export function IconActionLink({
  appearance = 'default',
  children,
  clusterVariant = 'listener',
  href,
  icon,
  target,
}: {
  appearance?: 'cluster-inner' | 'default'
  children: string
  clusterVariant?: 'listener' | 'speaker'
  href: string
  icon: 'open' | 'qr'
  target?: '_blank'
}) {
  const Icon = icon === 'qr' ? QRCodeIcon : OpenLinkIcon

  const className =
    appearance === 'cluster-inner'
      ? `us-route-cluster-inner-btn us-route-cluster-inner-btn-${clusterVariant}`
      : 'inline-flex h-9 w-9 items-center justify-center rounded-full border bg-white/80 transition hover:-translate-y-0.5 hover:shadow-md'
  const style =
    appearance === 'cluster-inner'
      ? undefined
      : { borderColor: 'var(--us-border)', color: 'var(--us-blue-dark)' }

  if (target === '_blank') {
    return (
      <a aria-label={children} className={className} href={href} rel="noreferrer" style={style} target="_blank" title={children}>
        <Icon />
      </a>
    )
  }

  return (
    <Link aria-label={children} className={className} href={href} style={style} title={children}>
      <Icon />
    </Link>
  )
}
