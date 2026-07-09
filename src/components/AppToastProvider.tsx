'use client'

import {
  createContext,
  useActionState,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'

import {
  initialActionFeedback,
  type ActionFeedback,
  type ActionFeedbackHandler,
} from '@/lib/action-feedback'

type ToastItem = ActionFeedback & {
  id: number
}

type AppToastContextValue = {
  showToast: (feedback: ActionFeedback) => void
}

const AppToastContext = createContext<AppToastContextValue | null>(null)

const TOAST_DURATION_MS = 4500

export function AppToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextIdRef = useRef(0)

  const showToast = useCallback((feedback: ActionFeedback) => {
    if (!feedback.message.trim()) {
      return
    }

    const id = nextIdRef.current + 1
    nextIdRef.current = id
    setToasts((current) => [...current, { ...feedback, id }])
  }, [])

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  return (
    <AppToastContext.Provider value={{ showToast }}>
      {children}
      <div aria-live="polite" className="us-toast-stack">
        {toasts.map((toast) => (
          <ToastCard key={toast.id} onDismiss={() => dismissToast(toast.id)} toast={toast} />
        ))}
      </div>
    </AppToastContext.Provider>
  )
}

function ToastCard({ onDismiss, toast }: { onDismiss: () => void; toast: ToastItem }) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, TOAST_DURATION_MS)

    return () => {
      window.clearTimeout(timer)
    }
  }, [onDismiss, toast.id])

  return (
    <div className={`us-toast ${toast.ok ? 'us-toast--ok' : 'us-toast--error'}`} role="status">
      <p className="us-toast__message">{toast.message}</p>
      <button aria-label="Dismiss" className="us-toast__dismiss" onClick={onDismiss} type="button">
        ×
      </button>
    </div>
  )
}

export function useAppToast(): AppToastContextValue {
  const context = useContext(AppToastContext)

  if (!context) {
    throw new Error('useAppToast must be used within AppToastProvider')
  }

  return context
}

export function useActionFeedback(action: ActionFeedbackHandler) {
  const { showToast } = useAppToast()
  const router = useRouter()
  const lastMessageRef = useRef('')
  const [state, formAction, pending] = useActionState(action, initialActionFeedback)

  useEffect(() => {
    if (!state.message || state.message === lastMessageRef.current) {
      return
    }

    lastMessageRef.current = state.message
    showToast(state)

    if (state.ok) {
      router.refresh()
    }
  }, [router, showToast, state])

  return { formAction, pending, state }
}
