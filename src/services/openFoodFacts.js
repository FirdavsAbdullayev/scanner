/**
 * Open Food Facts integration.
 *
 * Docs: https://openfoodfacts.github.io/openfoodfacts-server/api/
 * Endpoint: https://world.openfoodfacts.org/api/v2/product/{barcode}.json
 *
 * The API is free and CORS-enabled, so we can call it straight from the
 * browser. To stay a good citizen we:
 *   - cache every lookup (positive *and* negative) for the session,
 *   - de-duplicate concurrent requests for the same barcode,
 *   - space requests out through a tiny serial queue (OFF asks for <=100/min).
 */

import { digitsOnly, isValidBarcode } from '../utils/format.js'

const BASE_URL = 'https://world.openfoodfacts.org/api/v2/product'
const FIELDS = [
  'code',
  'product_name',
  'product_name_en',
  'product_name_uz',
  'generic_name',
  'brands',
  'quantity',
  'image_front_url',
  'image_front_small_url',
  'image_url',
  'categories',
  'categories_tags',
  'ingredients_text',
  'ingredients_text_en',
  'nutriscore_grade',
  'nutriscore_grade_2023',
  'nova_group',
].join(',')

/** Minimum gap between two network calls (ms). */
const MIN_INTERVAL = 160

const cache = new Map() // barcode -> normalized product | null
const inFlight = new Map() // barcode -> Promise

let queueTail = Promise.resolve()
let lastRequestAt = 0

export class ProductNotFoundError extends Error {
  constructor(barcode) {
    super(`No product found for barcode ${barcode}`)
    this.name = 'ProductNotFoundError'
    this.code = 'not_found'
    this.barcode = barcode
  }
}

export class InvalidBarcodeError extends Error {
  constructor(barcode) {
    super(`Invalid barcode: ${barcode}`)
    this.name = 'InvalidBarcodeError'
    this.code = 'invalid'
  }
}

/** Serialise + throttle requests so we never burst the public API. */
function schedule(task) {
  const run = queueTail.then(async () => {
    const wait = Math.max(0, MIN_INTERVAL - (Date.now() - lastRequestAt))
    if (wait > 0) await sleep(wait)
    lastRequestAt = Date.now()
    return task()
  })
  // Keep the chain alive even if one task rejects.
  queueTail = run.then(
    () => undefined,
    () => undefined,
  )
  return run
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Look up a product by barcode.
 *
 * @param {string|number} barcode
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<NormalizedProduct>} resolves with the product
 * @throws {InvalidBarcodeError} when the code isn't 6–14 digits
 * @throws {ProductNotFoundError} when OFF has no such product
 * @throws {Error} on network/offline failures
 */
export async function fetchProduct(barcode, options = {}) {
  const code = digitsOnly(barcode)
  if (!isValidBarcode(code)) throw new InvalidBarcodeError(barcode)

  if (cache.has(code)) {
    const hit = cache.get(code)
    if (hit === null) throw new ProductNotFoundError(code)
    return hit
  }
  if (inFlight.has(code)) return inFlight.get(code)

  const promise = schedule(() => requestProduct(code, options), MIN_INTERVAL)
    .then((product) => {
      cache.set(code, product) // `null` caches a "not found" result
      if (product === null) throw new ProductNotFoundError(code)
      return product
    })
    .finally(() => inFlight.delete(code))

  inFlight.set(code, promise)
  return promise
}

/** Raw fetch + normalisation, no caching. */
async function requestProduct(code, { signal } = {}) {
  const url = `${BASE_URL}/${encodeURIComponent(code)}.json?fields=${FIELDS}`
  const response = await fetch(url, {
    signal,
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) {
    // 404 simply means "not in the database".
    if (response.status === 404) return null
    throw new Error(`Open Food Facts responded with ${response.status}`)
  }
  const payload = await response.json().catch(() => null)
  if (!payload || payload.status === 0 || !payload.product) return null
  return normalize(payload.product)
}

/**
 * Shape the raw OFF payload into the flat object the UI expects.
 * @typedef {Object} NormalizedProduct
 * @property {string} barcode
 * @property {string} name
 * @property {string} brand
 * @property {string} image
 * @property {string[]} categories   human readable, most specific first
 * @property {string} ingredients
 * @property {string} nutriScore
 * @property {string} quantity
 * @property {string} source
 */
function normalize(product) {
  const name =
    pickLocalized(product, 'product_name') ||
    product.generic_name ||
    pickLocalized(product, 'ingredients_text').slice(0, 60) ||
    'Unknown product'

  return {
    barcode: String(product.code ?? ''),
    name: name.trim(),
    brand: cleanBrand(product.brands),
    image: product.image_front_url || product.image_front_small_url || product.image_url || '',
    categories: parseCategories(product.categories_tags, product.categories),
    ingredients: (pickLocalized(product, 'ingredients_text') || '').trim(),
    nutriScore: (product.nutriscore_grade_2023 || product.nutriscore_grade || '').toLowerCase(),
    nova: product.nova_group ?? null,
    quantity: (product.quantity || '').trim(),
    source: 'openfoodfacts',
  }
}

/** Prefer the most specific available `product_name*` field. */
function pickLocalized(product, base) {
  return product[base] || product[`${base}_en`] || ''
}

/** "Milka, Mondelez" -> "Milka" (OFF often lists many brands). */
function cleanBrand(brands) {
  if (!brands) return ''
  return String(brands).split(',')[0].trim()
}

/**
 * OFF gives us both `categories_tags` ("en:dairies", "en:spreads") and the
 * free-text `categories` ("Dairies, Spreads"). Prefer the tags because they are
 * canonical, then prettify them.
 */
function parseCategories(tags, freeText) {
  const fromTags = Array.isArray(tags)
    ? tags
        .map((tag) => String(tag).replace(/^[a-z]{2}:/, '').replace(/-/g, ' '))
        .filter(Boolean)
    : []
  const fromText = freeText
    ? String(freeText)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : []
  const merged = fromTags.length ? fromTags : fromText
  // De-duplicate case-insensitively, keep the most specific (last) first.
  const seen = new Set()
  const result = []
  for (let i = merged.length - 1; i >= 0 && result.length < 6; i -= 1) {
    const key = merged[i].toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    result.push(capitalise(merged[i]))
  }
  return result
}

function capitalise(text) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** Exposed for tests/debugging: how many lookups are memoised. */
export function cacheSize() {
  return cache.size
}

/** Clear the in-memory cache (handy when offline and retrying). */
export function clearProductCache() {
  cache.clear()
}
