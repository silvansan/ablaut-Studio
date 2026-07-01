export const FEEDBACK_RECIPIENT_EMAIL = process.env.FEEDBACK_RECIPIENT_EMAIL?.trim() || 'admin@silvans.ch'

export function generateFeedbackEmailSubject(): string {
  return 'ablaut-Studio beta feedback'
}

export function generateFeedbackEmailHTML(args: {
  contactEmail?: string | null
  message: string
  pageUrl?: string | null
  reporterEmail?: string | null
  reporterName?: string | null
}): string {
  const lines = [
    '<p>New beta feedback from ablaut-Studio.</p>',
    '<ul>',
    args.reporterName ? `<li><strong>Name:</strong> ${escapeHtml(args.reporterName)}</li>` : '',
    args.reporterEmail ? `<li><strong>Account email:</strong> ${escapeHtml(args.reporterEmail)}</li>` : '',
    args.contactEmail ? `<li><strong>Reply-to email:</strong> ${escapeHtml(args.contactEmail)}</li>` : '',
    args.pageUrl ? `<li><strong>Page:</strong> ${escapeHtml(args.pageUrl)}</li>` : '',
    '</ul>',
    '<p><strong>Message</strong></p>',
    `<pre style="white-space:pre-wrap;font-family:ui-monospace,monospace">${escapeHtml(args.message)}</pre>`,
  ].filter(Boolean)

  return lines.join('\n')
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}
