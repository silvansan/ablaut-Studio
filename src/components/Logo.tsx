import Link from 'next/link'
import { APP_PRONUNCIATION, APP_STUDIO_NAME } from '@/lib/branding'
import { LogoImage } from './LogoImage'

type LogoProps = {
  className?: string
  href?: string
  theme?: 'default' | 'light'
}

export function Logo({ className = '', href = '/', theme = 'default' }: LogoProps) {
  const titleColor = theme === 'light' ? 'white' : 'var(--us-green-dark)'
  const subtitleColor =
    theme === 'light' ? 'color-mix(in srgb, white 78%, transparent)' : 'var(--us-blue-dark)'

  return (
    <Link href={href} className={`inline-flex items-center gap-3 font-semibold ${className}`}>
      <span
        className="overflow-hidden rounded-2xl border border-white/40"
        style={{ boxShadow: 'var(--us-shadow)' }}
      >
        <LogoImage />
      </span>
      <span className="leading-tight">
        <span className="block text-base font-semibold tracking-tight" style={{ color: titleColor }}>
          {APP_STUDIO_NAME}
        </span>
        <span className="block text-xs font-medium uppercase tracking-[0.16em]" style={{ color: subtitleColor }}>
          {APP_PRONUNCIATION}
        </span>
      </span>
    </Link>
  )
}
