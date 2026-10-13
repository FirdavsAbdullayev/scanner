/**
 * Universal product lookup — "automatic product intelligence".
 *
 * Goal: *any* barcode, *any* product, always something useful.
 *
 * Layer 1 — open databases (queried in parallel, different hosts):
 *   - Open Food Facts     → food & drinks
 *   - Open Beauty Facts   → cosmetics & hygiene
 *   - Open Products Facts → everything else (household, electronics…)
 *   - Open Pet Food Facts → pet food
 *   - MusicBrainz         → music / film releases (by barcode, best-effort:
 *                           it throttles anonymous clients, so failures are silent)
 *
 * Layer 2 — offline analysis (`barcodeInfo.js`): symbology, GS1 country of
 *   origin and check-digit validation. Always available, even offline.
 *
 * Layer 3 — local knowledge base (`knowledgeBase.js`): everything ever looked
 *   up or entered by hand is remembered, so repeat scans answer instantly.
 *
 * Good-citizen rules: results are cached (positive *and* negative), concurrent
 * requests for the same barcode are de-duplicated, and requests are throttled
 * per host (the public APIs ask for <=100 req/min; MusicBrainz asks for ~1/s).
 */

import { cleanText, digitsOnly, isValidBarcode } from '../utils/format.js'
import { analyzeBarcode } from './barcodeInfo.js'
import { recallProduct, rememberProduct } from './knowledgeBase.js'

/** Databases we consult, in preference order (food wins ties). */
export const SOURCES = [
  {
    id: 'openfoodfacts',
    host: 'world.openfoodfacts.org',
    labelKey: 'source.food',
    emoji: '🍎',
    family: 'openfacts',
    network: true,
    productUrl: (code) => `https://world.openfoodfacts.org/product/${code}`,
  },
  {
    id: 'openbeautyfacts',
    host: 'world.openbeautyfacts.org',
    labelKey: 'source.beauty',
    emoji: '🧴',
    family: 'openfacts',
    network: true,
    productUrl: (code) => `https://world.openbeautyfacts.org/product/${code}`,
  },
  {
    id: 'openproductsfacts',
    host: 'world.openproductsfacts.org',
    labelKey: 'source.products',
    emoji: '📦',
    family: 'openfacts',
    network: true,
    productUrl: (code) => `https://world.openproductsfacts.org/product/${code}`,
  },
  {
    id: 'openpetfoodfacts',
    host: 'world.openpetfoodfacts.org',
    labelKey: 'source.petfood',
    emoji: '🐾',
    family: 'openfacts',
    network: true,
    productUrl: (code) => `https://world.openpetfoodfacts.org/product/${code}`,
  },
  {
    id: 'musicbrainz',
    host: 'musicbrainz.org',
    labelKey: 'source.music',
    emoji: '🎵',
    family: 'musicbrainz',
    network: true,
    minInterval: 1100, // MusicBrainz asks for ~1 request/second
    productUrl: (code) => `https://musicbrainz.org/search?query=barcode%3A${code}&type=release`,
  },
]

/** Non-network "sources" (records the app collected itself). */
const OFFLINE_SOURCES = {
  manual: { id: 'manual', labelKey: 'source.manual', emoji: '📝', network: false },
}

/** Fields we ask every Open Facts database for. Unknown fields are ignored. */
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
  'labels_tags',
  'allergens_tags',
  'ingredients_text',
  'ingredients_text_en',
  'nutriscore_grade',
  'nutriscore_grade_2023',
  'nova_group',
  'nutriments',
  'countries_tags',
  'packaging',
  'stores',
].join(',')

/** Raw `nutriments.*_100g` key → the flat name the UI uses. */
const NUTRIENT_MAP = {
  energyKcal: 'energy-kcal_100g',
  fat: 'fat_100g',
  saturatedFat: 'saturated-fat_100g',
  carbohydrates: 'carbohydrates_100g',
  sugars: 'sugars_100g',
  fiber: 'fiber_100g',
  proteins: 'proteins_100g',
  salt: 'salt_100g',
}
const NUTRIENT_KEYS = Object.keys(NUTRIENT_MAP)

/** Default minimum gap between two calls to the same host (ms). */
const MIN_INTERVAL = 160

const cache = new Map() // barcode -> merged product | null
const inFlight = new Map() // barcode -> Promise<product>
const hostQueues = new Map() // host -> { tail, lastAt }

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

/** Metadata for a source id (used by the UI to render badges). */
export function sourceMeta(id) {
  return SOURCES.find((source) => source.id === id) ?? OFFLINE_SOURCES[id] ?? null
}

/** Serialise + throttle requests *per host*. */
function scheduleOn(host, interval, task) {
  if (!hostQueues.has(host)) hostQueues.set(host, { tail: Promise.resolve(), lastAt: 0 })
  const queue = hostQueues.get(host)
  const run = queue.tail.then(async () => {
    const wait = Math.max(0, interval - (Date.now() - queue.lastAt))
    if (wait > 0) await sleep(wait)
    queue.lastAt = Date.now()
    return task()
  })
  queue.tail = run.then(
    () => undefined,
    () => undefined,
  )
  return run
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Look up a product by barcode across every source and merge the results.
 *
 * @param {string|number} barcode
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<NormalizedProduct>}
 * @throws {InvalidBarcodeError} when the code isn't a plausible GTIN
 * @throws {ProductNotFoundError} when no source knows the code
 * @throws {Error} when every source failed (e.g. offline)
 */
export async function fetchProduct(barcode, options = {}) {
  const code = digitsOnly(barcode)
  if (!isValidBarcode(code)) throw new InvalidBarcodeError(barcode)

  if (cache.has(code)) {
    const hit = cache.get(code)
    if (hit !== null) return hit
    // A previous miss — but the user may have taught us about it since.
    const remembered = recall(code)
    if (remembered) {
      cache.set(code, remembered)
      return remembered
    }
    throw new ProductNotFoundError(code)
  }
  if (inFlight.has(code)) return inFlight.get(code)

  const promise = (async () => {
    try {
      const product = await lookupAll(code, options)
      if (product) {
        rememberProduct(code, product, 'scan')
        return product
      }
      // Nothing live. Fall back to whatever the project already collected.
      return recall(code)
    } catch (error) {
      const remembered = recall(code)
      if (remembered) return remembered
      throw error
    }
  })()
    .then((resolved) => {
      cache.set(code, resolved) // `null` caches a genuine "not found"
      if (resolved === null) throw new ProductNotFoundError(code)
      return resolved
    })
    .finally(() => inFlight.delete(code))

  inFlight.set(code, promise)
  return promise
}

/** Wrap a knowledge-base record with the offline analysis. */
function recall(code) {
  const remembered = recallProduct(code)
  if (!remembered) return null
  return {
    ...remembered,
    fromKnowledgeBase: true,
    info: analyzeBarcode(code),
    checked: SOURCES.map((source) => source.id),
  }
}

/** Fire every source in parallel and merge whatever comes back. */
async function lookupAll(code, { signal } = {}) {
  const outcomes = await Promise.all(SOURCES.map((source) => requestSource(source, code, signal)))

  const found = outcomes.filter((outcome) => outcome.product)
  if (found.length) {
    // MusicBrainz is a *media* database while the Open Facts family describes
    // physical products, so a stray release sharing a food barcode would only
    // add noise. Use its hits only when no product database knows the code.
    const productHits = found.filter((outcome) => outcome.source.family === 'openfacts')
    const merged = mergeProducts(productHits.length ? productHits : found)
    merged.info = analyzeBarcode(code)
    merged.checked = outcomes.map((outcome) => outcome.source.id)
    return merged
  }

  // Nothing found. If at least one database answered "no such product" we call
  // it a genuine not-found — but if *every* request errored we surface the
  // network failure instead so the UI can tell the user to retry.
  if (outcomes.some((outcome) => outcome.ok)) return null
  throw outcomes[0]?.error ?? new Error('All product sources failed')
}

/** Query a single database; never throws — the outcome object carries the error. */
async function requestSource(source, code, signal) {
  try {
    const product = await scheduleOn(source.host, source.minInterval ?? MIN_INTERVAL, () =>
      source.family === 'musicbrainz'
        ? requestMusicBrainz(source, code, signal)
        : requestOpenFacts(source, code, signal),
    )
    return { source, ok: true, product: product ?? null }
  } catch (error) {
    return { source, ok: false, product: null, error }
  }
}

async function requestOpenFacts(source, code, signal) {
  const url = `https://${source.host}/api/v2/product/${encodeURIComponent(code)}.json?fields=${FIELDS}`
  const response = await fetch(url, { signal, headers: { Accept: 'application/json' } })
  if (response.status === 404) return null
  if (!response.ok) throw new Error(`${source.host} responded with ${response.status}`)

  const payload = await response.json().catch(() => null)
  if (!payload || payload.status === 0 || !payload.product) return null

  const product = normalize(payload.product, source)
  // Guard against the empty "ghost" records the open databases sometimes
  // accumulate — a hit is only useful if it actually says *something*.
  return isUseful(product) ? product : null
}

async function requestMusicBrainz(source, code, signal) {
  const query = encodeURIComponent(`barcode:${code}`)
  const url = `https://${source.host}/ws/2/release/?query=${query}&fmt=json&limit=5`
  const response = await fetch(url, { signal, headers: { Accept: 'application/json' } })

  // MusicBrainz throttles anonymous/undescriptive clients with 403/429/503 (and
  // a browser cannot set a custom User-Agent). Treat any such answer as "this
  // source has nothing for us" — it must never break the whole lookup.
  if (!response.ok) return null

  const payload = await response.json().catch(() => null)
  const releases = payload?.releases ?? []
  // MusicBrainz search is fuzzy — only accept an exact barcode match.
  const match = releases.find((release) => String(release.barcode ?? '').trim() === code)
  return match ? normalizeRelease(match, code) : null
}

/** True when a record carries any meaningful, displayable information. */
function isUseful(product) {
  return Boolean(
    hasName(product.name) ||
      product.brand ||
      product.image ||
      product.quantity ||
      product.ingredients ||
      product.categories.length,
  )
}

/**
 * Shape a raw Open Facts payload into the flat record the UI expects.
 *
 * @typedef {Object} NormalizedProduct
 * @property {string}   barcode
 * @property {string}   name
 * @property {string}   genericName
 * @property {string}   brand
 * @property {string}   quantity
 * @property {string}   image
 * @property {string}   imageSmall
 * @property {string[]} categories
 * @property {string[]} labels
 * @property {string[]} allergens
 * @property {string}   ingredients
 * @property {string}   nutriScore   'a'..'e' or ''
 * @property {number|null} nova      1..4 or null
 * @property {string[]} countries
 * @property {string}   packaging
 * @property {string}   stores
 * @property {string}   format       media format (MusicBrainz)
 * @property {string}   label        record label (MusicBrainz)
 * @property {string}   releaseDate  release date (MusicBrainz)
 * @property {Record<string, number|null>} nutriments  per 100 g
 * @property {string}   source      winning database id
 * @property {string[]} sources     every database that had a hit
 * @property {import('./barcodeInfo.js').BarcodeInfo} [info]  offline analysis
 * @property {string[]} [checked]   every database that was queried
 * @property {boolean}  [fromKnowledgeBase]
 */
function normalize(product, source) {
  return {
    barcode: String(product.code ?? ''),
    name: firstNonEmpty(pickLocalized(product, 'product_name'), product.generic_name) || 'Unknown product',
    genericName: cleanText(product.generic_name),
    brand: cleanBrand(product.brands),
    quantity: cleanText(product.quantity),
    image: product.image_front_url || product.image_front_small_url || product.image_url || '',
    imageSmall: product.image_front_small_url || '',
    categories: parseTags(product.categories_tags, product.categories, 6),
    labels: parseTags(product.labels_tags, null, 6),
    allergens: parseTags(product.allergens_tags, null, 6),
    ingredients: cleanText(pickLocalized(product, 'ingredients_text')),
    nutriScore: validGrade(product.nutriscore_grade_2023 || product.nutriscore_grade),
    nova: validNova(product.nova_group),
    countries: parseTags(product.countries_tags, null, 3),
    packaging: cleanText(product.packaging),
    stores: cleanText(product.stores),
    format: '',
    label: '',
    releaseDate: '',
    nutriments: readNutriments(product.nutriments),
    source: source.id,
    sources: [source.id],
  }
}

/** Shape a MusicBrainz release into the same flat record. */
function normalizeRelease(release, code) {
  const artists = (release['artist-credit'] ?? [])
    .map((credit) => credit?.name)
    .filter(Boolean)
    .join(', ')
  const labels = (release['label-info'] ?? [])
    .map((info) => info?.label?.name)
    .filter(Boolean)
  const formats = (release.media ?? []).map((medium) => medium?.format).filter(Boolean)
  const mbid = release.id

  return {
    barcode: String(release.barcode ?? code),
    name: cleanText(release.title) || 'Unknown product',
    genericName: '',
    brand: artists,
    quantity: formats[0] ?? '',
    image: mbid ? `https://coverartarchive.org/release/${mbid}/front-250` : '',
    imageSmall: '',
    categories: [...new Set(formats)].slice(0, 4),
    labels: [],
    allergens: [],
    ingredients: '',
    nutriScore: '',
    nova: null,
    countries: release.country ? [String(release.country).toUpperCase()] : [],
    packaging: '',
    stores: '',
    format: [...new Set(formats)].join(', '),
    label: [...new Set(labels)].slice(0, 2).join(', '),
    releaseDate: cleanText(release.date),
    nutriments: readNutriments(null),
    source: 'musicbrainz',
    sources: ['musicbrainz'],
    externalId: mbid ?? '',
  }
}

/**
 * Blend several hits into one record: the most complete product becomes the
 * base, the rest fill the gaps, and list fields are unioned.
 */
function mergeProducts(found) {
  const order = SOURCES.map((source) => source.id)
  const ranked = [...found].sort((a, b) => {
    const diff = completeness(b.product) - completeness(a.product)
    if (diff !== 0) return diff
    return order.indexOf(a.source.id) - order.indexOf(b.source.id)
  })

  const base = ranked[0].product
  const merged = {
    ...base,
    categories: [...base.categories],
    labels: [...base.labels],
    allergens: [...base.allergens],
    countries: [...base.countries],
    nutriments: { ...base.nutriments },
    sources: found.map((outcome) => outcome.source.id),
  }

  for (const { product } of ranked.slice(1)) {
    if (!hasName(merged.name)) merged.name = product.name
    if (!merged.brand) merged.brand = product.brand
    if (!merged.image) {
      merged.image = product.image
      merged.imageSmall = product.imageSmall
    }
    if (!merged.quantity) merged.quantity = product.quantity
    if (!merged.genericName) merged.genericName = product.genericName
    if (!merged.ingredients) merged.ingredients = product.ingredients
    if (!merged.nutriScore) merged.nutriScore = product.nutriScore
    if (!merged.nova) merged.nova = product.nova
    if (!merged.packaging) merged.packaging = product.packaging
    if (!merged.stores) merged.stores = product.stores
    if (!merged.format) merged.format = product.format
    if (!merged.label) merged.label = product.label
    if (!merged.releaseDate) merged.releaseDate = product.releaseDate

    unionInto(merged.categories, product.categories, 6)
    unionInto(merged.labels, product.labels, 6)
    unionInto(merged.allergens, product.allergens, 6)
    unionInto(merged.countries, product.countries, 3)

    for (const key of NUTRIENT_KEYS) {
      if (merged.nutriments[key] == null) merged.nutriments[key] = product.nutriments[key]
    }
  }

  merged.enrichedAt = Date.now()
  return merged
}

/** Rough "how much do we know?" score used to pick the base record. */
function completeness(product) {
  let score = 0
  if (hasName(product.name)) score += 2
  if (product.brand) score += 1
  if (product.image) score += 2
  if (product.quantity) score += 1
  if (product.ingredients) score += 2
  if (product.nutriScore) score += 1
  if (product.nova) score += 1
  score += Math.min(product.categories.length, 3) * 0.5
  score += Math.min(product.labels.length + product.allergens.length, 4) * 0.25
  for (const key of NUTRIENT_KEYS) if (product.nutriments[key] != null) score += 0.5
  return score
}

function hasName(name) {
  return Boolean(name) && name !== 'Unknown product'
}

function firstNonEmpty(...values) {
  return values.find((value) => Boolean(value) && String(value).trim())?.trim() ?? ''
}

function unionInto(target, values, limit) {
  for (const value of values) {
    if (target.length >= limit) break
    if (!target.some((existing) => existing.toLowerCase() === value.toLowerCase())) target.push(value)
  }
}

/** Prefer the most specific available `product_name*` field. */
function pickLocalized(product, base) {
  return product[base] || product[`${base}_en`] || ''
}

/** "Milka, Mondelez" -> "Milka" (databases often list many brands). */
function cleanBrand(brands) {
  if (!brands) return ''
  return String(brands).split(',')[0].trim()
}

/** Only accept a real Nutri-Score letter; OFF sometimes stores "unknown". */
function validGrade(value) {
  const grade = String(value ?? '').trim().toLowerCase()
  return /^[a-e]$/.test(grade) ? grade : ''
}

/** NOVA group is 1–4; anything else (missing, "unknown") becomes null. */
function validNova(value) {
  const nova = Number(value)
  return Number.isInteger(nova) && nova >= 1 && nova <= 4 ? nova : null
}

/** Pull the `*_100g` values out of the `nutriments` blob as plain numbers. */
function readNutriments(nutriments) {
  const out = {}
  const source = nutriments && typeof nutriments === 'object' ? nutriments : {}
  for (const [key, raw] of Object.entries(NUTRIENT_MAP)) {
    out[key] = toNumber(source[raw])
  }
  return out
}

function toNumber(value) {
  if (value === '' || value === null || value === undefined) return null
  const num = typeof value === 'number' ? value : Number(String(value).replace(',', '.'))
  return Number.isFinite(num) ? num : null
}

/**
 * Databases give `categories_tags` ("en:dairies") *and* a free-text
 * `categories` ("Dairies, Spreads"). Tags are canonical, so we prefer them.
 */
function parseTags(tags, freeText, limit = 6) {
  const fromTags = Array.isArray(tags)
    ? tags.map((tag) => prettifyTag(String(tag))).filter(Boolean)
    : []
  const fromText = freeText
    ? String(freeText)
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean)
    : []
  const merged = fromTags.length ? fromTags : fromText

  // De-duplicate case-insensitively, keeping the most specific (last) entries.
  const seen = new Set()
  const result = []
  for (let i = merged.length - 1; i >= 0 && result.length < limit; i -= 1) {
    const key = merged[i].toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    result.push(merged[i])
  }
  return result
}

/** "en:sweet-spreads" -> "Sweet spreads" */
function prettifyTag(tag) {
  const text = tag.replace(/^[a-z]{2}:/, '').replace(/-/g, ' ').trim()
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** Exposed for tests/debugging: how many lookups are memoised. */
export function cacheSize() {
  return cache.size
}

/** Clear the in-memory cache (handy after going back online). */
export function clearProductCache() {
  cache.clear()
}
