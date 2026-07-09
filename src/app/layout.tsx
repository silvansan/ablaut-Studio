import '@/styles/globals.css'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import { HashRouteRedirect } from '@/components/HashRouteRedirect'
import { AppToastProvider } from '@/components/AppToastProvider'
import { APP_STUDIO_NAME } from '@/lib/branding'

export const metadata: Metadata = {
  description: 'ablaut-Studio — live translation and audio for events',
  icons: {
    apple: '/apple-icon.png',
    icon: [
      {
        url: '/favicon.ico',
      },
      {
        sizes: '32x32',
        type: 'image/png',
        url: '/icon.png',
      },
      {
        sizes: '32x32',
        type: 'image/png',
        url: '/favicon.png',
      },
    ],
    shortcut: '/favicon.ico',
  },
  title: {
    default: APP_STUDIO_NAME,
    template: `${APP_STUDIO_NAME} | %s`,
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppToastProvider>
          <HashRouteRedirect />
          {children}
        </AppToastProvider>
      </body>
    </html>
  )
}
