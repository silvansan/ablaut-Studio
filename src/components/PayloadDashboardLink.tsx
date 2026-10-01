import { APP_STUDIO_NAME } from '@/lib/branding'

export function PayloadDashboardLink() {
  return (
    <div className="ablaut-admin-dashboard-link">
      {/* Rendered inside the Payload admin shell, outside the app router — a plain anchor is correct here. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/events">Back to {APP_STUDIO_NAME}</a>
    </div>
  )
}
