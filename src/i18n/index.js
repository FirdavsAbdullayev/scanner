import uz from './uz.js'
import en from './en.js'
import ru from './ru.js'

/** Every supported language, in display order. */
export const LANGUAGES = [
  { code: 'uz', label: "O'zbekcha", short: 'UZ', locale: 'uz-UZ', flag: '🇺🇿' },
  { code: 'en', label: 'English', short: 'EN', locale: 'en-US', flag: '🇬🇧' },
  { code: 'ru', label: 'Русский', short: 'RU', locale: 'ru-RU', flag: '🇷🇺' },
]

export const DEFAULT_LANGUAGE = 'uz'

export const dictionaries = { uz, en, ru }

/** Intl locale used for dates/numbers, per app language. */
export function localeFor(lang) {
  return LANGUAGES.find((l) => l.code === lang)?.locale ?? 'en-US'
}

/**
 * Replace `{token}` placeholders in a translated string.
 * t('item.daysLeft', { n: 3 }) -> "3 kun qoldi"
 */
export function interpolate(template, vars) {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : match,
  )
}

/**
 * Resolve a key for a language with graceful fallbacks:
 * requested language -> Uzbek (source of truth) -> the key itself.
 */
export function translate(lang, key, vars) {
  const table = dictionaries[lang] ?? dictionaries[DEFAULT_LANGUAGE]
  const value = table[key] ?? dictionaries[DEFAULT_LANGUAGE][key] ?? key
  return interpolate(value, vars)
}
