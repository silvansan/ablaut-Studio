import { APP_PRODUCT_NAME, APP_STUDIO_NAME } from '@/lib/branding'

export function PayloadDashboardIntro() {
  return (
    <section className="ablaut-admin-intro">
      <div>
        <p>Advanced back office</p>
        <h2>Payload admin is for super admins.</h2>
        <span>
          Use the main {APP_STUDIO_NAME} app for daily event, channel, user, and assignment work. The product name
          remains {APP_PRODUCT_NAME}.
        </span>
      </div>
      {/* Rendered inside the Payload admin shell, outside the app router — a plain anchor is correct here. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/events">Open app</a>
    </section>
  )
}
