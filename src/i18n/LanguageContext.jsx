import { createContext, useCallback, useContext, useEffect, useMemo } from 'react'
import { DEFAULT_LANGUAGE, LANGUAGES, localeFor, translate } from './index.js'
import { useLocalStorage } from '../hooks/useLocalStorage.js'

const LanguageContext = createContext(null)

/** Supported codes, used to validate whatever is in localStorage. */
const VALID = new Set(LANGUAGES.map((l) => l.code))

export function LanguageProvider({ children }) {
  const [stored, setStored] = useLocalStorage('aet:language', DEFAULT_LANGUAGE)
  const lang = VALID.has(stored) ? stored : DEFAULT_LANGUAGE

  // Keep <html lang> in sync for a11y, screen readers and hyphenation.
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const locale = localeFor(lang)

  /** Translate a key, optionally interpolating `{tokens}`. */
  const t = useCallback((key, vars) => translate(lang, key, vars), [lang])

  /**
   * Format an ISO date for the active language.
   * Accepts 'YYYY-MM-DD' or anything `toDateInputValue()` produces.
   */
  const formatDate = useCallback(
    (value, options = { day: 'numeric', month: 'short', year: 'numeric' }) => {
      const date = toLocalDate(value)
      if (!date) return '—'
      try {
        return new Intl.DateTimeFormat(locale, options).format(date)
      } catch {
        return date.toDateString()
      }
    },
    [locale],
  )

  /** Short weekday name, e.g. "Du" / "Mon" / "Пн". */
  const formatWeekday = useCallback(
    (value) => {
      const date = toLocalDate(value)
      if (!date) return ''
      try {
        return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(date)
      } catch {
        return ''
      }
    },
    [locale],
  )

  const value = useMemo(
    () => ({ lang, setLang: setStored, locale, t, formatDate, formatWeekday, languages: LANGUAGES }),
    [lang, setStored, locale, t, formatDate, formatWeekday],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

/** Parse 'YYYY-MM-DD' as a *local* date (avoids the UTC-midnight off-by-one). */
function toLocalDate(value) {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value !== 'string') return null
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  if (!match) {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>')
  return ctx
}

/** Convenience hook when you only need the translator. */
export function useT() {
  return useLanguage().t
}

export { LanguageContext }
