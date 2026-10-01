'use client'

import Image from 'next/image'

const logoSrc = '/ablaut-icon.png'

export function LogoImage() {
  return (
    <Image
      src={logoSrc}
      alt="ablaut logo"
      width={54}
      height={54}
      priority
      unoptimized
      className="object-contain"
    />
  )
}
