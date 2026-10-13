/**
 * Universal product lookup — "automatic product intelligence".
 *
 * Goal: *any* barcode, *any* product, always something useful.
 *
 * Layer 1 — databases, queried in parallel (every source is a different host, so
 * they run concurrently; each host is throttled individually):
 *
 *   Open Facts family — physical products, crowdsourced, highest trust:
 *     - Open Food Facts     → food & drinks
 *     - Open Beauty Facts   → cosmetics & hygiene
 *     - Open Products Facts → everything else (household, electronics…)
 *     - Open Pet Food Facts → pet food
 *   Media:
 *     - iTunes              → music releases (name, artist, artwork, tracks)
 *     - MusicBrainz         → music releases (best-effort: it throttles anonymous
 *                             clients, so failures are silent)
 *   Medicine (US NDC / UPC):
 *     - openFDA             → drug name, labeler, dosage form, active ingredients
 *   Books (ISBN):
 *     - Open Library        → title, authors, publisher, pages, cover
 *     - Google Books        → same, quota-limited (429 is treated as "no data")
 *   Retail catalogues (optional, require a free API key — see `apiKeys.js`):
 *     - UPCitemdb / EAN-Search / Go-UPC → broad general-merchandise coverage
 *
 * Layer 2 — offline analysis (`barcodeInfo.js`): symbology, GS1 country of
 *   origin and check-digit validation. Always available, even offline.
 *
 * Layer 3 — local knowledge base (`knowledgeBase.js`): everything ever looked
 *   up or entered by hand is remembered, so repeat scans answer instantly.
 *
 * Databases describe different *domains*, and a barcode collision between them
 * would only add noise (a "Nutella" song, a drug sharing a food code). So hits
 * are grouped into families and only the highest-priority non-empty family is
 * used — `openfacts > retail > medicine > book > media`.
 *
 * Good-citizen rules: results are cached (positive *and* negative), concurrent
 * requests for the same barcode are de-duplicated, and requests are throttled
 * per host (the public APIs ask for <=100 req/min; MusicBrainz asks for ~1/s).
 */

import { cleanText, digitsOnly, isValidBarcode } from '../utils/format.js'
import { analyzeBarcode, gtinVariants } from './barcodeInfo.js'
import { KEY_PROVIDERS, getApiKey } from './apiKeys.js'
import { recallProduct, rememberProduct } from './knowledgeBase.js'

/** Store-internal, weight and coupon codes never identify a public product. */
const isLookupable = (info) => !info || (info.kind !== 'internal' && info.kind !== 'coupon')
/** Ordinary retail product code — the Open Facts family lives here. */
const isProductKind = (info) => isLookupable(info) && (!info || info.kind === 'product')
/** ISBN — the book catalogues live here. */
const isBookKind = (info) => Boolean(info) && info.kind === 'book'

/**
 * Order of trust between domains: the first non-empty family wins.
 *
 * `medicine` outranks `openfacts` on purpose. An openFDA hit is an *exact* match
 * against a regulatory registry — it proves the code is a drug — whereas the
 * crowdsourced Open Facts databases demonstrably contain mis-scanned "ghost"
 * records (e.g. a beauty entry squatting on a painkiller's UPC).
 */
const FAMILY_ORDER = ['medicine', 'openfacts', 'retail', 'book', 'media']
/** Which `productKind` a family maps to (drives the card's badge). */
const FAMILY_KIND = {
  openfacts: 'product',
  retail: 'product',
  medicine: 'medicine',
  book: 'book',
  media: 'media',
}

/**
 * Every database we consult.
 *
 * @typedef {Object} ProductSource
 * @property {string}   id
 * @property {string}   host            throttling bucket
 * @property {string}   labelKey        i18n key for the badge
 * @property {string}   emoji
 * @property {string}   family          'openfacts'|'retail'|'medicine'|'book'|'media'
 * @property {boolean}  network
 * @property {number}   [minInterval]   ms between two calls to this host
 * @property {string}   [requiresKey]   provider id from `apiKeys.js`
 * @property {(info: import('./barcodeInfo.js').BarcodeInfo|null) => boolean} matches
 * @property {(source: ProductSource, code: string, signal?: AbortSignal) => Promise<NormalizedProduct|null>} request
 * @property {(code: string) => string} productUrl
 */
export const SOURCES = [
  {
    id: 'openfoodfacts',
    host: 'world.openfoodfacts.org',
    labelKey: 'source.food',
    emoji: '🍎',
    family: 'openfacts',
    network: true,
    matches: isProductKind,
    request: requestOpenFacts,
    productUrl: (code) => `https://world.openfoodfacts.org/product/${code}`,
  },
  {
    id: 'openbeautyfacts',
    host: 'world.openbeautyfacts.org',
    labelKey: 'source.beauty',
    emoji: '🧴',
    family: 'openfacts',
    network: true,
    matches: isProductKind,
    request: requestOpenFacts,
    productUrl: (code) => `https://world.openbeautyfacts.org/product/${code}`,
  },
  {
    id: 'openproductsfacts',
    host: 'world.openproductsfacts.org',
    labelKey: 'source.products',
    emoji: '📦',
    family: 'openfacts',
    network: true,
    matches: isProductKind,
    request: requestOpenFacts,
    productUrl: (code) => `https://world.openproductsfacts.org/product/${code}`,
  },
  {
    id: 'openpetfoodfacts',
    host: 'world.openpetfoodfacts.org',
    labelKey: 'source.petfood',
    emoji: '🐾',
    family: 'openfacts',
    network: true,
    matches: isProductKind,
    request: requestOpenFacts,
    productUrl: (code) => `https://world.openpetfoodfacts.org/product/${code}`,
  },
  {
    id: 'upcitemdb',
    host: 'api.upcitemdb.com',
    labelKey: 'source.upcitemdb',
    emoji: '🔑',
    family: 'retail',
    network: true,
    requiresKey: 'upcitemdb',
    matches: isLookupable,
    request: requestUpcItemdb,
    productUrl: (code) => `https://www.upcitemdb.com/upc/${code}`,
  },
  {
    id: 'eansearch',
    host: 'api.ean-search.org',
    labelKey: 'source.eansearch',
    emoji: '🔑',
    family: 'retail',
    network: true,
    requiresKey: 'eansearch',
    matches: isLookupable,
    request: requestEanSearch,
    productUrl: (code) => `https://www.ean-search.org/?q=${code}`,
  },
  {
    id: 'goupc',
    host: 'go-upc.com',
    labelKey: 'source.goupc',
    emoji: '🔑',
    family: 'retail',
    network: true,
    requiresKey: 'goupc',
    matches: isLookupable,
    request: requestGoupc,
    productUrl: (code) => `https://go-upc.com/search?q=${code}`,
  },
  {
    id: 'openfda',
    host: 'api.fda.gov',
    labelKey: 'source.openfda',
    emoji: '💊',
    family: 'medicine',
    network: true,
    matches: isProductKind,
    request: requestOpenFda,
    productUrl: () => 'https://open.fda.gov/apis/drug/ndc/',
  },
  {
    id: 'googlebooks',
    host: 'www.googleapis.com',
    labelKey: 'source.googlebooks',
    emoji: '📚',
    family: 'book',
    network: true,
    matches: isBookKind,
    request: requestGoogleBooks,
    productUrl: (code) => `https://books.google.com/books?vid=ISBN${code}`,
  },
  {
    id: 'openlibrary',
    host: 'openlibrary.org',
    labelKey: 'source.openlibrary',
    emoji: '📖',
    family: 'book',
    network: true,
    matches: isBookKind,
    request: requestOpenLibrary,
    productUrl: (code) => `https://openlibrary.org/isbn/${code}`,
  },
  {
    id: 'itunes',
    host: 'itunes.apple.com',
    labelKey: 'source.itunes',
    emoji: '🎬',
    family: 'media',
    network: true,
    matches: isLookupable,
    request: requestItunes,
    productUrl: () => 'https://music.apple.com/',
  },
  {
    id: 'musicbrainz',
    host: 'musicbrainz.org',
    labelKey: 'source.music',
    emoji: '🎵',
    family: 'media',
    network: true,
    minInterval: 1100, // MusicBrainz asks for ~1 request/second
    matches: isLookupable,
    request: requestMusicBrainz,
    productUrl: (code) => `https://musicbrainz.org/search?query=barcode%3A${code}&type=release`,
  },
]

/**
 * Second-stage lookups: they only make sense once a product was found and they
 * never change *which* product it is, so they run after the merge and failures
 * are invisible.
 */
const ENRICHERS = [
  {
    id: 'rxnav',
    host: 'rxnav.nlm.nih.gov',
    labelKey: 'source.rxnav',
    emoji: '🧪',
    network: true,
    minInterval: 200,
    matches: (product) => Boolean(product.ndc),
    run: enrichRxNav,
  },
  {
    id: 'openprices',
    host: 'prices.openfoodfacts.org',
    labelKey: 'source.openprices',
    emoji: '🏷️',
    network: true,
    minInterval: 200,
    matches: (product) => product.sources.some((id) => id.startsWith('open')),
    run: enrichPrices,
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
  'additives_tags',
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
  /**
   * @param {string} barcode
   * @param {string[]} [checked] ids of the sources that were actually queried
   */
  constructor(barcode, checked = []) {
    super(`No product found for barcode ${barcode}`)
    this.name = 'ProductNotFoundError'
    this.code = 'not_found'
    this.barcode = barcode
    this.checked = checked
  }
}

export class InvalidBarcodeError extends Error {
  constructor(barcode) {
    super(`Invalid barcode: ${barcode}`)
    this.name = 'InvalidBarcodeError'
    this.code = 'invalid'
  }
}

/** Every source metadata record we know about (queried sources + enrichers). */
const META_INDEX = new Map([...SOURCES, ...ENRICHERS].map((source) => [source.id, source]))

/**
 * Metadata for a source id (used by the UI to render badges).
 * @returns {ProductSource|{id:string,labelKey:string,emoji:string,network:boolean}|null}
 */
export function sourceMeta(id) {
  return META_INDEX.get(id) ?? OFFLINE_SOURCES[id] ?? null
}

/**
 * The sources that *would* be queried for this barcode: routing by code type
 * plus the optional key-gated catalogues. Shared by the lookup itself and by the
 * UI (progress chips, "N databases checked").
 *
 * @param {string|number} barcode
 * @returns {ProductSource[]}
 */
export function sourcesFor(barcode) {
  const info = analyzeBarcode(barcode)
  return SOURCES.filter(
    (source) => source.matches(info) && (!source.requiresKey || Boolean(getApiKey(source.requiresKey))),
  )
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
    throw new ProductNotFoundError(code, checkedIds(code))
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
      if (resolved === null) throw new ProductNotFoundError(code, checkedIds(code))
      return resolved
    })
    .finally(() => inFlight.delete(code))

  inFlight.set(code, promise)
  return promise
}

/** Ids of the sources a lookup for this code actually consulted. */
function checkedIds(code) {
  return sourcesFor(code).map((source) => source.id)
}

/** Wrap a knowledge-base record with the offline analysis. */
function recall(code) {
  const remembered = recallProduct(code)
  if (!remembered) return null
  return {
    ...remembered,
    fromKnowledgeBase: true,
    info: analyzeBarcode(code),
    checked: checkedIds(code),
  }
}

/** Fire every matching source in parallel and merge whatever comes back. */
async function lookupAll(code, { signal } = {}) {
  const active = sourcesFor(code)
  // Nothing to ask: a store-internal / coupon code is never in a public database.
  if (!active.length) return null

  const outcomes = await Promise.all(active.map((source) => requestSource(source, code, signal)))

  const found = outcomes.filter((outcome) => outcome.product)
  if (found.length) {
    const merged = mergeFamilies(found)
    merged.info = analyzeBarcode(code)
    merged.checked = active.map((source) => source.id)
    return runEnrichers(merged, code, signal)
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
      source.request(source, code, signal),
    )
    return { source, ok: true, product: product ?? null }
  } catch (error) {
    return { source, ok: false, product: null, error }
  }
}

/**
 * Run the secondary lookups and fold their findings into the product. A failure
 * here is always silent: the product is already perfectly usable.
 */
async function runEnrichers(product, code, signal) {
  const active = ENRICHERS.filter((enricher) => enricher.matches(product))
  if (!active.length) return product

  const patches = await Promise.all(
    active.map(async (enricher) => {
      try {
        const patch = await scheduleOn(enricher.host, enricher.minInterval ?? MIN_INTERVAL, () =>
          enricher.run(product, code, signal),
        )
        return patch ? { id: enricher.id, patch } : null
      } catch {
        return null
      }
    }),
  )

  const applied = patches.filter(Boolean)
  if (!applied.length) return product

  const next = { ...product, sources: [...product.sources] }
  for (const { id, patch } of applied) {
    Object.assign(next, patch)
    if (!next.sources.includes(id)) next.sources.push(id)
  }
  return next
}

/* ────────────────────────────── Open Facts family ───────────────────────────── */

async function requestOpenFacts(source, code, signal) {
  const url = `https://${source.host}/api/v2/product/${encodeURIComponent(code)}.json?fields=${FIELDS}`
  const response = await fetch(url, { signal, headers: { Accept: 'application/json' } })
  if (response.status === 404) return null
  if (!response.ok) throw new Error(`${source.host} responded with ${response.status}`)

  const payload = await response.json().catch(() => null)
  if (!payload || payload.status === 0 || !payload.product) return null

  const product = normalizeOpenFacts(payload.product, source)
  // Guard against the empty "ghost" records the open databases sometimes
  // accumulate — a hit is only useful if it actually says *something*.
  return isUseful(product) ? product : null
}

/* ──────────────────────────────── Media family ──────────────────────────────── */

async function requestItunes(source, code, signal) {
  const url = `https://${source.host}/lookup?upc=${encodeURIComponent(code)}&entity=album`
  const response = await fetch(url, { signal, headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error(`${source.host} responded with ${response.status}`)

  const payload = await response.json().catch(() => null)
  const results = payload?.results ?? []
  // Guard against a fuzzy match: when a result carries its own barcode, it must
  // equal the one we asked for.
  const exact = results.filter((result) => !result.barcode || String(result.barcode).trim() === code)
  const album = exact.find((result) => result.wrapperType === 'collection') ?? exact[0]
  return album ? normalizeItunes(album, code) : null
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

/* ─────────────────────────────── Medicine family ────────────────────────────── */

async function requestOpenFda(source, code, signal) {
  return tryCandidates(code, async (candidate) => {
    const search = encodeURIComponent(`openfda.upc:"${candidate}"`)
    const url = `https://${source.host}/drug/ndc.json?search=${search}&limit=3`
    const response = await fetch(url, { signal, headers: { Accept: 'application/json' } })
    if (response.status === 404) return null
    if (!response.ok) throw new Error(`${source.host} responded with ${response.status}`)
    const payload = await response.json().catch(() => null)
    const record = payload?.results?.[0]
    return record ? normalizeOpenFda(record, code) : null
  })
}

/** openFDA stores NDCs as "0573-0150-20"; RxNav only recognises the 11-digit form. */
function ndc11(packageNdc) {
  const segments = String(packageNdc ?? '')
    .split('-')
    .map((part) => part.trim())
    .filter(Boolean)
  if (segments.length !== 3) return digitsOnly(packageNdc)

  let [labeler, productCode, pack] = segments
  // Any of the three 10-digit layouts (4-4-2, 5-3-2, 5-4-1) expands to 5-4-2.
  if (labeler.length === 4) labeler = labeler.padStart(5, '0')
  else if (productCode.length === 3) productCode = productCode.padStart(4, '0')
  else if (pack.length === 1) pack = pack.padStart(2, '0')

  const digits = `${labeler}${productCode}${pack}`
  return /^\d{11}$/.test(digits) ? digits : digitsOnly(packageNdc)
}

async function enrichRxNav(product) {
  const ndc = ndc11(product.ndc)
  if (!ndc) return null
  const response = await fetch(`https://rxnav.nlm.nih.gov/REST/ndcstatus.json?ndc=${encodeURIComponent(ndc)}`, {
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) return null
  const payload = await response.json().catch(() => null)
  const status = payload?.ndcStatus
  if (!status) return null

  const name = cleanText(status.status)
  const rxcui = cleanText(status.rxcui)
  const concept = cleanText(status.conceptName)
  // An 11-digit NDC that isn't in RxNorm comes back as an empty "UNKNOWN"
  // record — that is "no extra data", not a fact worth showing.
  if (!rxcui && !concept && (!name || name.toUpperCase() === 'UNKNOWN')) return null

  return {
    drugStatus: name,
    activeIngredients: product.activeIngredients || concept,
    externalId: rxcui || product.externalId,
  }
}

/* ──────────────────────────────── Book family ───────────────────────────────── */

async function requestOpenLibrary(source, code, signal) {
  const url = `https://${source.host}/api/books?bibkeys=ISBN:${encodeURIComponent(code)}&format=json&jscmd=data`
  const response = await fetch(url, { signal, headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error(`${source.host} responded with ${response.status}`)
  const payload = await response.json().catch(() => null)
  const book = payload?.[`ISBN:${code}`]
  return book ? normalizeOpenLibrary(book, code) : null
}

async function requestGoogleBooks(source, code, signal) {
  const url = `https://${source.host}/books/v1/volumes?q=isbn:${encodeURIComponent(code)}&maxResults=3`
  const response = await fetch(url, { signal, headers: { Accept: 'application/json' } })
  // Google Books answers 429 once the anonymous daily quota is spent. That is a
  // "no data" for us, never a hard failure.
  if (!response.ok) return null
  const payload = await response.json().catch(() => null)
  const volume = payload?.items?.[0]?.volumeInfo
  return volume ? normalizeGoogleBooks(volume, code) : null
}

/* ─────────────────────────────── Retail catalogues ──────────────────────────── */

async function requestUpcItemdb(source, code, signal) {
  const key = getApiKey('upcitemdb')
  if (!key) return null
  return tryCandidates(code, async (candidate) => {
    const url = `https://${source.host}/prod/v1/lookup?upc=${encodeURIComponent(candidate)}`
    const response = await fetch(url, {
      signal,
      headers: { Accept: 'application/json', user_key: key },
    })
    if (response.status === 401 || response.status === 403) throw new Error('UPCitemdb rejected the API key')
    if (response.status === 404) return null
    if (!response.ok) throw new Error(`${source.host} responded with ${response.status}`)
    const payload = await response.json().catch(() => null)
    const item = payload?.items?.[0]
    return item ? normalizeUpcItemdb(item, code) : null
  })
}

async function requestEanSearch(source, code, signal) {
  const key = getApiKey('eansearch')
  if (!key) return null
  return tryCandidates(code, async (candidate) => {
    const token = encodeURIComponent(key)
    const url = `https://${source.host}/api?token=${token}&op=barcode-lookup&ean=${encodeURIComponent(candidate)}`
    const response = await fetch(url, { signal, headers: { Accept: 'application/json' } })
    if (response.status === 401 || response.status === 403) throw new Error('EAN-Search rejected the API key')
    if (!response.ok) throw new Error(`${source.host} responded with ${response.status}`)
    const payload = await response.json().catch(() => null)
    const list = Array.isArray(payload) ? payload : [payload]
    const item = list.find((entry) => entry && !entry.error && (entry.name || entry.productname))
    return item ? normalizeEanSearch(item, code) : null
  })
}

async function requestGoupc(source, code, signal) {
  const key = getApiKey('goupc')
  if (!key) return null
  return tryCandidates(code, async (candidate) => {
    const url = `https://${source.host}/api/v1/code/${encodeURIComponent(candidate)}`
    const response = await fetch(url, {
      signal,
      headers: { Accept: 'application/json', Authorization: `Bearer ${key}` },
    })
    if (response.status === 401 || response.status === 403) throw new Error('Go-UPC rejected the API key')
    if (response.status === 404) return null
    if (!response.ok) throw new Error(`${source.host} responded with ${response.status}`)
    const payload = await response.json().catch(() => null)
    const product = payload?.product
    return product ? normalizeGoupc(product, code) : null
  })
}

/**
 * Try the barcode and, when the databases use the other GTIN spelling, its
 * equivalent too (EAN-13 ↔ UPC-A). At most two requests per source.
 */
async function tryCandidates(code, attempt) {
  for (const candidate of gtinVariants(code)) {
    const result = await attempt(candidate)
    if (result) return result
  }
  return null
}

/* ─────────────────────────────── Normalisation ──────────────────────────────── */

/**
 * The flat record every normaliser starts from, so all sources produce the same
 * shape and the UI never has to guard for missing keys.
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
 * @property {string[]} additives      E-number / additive tags (E322, E330…)
 * @property {string}   ingredients
 * @property {string}   nutriScore   'a'..'e' or ''
 * @property {number|null} nova      1..4 or null
 * @property {string[]} countries
 * @property {string}   packaging
 * @property {string}   stores
 * @property {string}   format       media format / edition
 * @property {string}   label        record label
 * @property {string}   releaseDate
 * @property {string}   genre        media genre / book subject
 * @property {number|null} trackCount
 * @property {string}   publisher    book publisher
 * @property {number|null} pages
 * @property {string}   dosageForm   medicine
 * @property {string}   activeIngredients
 * @property {string}   ndc          medicine national drug code
 * @property {string}   drugStatus   medicine marketing status (RxNav)
 * @property {{amount:number,currency:string,store:string,date:string}} [price]
 * @property {Record<string, number|null>} nutriments per 100 g
 * @property {string}   productKind  'product'|'medicine'|'book'|'media'
 * @property {string}   externalUrl  deep link to the winning source
 * @property {string}   externalId
 * @property {string}   source       winning database id
 * @property {string[]} sources      every database that had a hit
 * @property {import('./barcodeInfo.js').BarcodeInfo} [info]  offline analysis
 * @property {string[]} [checked]    every database that was queried
 * @property {boolean}  [fromKnowledgeBase]
 */
function emptyProduct(code, sourceId) {
  return {
    barcode: String(code ?? ''),
    name: '',
    genericName: '',
    brand: '',
    quantity: '',
    image: '',
    imageSmall: '',
    categories: [],
    labels: [],
    allergens: [],
    additives: [],
    ingredients: '',
    nutriScore: '',
    nova: null,
    countries: [],
    packaging: '',
    stores: '',
    format: '',
    label: '',
    releaseDate: '',
    genre: '',
    trackCount: null,
    publisher: '',
    pages: null,
    dosageForm: '',
    activeIngredients: '',
    ndc: '',
    drugStatus: '',
    nutriments: readNutriments(null),
    productKind: 'product',
    externalUrl: '',
    externalId: '',
    source: sourceId,
    sources: [sourceId],
  }
}

/** Shape a raw Open Facts payload into the flat record. */
function normalizeOpenFacts(product, source) {
  return {
    ...emptyProduct(String(product.code ?? ''), source.id),
    name: firstNonEmpty(pickLocalized(product, 'product_name'), product.generic_name) || 'Unknown product',
    genericName: cleanText(product.generic_name),
    brand: cleanBrand(product.brands),
    quantity: cleanText(product.quantity),
    image: product.image_front_url || product.image_front_small_url || product.image_url || '',
    imageSmall: product.image_front_small_url || '',
    categories: parseTags(product.categories_tags, product.categories, 6),
    labels: parseTags(product.labels_tags, null, 6),
    allergens: parseTags(product.allergens_tags, null, 6),
    additives: parseTags(product.additives_tags, null, 10),
    ingredients: cleanText(pickLocalized(product, 'ingredients_text')),
    nutriScore: validGrade(product.nutriscore_grade_2023 || product.nutriscore_grade),
    nova: validNova(product.nova_group),
    countries: parseTags(product.countries_tags, null, 3),
    packaging: cleanText(product.packaging),
    stores: cleanText(product.stores),
    nutriments: readNutriments(product.nutriments),
  }
}

/** Shape an iTunes album into the same flat record. */
function normalizeItunes(album, code) {
  const name = cleanText(album.collectionName || album.trackName)
  if (!name) return null
  const artwork = String(album.artworkUrl100 ?? '')
  return {
    ...emptyProduct(code, 'itunes'),
    name,
    brand: cleanText(album.artistName),
    // iTunes serves a 100 px thumbnail; the 600 px variant is the same asset.
    image: artwork ? artwork.replace(/\/\d+x\d+bb\./, '/600x600bb.') : '',
    imageSmall: artwork,
    categories: [cleanText(album.primaryGenreName)].filter(Boolean),
    countries: String(album.country ?? '').trim() ? [cleanText(album.country)] : [],
    format: cleanText(album.collectionType),
    releaseDate: isoDate(album.releaseDate),
    genre: cleanText(album.primaryGenreName),
    trackCount: Number.isFinite(album.trackCount) ? album.trackCount : null,
    productKind: 'media',
    externalUrl: cleanText(album.collectionViewUrl),
    externalId: album.collectionId ? String(album.collectionId) : '',
  }
}

/** Shape a MusicBrainz release into the same flat record. */
function normalizeRelease(release, code) {
  const artists = (release['artist-credit'] ?? [])
    .map((credit) => credit?.name)
    .filter(Boolean)
    .join(', ')
  const labels = (release['label-info'] ?? []).map((info) => info?.label?.name).filter(Boolean)
  const formats = (release.media ?? []).map((medium) => medium?.format).filter(Boolean)
  const mbid = release.id

  return {
    ...emptyProduct(String(release.barcode ?? code), 'musicbrainz'),
    name: cleanText(release.title) || 'Unknown product',
    brand: artists,
    quantity: formats[0] ?? '',
    image: mbid ? `https://coverartarchive.org/release/${mbid}/front-250` : '',
    categories: [...new Set(formats)].slice(0, 4),
    countries: release.country ? [String(release.country).toUpperCase()] : [],
    format: [...new Set(formats)].join(', '),
    label: [...new Set(labels)].slice(0, 2).join(', '),
    releaseDate: cleanText(release.date),
    genre: [...new Set(formats)].slice(0, 4).join(', '),
    productKind: 'media',
    externalUrl: mbid ? `https://musicbrainz.org/release/${mbid}` : '',
    externalId: mbid ?? '',
  }
}

/** Shape an openFDA NDC record into the same flat record. */
function normalizeOpenFda(record, code) {
  const name = cleanText(record.brand_name || record.generic_name)
  if (!name) return null
  const ingredients = (record.active_ingredients ?? [])
    .map((item) => cleanText(`${item?.name ?? ''}${item?.strength ? ` ${item.strength}` : ''}`))
    .filter(Boolean)
  const packaging = (record.packaging ?? []).map((entry) => cleanText(entry?.description)).filter(Boolean)
  const ndc = cleanText(record.packaging?.[0]?.package_ndc || record.openfda?.package_ndc?.[0] || '')

  return {
    ...emptyProduct(code, 'openfda'),
    name,
    genericName: cleanText(record.generic_name),
    brand: cleanText(record.labeler_name),
    quantity: packaging[0] ?? '',
    categories: [cleanText(record.product_type), cleanText(record.dosage_form)].filter(Boolean),
    ingredients: ingredients.join(', '),
    packaging: packaging.join(' · '),
    dosageForm: cleanText(record.dosage_form),
    activeIngredients: ingredients.join(', '),
    ndc,
    productKind: 'medicine',
    externalUrl: 'https://open.fda.gov/apis/drug/ndc/',
    externalId: ndc,
  }
}

/** Shape an Open Library edition into the same flat record. */
function normalizeOpenLibrary(book, code) {
  const name = cleanText(book.title)
  if (!name) return null
  const authors = (book.authors ?? []).map((author) => cleanText(author?.name)).filter(Boolean)
  const subjects = (book.subjects ?? [])
    .map((subject) => cleanText(subject?.name))
    .filter(Boolean)
    .slice(0, 6)

  return {
    ...emptyProduct(code, 'openlibrary'),
    name,
    genericName: cleanText(book.subtitle),
    brand: authors.slice(0, 3).join(', '),
    image: book.cover?.large || book.cover?.medium || book.cover?.small || '',
    imageSmall: book.cover?.small || '',
    categories: subjects,
    releaseDate: cleanText(book.publish_date),
    genre: subjects[0] ?? '',
    publisher: cleanText(book.publishers?.[0]?.name),
    pages: Number.isFinite(book.number_of_pages) ? book.number_of_pages : null,
    productKind: 'book',
    externalUrl: cleanText(book.url) || `https://openlibrary.org/isbn/${code}`,
  }
}

/** Shape a Google Books volume into the same flat record. */
function normalizeGoogleBooks(volume, code) {
  const name = cleanText(volume.title)
  if (!name) return null
  const authors = (volume.authors ?? []).map((author) => cleanText(author)).filter(Boolean)
  const cover = String(volume.imageLinks?.thumbnail ?? '')

  return {
    ...emptyProduct(code, 'googlebooks'),
    name,
    genericName: cleanText(volume.subtitle),
    brand: authors.slice(0, 3).join(', '),
    image: cover.replace(/^http:/, 'https:'),
    imageSmall: cover.replace(/^http:/, 'https:'),
    categories: (volume.categories ?? []).map((category) => cleanText(category)).filter(Boolean).slice(0, 6),
    ingredients: cleanText(volume.description),
    releaseDate: cleanText(volume.publishedDate),
    genre: cleanText(volume.categories?.[0]),
    publisher: cleanText(volume.publisher),
    pages: Number.isFinite(volume.pageCount) ? volume.pageCount : null,
    productKind: 'book',
    externalUrl: cleanText(volume.infoLink) || `https://books.google.com/books?vid=ISBN${code}`,
  }
}

/** Shape a UPCitemdb item into the same flat record. */
function normalizeUpcItemdb(item, code) {
  const name = cleanText(item.title)
  if (!name) return null
  return {
    ...emptyProduct(code, 'upcitemdb'),
    name,
    brand: cleanText(item.brand),
    quantity: cleanText(item.size),
    image: Array.isArray(item.images) ? String(item.images[0] ?? '') : '',
    categories: splitCategories(item.category),
    ingredients: cleanText(item.description),
    productKind: 'product',
    externalUrl: `https://www.upcitemdb.com/upc/${code}`,
  }
}

/** Shape an EAN-Search result into the same flat record. */
function normalizeEanSearch(item, code) {
  const name = cleanText(item.name || item.productname)
  if (!name) return null
  return {
    ...emptyProduct(code, 'eansearch'),
    name,
    brand: cleanText(item.brand || item.issuer),
    quantity: cleanText(item.size || item.specification),
    image: cleanText(item.image || item.imageUrl),
    categories: splitCategories(item.categoryName || item.category),
    ingredients: cleanText(item.description),
    productKind: 'product',
    externalUrl: `https://www.ean-search.org/?q=${code}`,
  }
}

/** Shape a Go-UPC product into the same flat record. */
function normalizeGoupc(product, code) {
  const name = cleanText(product.name)
  if (!name) return null
  return {
    ...emptyProduct(code, 'goupc'),
    name,
    brand: cleanText(product.brand),
    quantity: cleanText(product.quantity),
    image: cleanText(product.imageUrl),
    categories: splitCategories(product.category),
    ingredients: cleanText(product.description),
    productKind: 'product',
    externalUrl: cleanText(product.url) || `https://go-upc.com/search?q=${code}`,
  }
}

/* ──────────────────────────────── Merging ───────────────────────────────────── */

/**
 * Blend the hits *of one family* into a single record: the most complete product
 * becomes the base, the rest fill the gaps, and list fields are unioned.
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
    additives: [...base.additives],
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
    if (!merged.genre) merged.genre = product.genre
    if (merged.trackCount == null) merged.trackCount = product.trackCount
    if (!merged.publisher) merged.publisher = product.publisher
    if (merged.pages == null) merged.pages = product.pages
    if (!merged.dosageForm) merged.dosageForm = product.dosageForm
    if (!merged.activeIngredients) merged.activeIngredients = product.activeIngredients
    if (!merged.ndc) merged.ndc = product.ndc
    if (!merged.externalUrl) merged.externalUrl = product.externalUrl

    unionInto(merged.categories, product.categories, 6)
    unionInto(merged.labels, product.labels, 6)
    unionInto(merged.allergens, product.allergens, 6)
    unionInto(merged.additives, product.additives, 12)
    unionInto(merged.countries, product.countries, 3)

    for (const key of NUTRIENT_KEYS) {
      if (merged.nutriments[key] == null) merged.nutriments[key] = product.nutriments[key]
    }
  }

  merged.enrichedAt = Date.now()
  return merged
}

/**
 * Merge only the hits of the most trustworthy non-empty family, so a product and
 * a stray song/drug entry sharing a barcode never end up in one card.
 */
function mergeFamilies(found) {
  for (const family of FAMILY_ORDER) {
    const hits = found.filter((outcome) => outcome.source.family === family)
    if (hits.length) {
      const merged = mergeProducts(hits)
      merged.productKind = FAMILY_KIND[family] ?? merged.productKind
      return merged
    }
  }
  return mergeProducts(found)
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
  if (product.activeIngredients) score += 1
  if (product.dosageForm) score += 0.5
  if (product.publisher) score += 0.5
  if (product.pages) score += 0.5
  if (product.trackCount) score += 0.5
  score += Math.min(product.categories.length, 3) * 0.5
  score += Math.min(product.labels.length + product.allergens.length, 4) * 0.25
  if (product.additives?.length) score += 0.5
  for (const key of NUTRIENT_KEYS) if (product.nutriments[key] != null) score += 0.5
  return score
}

/* ──────────────────────────── Price enrichment ──────────────────────────────── */

/** Latest crowd-sourced shelf price (Open Prices, an Open Food Facts project). */
async function enrichPrices(product, code) {
  const url = `https://prices.openfoodfacts.org/api/v1/prices?product_code=${encodeURIComponent(code)}&order_by=-date&size=1`
  const response = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!response.ok) return null
  const payload = await response.json().catch(() => null)
  const item = payload?.items?.[0]
  const amount = Number(item?.price)
  if (!Number.isFinite(amount)) return null
  return {
    price: {
      amount,
      currency: cleanText(item.currency) || 'EUR',
      store: cleanText(item.location?.osm_name || item.location?.osm_brand),
      date: cleanText(item.date),
    },
  }
}

/* ──────────────────────────── Optional key check ────────────────────────────── */

/**
 * Confirm a key is accepted by its provider, so the settings panel can say so
 * instead of the user silently getting no extra results.
 *
 * @param {string} providerId
 * @param {string} key
 * @returns {Promise<{ok: boolean, reason?: 'missing'|'invalid'|'http'|'network', status?: number}>}
 */
export async function verifyApiKey(providerId, key) {
  const provider = KEY_PROVIDERS.find((entry) => entry.id === providerId)
  if (!provider || !key) return { ok: false, reason: 'missing' }
  try {
    const { url, init } = provider.test(key)
    const response = await fetch(url, { ...init, headers: { ...init?.headers, Accept: 'application/json' } })
    if (response.status === 401 || response.status === 403) return { ok: false, reason: 'invalid' }
    if (!response.ok) return { ok: false, reason: 'http', status: response.status }
    return { ok: true }
  } catch {
    return { ok: false, reason: 'network' }
  }
}

/* ──────────────────────────────── Helpers ───────────────────────────────────── */

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

/** "Electronics > Audio > Headphones" → ['Electronics', 'Audio', 'Headphones']. */
function splitCategories(value) {
  const text = cleanText(value)
  if (!text) return []
  return text
    .split('>')
    .map((part) => cleanText(part))
    .filter(Boolean)
    .slice(0, 4)
}

/** '2021-09-24T07:00:00Z' → '2021-09-24'. */
function isoDate(value) {
  const text = String(value ?? '').trim()
  return /^\d{4}-\d{2}-\d{2}/.test(text) ? text.slice(0, 10) : ''
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
  const fromTags = Array.isArray(tags) ? tags.map((tag) => prettifyTag(String(tag))).filter(Boolean) : []
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
