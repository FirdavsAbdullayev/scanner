import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * A `useState` that transparently persists to localStorage and stays in sync
 * with other tabs/windows.
 *
 * - Falls back to `initialValue` when storage is unavailable (private mode, SSR).
 * - Reads through a lazy initialiser so it never parses on every render.
 * - Writes inside an effect and survives QuotaExceededError silently.
 */
export function useLocalStorage(key, initialValue) {
  const readValue = useCallback(() => {
    if (typeof window === 'undefined') return initialValue
    try {
      const raw = window.localStorage.getItem(key)
      if (raw === null) return initialValue
      return JSON.parse(raw)
    } catch {
      return initialValue
    }
  }, [key, initialValue])

  const [value, setValue] = useState(readValue)
  // Remember the latest value so the storage-event handler can compare.
  const valueRef = useRef(value)
  valueRef.current = value

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* storage full or blocked — the app still works in memory */
    }
  }, [key, value])

  // Keep multiple tabs consistent.
  useEffect(() => {
    function onStorage(event) {
      if (event.key !== key || event.newValue === null) return
      try {
        const next = JSON.parse(event.newValue)
        if (JSON.stringify(next) !== JSON.stringify(valueRef.current)) setValue(next)
      } catch {
        /* ignore malformed payloads */
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [key])

  const update = useCallback((next) => {
    setValue((prev) => (typeof next === 'function' ? next(prev) : next))
  }, [])

  return [value, update]
}
