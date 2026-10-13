/**
 * Date helpers.
 *
 * Everything is normalised to *local* midnight so that "days left" never
 * suffers from the classic `new Date('2026-01-01')` UTC off-by-one bug.
 */

export const MS_PER_DAY = 86_400_000

/** Status thresholds — an item is "expiring soon" within this many days. */
export const EXPIRING_SOON_DAYS = 3

export const STATUS = {
  FRESH: 'fresh',
  EXPIRING_SOON: 'expiringSoon',
  EXPIRED: 'expired',
}

/** Strip the time component from a Date. */
export function startOfDay(date = new Date()) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

/** Today at local midnight. */
export function today() {
  return startOfDay(new Date())
}

/**
 * Parse 'YYYY-MM-DD' (or a Date) as a local date.
 * @returns {Date|null}
 */
export function parseDate(value) {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : startOfDay(value)
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value))
  if (!match) {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : startOfDay(parsed)
  }
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
}

/** Format a Date as the `YYYY-MM-DD` string an <input type="date"> expects. */
export function toDateInputValue(date = new Date()) {
  const d = parseDate(date) ?? today()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

/** Add `days` to a date and return a new `YYYY-MM-DD` string. */
export function addDays(days, from = new Date()) {
  const d = parseDate(from) ?? today()
  d.setDate(d.getDate() + days)
  return toDateInputValue(d)
}

/**
 * Whole days between today and the given expiry date.
 *  - negative → already expired
 *  - 0        → expires today
 *  - positive → days remaining
 */
export function daysUntil(value) {
  const target = parseDate(value)
  if (!target) return Number.POSITIVE_INFINITY
  return Math.round((target.getTime() - today().getTime()) / MS_PER_DAY)
}

/**
 * Auto-calculated status of an item, based on its expiry date only.
 * This is never stored on the item — always derived, so it stays correct
 * even if the app is left open across midnight or restored from storage.
 */
export function getStatus(value) {
  const days = daysUntil(value)
  if (days < 0) return STATUS.EXPIRED
  if (days <= EXPIRING_SOON_DAYS) return STATUS.EXPIRING_SOON
  return STATUS.FRESH
}

/** Relative "days left" bucket used for copy + colouring. */
export function getDayBucket(value) {
  const days = daysUntil(value)
  if (days < 0) return 'expired'
  if (days === 0) return 'today'
  if (days === 1) return 'tomorrow'
  if (days <= EXPIRING_SOON_DAYS) return 'soon'
  return 'later'
}

/**
 * Human readable "days left" label — returns a translation *key* plus vars so
 * the caller can localise it:
 *
 *   const { key, vars } = describeDaysLeft(item.expiryDate)
 *   t(key, vars)
 */
export function describeDaysLeft(value) {
  const days = daysUntil(value)
  if (days < 0) return { key: 'item.expiredDays', vars: { n: Math.abs(days) } }
  if (days === 0) return { key: 'item.expiresToday', vars: undefined }
  if (days === 1) return { key: 'item.daysLeftOne', vars: undefined }
  return { key: 'item.daysLeft', vars: { n: days } }
}

/** Ascending comparator by expiry date (soonest first, invalid dates last). */
export function compareByExpiry(a, b) {
  return (parseDate(a.expiryDate)?.getTime() ?? Infinity) - (parseDate(b.expiryDate)?.getTime() ?? Infinity)
}

/** The next `count` days as `YYYY-MM-DD` strings, starting today. */
export function nextDays(count, from = new Date()) {
  const base = parseDate(from) ?? today()
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(base)
    d.setDate(d.getDate() + i)
    return toDateInputValue(d)
  })
}
