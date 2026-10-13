import { useCallback, useMemo, useRef, useState } from 'react'
import { uid } from '../utils/format.js'

const DEFAULT_DURATION = 3200

/**
 * Tiny toast queue.
 *
 * Usage:
 *   const { toasts, push, dismiss } = useToast()
 *   push({ title: t('toast.added', { name }), tone: 'success' })
 *
 * `tone` is one of: success | error | info | warning
 */
export function useToast() {
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Map())

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const push = useCallback(
    (toast) => {
      const id = toast.id ?? uid('toast')
      const entry = {
        id,
        title: toast.title ?? '',
        description: toast.description ?? '',
        tone: toast.tone ?? 'info',
        duration: toast.duration ?? DEFAULT_DURATION,
      }
      // Newest first, cap the stack so it never overflows the viewport.
      setToasts((prev) => [entry, ...prev].slice(0, 4))

      if (entry.duration > 0) {
        const timer = setTimeout(() => dismiss(id), entry.duration)
        timers.current.set(id, timer)
      }
      return id
    },
    [dismiss],
  )

  const clear = useCallback(() => {
    timers.current.forEach((timer) => clearTimeout(timer))
    timers.current.clear()
    setToasts([])
  }, [])

  return useMemo(() => ({ toasts, push, dismiss, clear }), [toasts, push, dismiss, clear])
}
