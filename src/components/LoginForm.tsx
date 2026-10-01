'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

function getSafeNextPath(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return '/events'
  }

  if (value.startsWith('/listen/') || value.startsWith('/speak/')) {
    return '/events'
  }

  return value
}

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [password, setPassword] = useState('')

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const normalizedEmail = email.trim().toLowerCase()
      const response = await fetch('/api/users/login', {
        body: JSON.stringify({ email: normalizedEmail, password }),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      setLoading(false)

      if (!response.ok) {
        const failureResponse = await fetch('/api/app/login-failure', {
          body: JSON.stringify({ email: normalizedEmail }),
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
        })
        const failurePayload = (await failureResponse.json().catch(() => null)) as { error?: string } | null
        setError(failurePayload?.error ?? 'The email or password did not work. Check the account and try again.')
        return
      }

      router.replace(getSafeNextPath(searchParams.get('next')))
      router.refresh()
    } catch {
      setLoading(false)
      setError('Login did not finish. Check the server connection and try again.')
    }
  }

  return (
    <form onSubmit={submitLogin} className="space-y-4">
      <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
        Email
        <input
          autoComplete="email"
          className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
          onChange={(event) => setEmail(event.target.value)}
          required
          style={{ borderColor: 'var(--us-border)', color: 'var(--us-text)' }}
          type="email"
          value={email}
        />
      </label>

      <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
        Password
        <input
          autoComplete="current-password"
          className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
          onChange={(event) => setPassword(event.target.value)}
          required
          style={{ borderColor: 'var(--us-border)', color: 'var(--us-text)' }}
          type="password"
          value={password}
        />
      </label>

      {error ? (
        <p className="rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: 'var(--us-danger)', color: 'var(--us-danger)' }}>
          {error}
        </p>
      ) : null}

      <button disabled={loading} type="submit" className="us-button-primary w-full px-5 py-3 text-sm font-medium">
        {loading ? 'Signing in...' : 'Sign in'}
      </button>
      <div className="text-center">
        <Link href="/forgot-password" className="text-sm font-medium" style={{ color: 'var(--us-blue-dark)' }}>
          Lost password?
        </Link>
      </div>
      {loading ? (
        <p className="text-center text-xs" style={{ color: 'var(--us-muted)' }}>
          First login after a rebuild can take a few seconds.
        </p>
      ) : null}
    </form>
  )
}
