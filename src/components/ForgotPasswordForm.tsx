'use client'

import { FormEvent, useState } from 'react'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function submitForgotPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch('/api/app/request-access-link', {
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      setLoading(false)

      if (response.status === 429) {
        setError('Too many requests. Wait a few minutes and try again.')
        return
      }

      if (!response.ok) {
        setError('Enter the email address of your account and try again.')
        return
      }

      setSent(true)
    } catch {
      setLoading(false)
      setError('Password reset did not finish. Check the server connection and try again.')
    }
  }

  return (
    <form onSubmit={submitForgotPassword} className="space-y-4">
      <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
        Account email
        <input
          autoComplete="email"
          className="us-input mt-2"
          disabled={sent}
          onChange={(event) => setEmail(event.target.value)}
          required
          style={{ borderColor: 'var(--us-border)', color: 'var(--us-text)' }}
          type="email"
          value={email}
        />
      </label>

      {sent ? (
        <p className="rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: 'var(--us-green)', color: 'var(--us-green-dark)' }}>
          If an active account uses that email, a new link is on its way. Check your inbox and spam folder.
        </p>
      ) : null}

      {error ? (
        <p className="rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: 'var(--us-danger)', color: 'var(--us-danger)' }}>
          {error}
        </p>
      ) : null}

      <button disabled={loading || sent} type="submit" className="us-button-primary w-full px-5 py-3 text-sm font-medium">
        {loading ? 'Sending...' : sent ? 'Link sent' : 'Email me a new link'}
      </button>
    </form>
  )
}
