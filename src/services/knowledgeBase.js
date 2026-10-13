/**
 * Local product knowledge base.
 *
 * Every successful lookup is written here, and so is every product the user
 * creates by hand. That makes the collection *cumulative*: the more barcodes
 * the project sees, the more barcodes it can answer instantly — even offline,
 * and even for products the public databases have never heard of.
 *
 * Stored in localStorage under a single key, capped so it can't grow forever.
 */

const STORAGE_KEY = 'aet:knowledge:v1'
const MAX_RECORDS = 400

/** localStorage can be unavailable (private mode, SSR) — fail soft. */
function safeStorage() {
  try {
    if (typeof localStorage === 'undefined') return null
    return localStorage
  } catch {
    return null
  }
}

function readAll() {
  const storage = safeStorage()
  if (!storage) return {}
  try {
    const parsed = JSON.parse(storage.getItem(STORAGE_KEY) ?? '{}')
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeAll(map) {
  const storage = safeStorage()
  if (!storage) return
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    /* quota exceeded — non-fatal, the live data was already shown */
  }
}

/** Drop the oldest records once the cap is exceeded. */
function prune(map) {
  const entries = Object.entries(map)
  if (entries.length <= MAX_RECORDS) return map
  const trimmed = entries
    .sort((a, b) => (a[1]?.savedAt ?? 0) - (b[1]?.savedAt ?? 0))
    .slice(entries.length - MAX_RECORDS)
  return Object.fromEntries(trimmed)
}

/**
 * Remember everything we learned about a barcode.
 *
 * @param {string|number} barcode
 * @param {object} product            normalized product payload
 * @param {'scan'|'manual'|'seed'} [origin]
 */
export function rememberProduct(barcode, product, origin = 'scan') {
  const code = String(barcode ?? '').replace(/\D/g, '')
  if (!code || !product || typeof product !== 'object') return
  const map = readAll()
  map[code] = { product, savedAt: Date.now(), origin }
  writeAll(prune(map))
}

/**
 * Build and store a minimal record from a hand-created item, so the *next*
 * time that barcode is scanned the app already knows something about it.
 *
 * @param {string|number} barcode
 * @param {{ name?: string, brand?: string, category?: string, location?: string }} draft
 */
export function rememberManualProduct(barcode, draft = {}) {
  const code = String(barcode ?? '').replace(/\D/g, '')
  const name = String(draft.name ?? '').trim()
  if (!code || !name) return
  rememberProduct(
    code,
    {
      barcode: code,
      name,
      genericName: '',
      brand: String(draft.brand ?? '').trim(),
      quantity: '',
      image: '',
      imageSmall: '',
      categories: draft.category ? [String(draft.category)] : [],
      labels: [],
      allergens: [],
      ingredients: '',
      nutriScore: '',
      nova: null,
      countries: [],
      packaging: '',
      stores: '',
      nutriments: {},
      source: 'manual',
      sources: ['manual'],
      fromKnowledgeBase: true,
    },
    'manual',
  )
}

/** Return the stored record's product, or `null`. */
export function recallProduct(barcode) {
  const code = String(barcode ?? '').replace(/\D/g, '')
  if (!code) return null
  const record = readAll()[code]
  return record?.product ? { ...record.product, collectedAt: record.savedAt } : null
}

/** How many barcodes the project has collected so far. */
export function knowledgeBaseSize() {
  return Object.keys(readAll()).length
}

/** Wipe the local knowledge base. */
export function clearKnowledgeBase() {
  const storage = safeStorage()
  if (!storage) return
  try {
    storage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}
