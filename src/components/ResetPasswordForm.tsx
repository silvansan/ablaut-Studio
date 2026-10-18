'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { checkNewPassword, MIN_PASSWORD_LENGTH } from '@/lib/password-policy'

type ResetPasswordFormProps = {
  /** Which email the link was issued for; shown so people know which account they are setting up. */
  email: string
  kind: 'invite' | 'reset'
  token: string
}

type Stage = 'form' | 'signed-in' | 'saved'

export function ResetPasswordForm({ email, kind, token }: ResetPasswordFormProps) {
  const router = useRouter()
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [linkExpired, setLinkExpired] = useState(false)
  const [loading, setLoading] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [stage, setStage] = useState<Stage>('form')

  async function signIn(address: string, newPassword: string) {
    try {
      const response = await fetch('/api/users/login', {
        body: JSON.stringify({ email: address, password: newPassword }),
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })

      return response.ok
    } catch {
      return false
    }
  }

  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const problem = checkNewPassword(password, confirmPassword)

    if (problem === 'too_short') {
      setError(`Use at least ${MIN_PASSWORD_LENGTH} characters for the password.`)
      return
    }

    if (problem === 'mismatch') {
      setError('The two passwords do not match.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/app/reset-password', {
        body: JSON.stringify({ password, token }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const result = (await response.json().catch(() => null)) as {
        code?: string
        email?: null | string
        error?: string
      } | null

      if (!response.ok) {
        setLoading(false)
        setLinkExpired(result?.code === 'invalid_token')
        setError(result?.error ?? 'The password could not be saved. Try again.')
        return
      }

      // The account is active and the password is saved. Sign in straight away so the
      // person lands in the app instead of retyping what they just chose.
      const signedIn = await signIn(result?.email ?? email, password)
      setLoading(false)
      setPassword('')
      setConfirmPassword('')

      if (signedIn) {
        setStage('signed-in')
        router.replace('/events')
        router.refresh()
        return
      }

      setStage('saved')
    } catch {
      setLoading(false)
      setError('Could not reach the server. Check your connection and try again.')
    }
  }

  if (stage !== 'form') {
    return (
      <div className="space-y-4" role="status">
        <p className="rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: 'var(--us-green)', color: 'var(--us-green-dark)' }}>
          {stage === 'signed-in'
            ? 'Password saved. Signing you in...'
            : 'Password saved. You can sign in with it now.'}
        </p>
        {stage === 'saved' ? (
          <Link className="us-button-primary inline-flex px-5 py-3 text-sm font-medium" href="/">
            Continue to sign in
          </Link>
        ) : null}
      </div>
    )
  }

  return (
    <form className="space-y-4" onSubmit={submitPassword}>
      <p className="text-sm" style={{ color: 'var(--us-muted)' }}>
        Account: <strong style={{ color: 'var(--us-text)' }}>{email}</strong>
      </p>

      <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
        {kind === 'invite' ? 'Choose a password' : 'New password'}
        <input
          autoComplete="new-password"
          autoFocus
          className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
          minLength={MIN_PASSWORD_LENGTH}
          onChange={(event) => setPassword(event.target.value)}
          required
          style={{ borderColor: 'var(--us-border)', color: 'var(--us-text)' }}
          type={showPassword ? 'text' : 'password'}
          value={password}
        />
      </label>

      <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
        Confirm password
        <input
          autoComplete="new-password"
          className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
          style={{ borderColor: 'var(--us-border)', color: 'var(--us-text)' }}
          type={showPassword ? 'text' : 'password'}
          value={confirmPassword}
        />
      </label>

      <div className="flex items-center justify-between gap-3 text-xs" style={{ color: 'var(--us-muted)' }}>
        <span>At least {MIN_PASSWORD_LENGTH} characters.</span>
        <label className="flex items-center gap-2">
          <input
            checked={showPassword}
            onChange={(event) => setShowPassword(event.target.checked)}
            type="checkbox"
          />
          Show password
        </label>
      </div>

      {error ? (
        <div className="rounded-2xl border px-4 py-3 text-sm" role="alert" style={{ borderColor: 'var(--us-danger)', color: 'var(--us-danger)' }}>
          <p>{error}</p>
          {linkExpired ? (
            <p className="mt-2">
              <Link className="font-medium underline" href="/forgot-password">
                Request a new link
              </Link>
            </p>
          ) : null}
        </div>
      ) : null}

      <button className="us-button-primary w-full px-5 py-3 text-sm font-medium" disabled={loading} type="submit">
        {loading ? 'Saving...' : kind === 'invite' ? 'Activate account' : 'Save password'}
      </button>
    </form>
  )
}
