'use server'

import configPromise from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import { getCurrentAppUser } from '@/lib/app-auth'
import {
  FEEDBACK_RECIPIENT_EMAIL,
  generateFeedbackEmailHTML,
  generateFeedbackEmailSubject,
} from '@/lib/feedback'
import { consumeRateLimit } from '@/lib/rate-limit'

export type FeedbackActionState = {
  error?: string
  success?: boolean
}

function stringValue(formData: FormData, key: string): string | undefined {
  const value = formData.get(key)

  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
}

export async function submitFeedbackAction(
  _previousState: FeedbackActionState,
  formData: FormData,
): Promise<FeedbackActionState> {
  const message = stringValue(formData, 'message')
  const contactEmail = stringValue(formData, 'contactEmail')?.toLowerCase()
  const pageUrl = stringValue(formData, 'pageUrl')

  if (!message || message.length < 10) {
    return { error: 'Please describe the issue in at least 10 characters.' }
  }

  if (message.length > 5000) {
    return { error: 'Feedback message is too long.' }
  }

  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    return { error: 'Please enter a valid contact email.' }
  }

  const payload = await getPayload({ config: configPromise })
  const user = await getCurrentAppUser()
  const requestHeaders = await headers()
  const referer = requestHeaders.get('referer')
  const forwardedFor = requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim()
  const clientIP = forwardedFor || requestHeaders.get('x-real-ip') || 'unknown'
  const rateLimitKey = `feedback:${user?.id ?? clientIP}`

  if (!consumeRateLimit(rateLimitKey, { limit: 5, windowMs: 10 * 60_000 })) {
    return { error: 'Too many feedback messages sent recently. Please wait a few minutes.' }
  }

  try {
    await payload.sendEmail({
      html: generateFeedbackEmailHTML({
        contactEmail,
        message,
        pageUrl: pageUrl ?? referer,
        reporterEmail: user?.email,
        reporterName: user?.name,
      }),
      replyTo: contactEmail ?? user?.email ?? undefined,
      subject: generateFeedbackEmailSubject(),
      to: FEEDBACK_RECIPIENT_EMAIL,
    })
  } catch {
    return { error: 'We could not send your feedback right now. Try again later or email admin@silvans.ch directly.' }
  }

  return { success: true }
}
