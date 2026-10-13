import { createContext, useContext, useMemo } from 'react'
import { useToast } from '../hooks/useToast.js'
import { Toasts } from '../components/ui/Toasts.jsx'

const ToastContext = createContext(null)

/**
 * Provides the toast queue to the whole tree and renders the portal-free
 * toast stack (it is `position: fixed`, so placement in the tree is fine).
 */
export function ToastProvider({ children }) {
  const { toasts, push, dismiss, clear } = useToast()
  const value = useMemo(() => ({ toasts, toast: push, dismiss, clearToasts: clear }), [toasts, push, dismiss, clear])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toasts toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToastContext() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToastContext must be used inside <ToastProvider>')
  return ctx
}

export { ToastContext }
