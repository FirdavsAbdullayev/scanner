/**
 * Optional API keys for the "advanced" retail databases.
 *
 * The keyless sources (Open Facts, iTunes, openFDA, Open Library…) already work
 * out of the box, but the big *retail* catalogues — the ones that know the most
 * barcodes overall — all require a (free-tier) API key. This module stores those
 * keys locally so they never leave the user's browser: the key is put straight
 * into the request header/query by `productLookup.js`, nothing is proxied.
 *
 * The app is fully functional with zero keys — the extra sources are simply
 * skipped, which is why every accessor here fails soft.
 *
 * Keys are kept in `localStorage` under `aet:apikeys:v1`.
 */

const STORAGE_KEY = 'aet:apikeys:v1'

/**
 * Providers the user can plug in. `test()` returns the request used to verify a
 * key — it points at a barcode that is *known to exist* (Nutella, 3.01762E+12),
 * so a 200 answer means "the key was accepted".
 *
 * @typedef {Object} KeyProvider
 * @property {string} id       matches the `requiresKey` field on a source
 * @property {string} labelKey i18n key for the provider name
 * @property {string} url      where the user registers for a key
 * @property {(key: string) => { url: string, init: RequestInit }} test
 */
export const KEY_PROVIDERS = [
  {
    id: 'upcitemdb',
    labelKey: 'source.upcitemdb',
    url: 'https://www.upcitemdb.com/api/plans',
    test: (key) => ({
      url: 'https://api.upcitemdb.com/prod/v1/lookup?upc=3017620422003',
      init: { headers: { Accept: 'application/json', user_key: key } },
    }),
  },
  {
    id: 'eansearch',
    labelKey: 'source.eansearch',
    url: 'https://www.ean-search.org/',
    test: (key) => ({
      url: `https://api.ean-search.org/api?token=${encodeURIComponent(key)}&op=barcode-lookup&ean=3017620422003`,
      init: { headers: { Accept: 'application/json' } },
    }),
  },
  {
    id: 'goupc',
    labelKey: 'source.goupc',
    url: 'https://go-upc.com/api',
    test: (key) => ({
      url: 'https://go-upc.com/api/v1/code/3017620422003',
      init: { headers: { Accept: 'application/json', Authorization: `Bearer ${key}` } },
    }),
  },
]

function write(keys) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keys))
  } catch {
    // Private mode / storage disabled — lookups still run, just without keys.
  }
}

/** Every stored key, filtered to the providers we actually know about. */
export function readApiKeys() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}
    const out = {}
    for (const provider of KEY_PROVIDERS) {
      const value = parsed[provider.id]
      if (typeof value === 'string' && value.trim()) out[provider.id] = value.trim()
    }
    return out
  } catch {
    return {}
  }
}

/** The key for one provider, or `''` when unset. */
export function getApiKey(id) {
  const value = readApiKeys()[id]
  return typeof value === 'string' ? value : ''
}

/** Save (or, with an empty value, remove) one provider's key. */
export function setApiKey(id, value) {
  const keys = readApiKeys()
  const trimmed = String(value ?? '').trim()
  if (trimmed) keys[id] = trimmed
  else delete keys[id]
  write(keys)
  return keys
}

/** Forget every key. */
export function clearApiKeys() {
  write({})
  return {}
}

/** How many optional sources are currently enabled. */
export function activeKeyCount() {
  return Object.keys(readApiKeys()).length
}
