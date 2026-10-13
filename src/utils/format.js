/** Small shared helpers. */

/** Build a stable-ish unique id (crypto.randomUUID with a fallback). */
export function uid(prefix = 'id') {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

/** Collapse whitespace and trim. */
export function cleanText(value) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Keep only digits — used to normalise barcode input. */
export function digitsOnly(value) {
  return String(value ?? '').replace(/\D+/g, '')
}

/** A GTIN/EAN/UPC barcode is 6–14 digits. */
export function isValidBarcode(value) {
  const code = digitsOnly(value)
  return code.length >= 6 && code.length <= 14
}

/** Join non-empty strings with a separator. */
export function joinText(parts, separator = ' · ') {
  return parts.filter(Boolean).join(separator)
}

/** Clamp a number into [min, max]. */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

/** Output of `navigator.language`, mapped to one of our supported codes. */
export function guessLanguageTag() {
  if (typeof navigator === 'undefined') return null
  const tag = (navigator.language || navigator.userLanguage || '').toLowerCase()
  if (tag.startsWith('uz')) return 'uz'
  if (tag.startsWith('ru')) return 'ru'
  if (tag.startsWith('en')) return 'en'
  return null
}

/** True when the page is served from a context where cameras are allowed. */
export function isSecureCameraContext() {
  if (typeof window === 'undefined') return false
  const { protocol, hostname } = window.location
  return protocol === 'https:' || hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]'
}
