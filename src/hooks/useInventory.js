import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createSeedItems } from '../data/seedData.js'
import { compareByExpiry, daysUntil, getStatus, STATUS } from '../utils/dateUtils.js'
import { cleanText, uid } from '../utils/format.js'
import { fetchProduct, ProductNotFoundError, InvalidBarcodeError } from '../services/productLookup.js'

const STORAGE_KEY = 'aet:inventory:v1'
const CONSUMED_RETENTION_MS = 1000 * 60 * 60 * 24 * 30 // keep consumed rows for 30 days

/** Normalise a raw item coming from storage, so old/corrupt data can't crash the UI. */
function sanitize(raw) {
  if (!raw || typeof raw !== 'object') return null
  const category = ['fridge', 'pantry', 'medicine'].includes(raw.category) ? raw.category : 'fridge'
  return {
    id: raw.id || uid('item'),
    name: cleanText(raw.name) || 'Unnamed item',
    category,
    location: cleanText(raw.location),
    expiryDate: typeof raw.expiryDate === 'string' ? raw.expiryDate : '',
    quantity: Number.isFinite(Number(raw.quantity)) && Number(raw.quantity) > 0 ? Number(raw.quantity) : 1,
    unit: raw.unit || 'pcs',
    barcode: typeof raw.barcode === 'string' ? raw.barcode : '',
    product: raw.product && typeof raw.product === 'object' ? raw.product : null,
    consumed: Boolean(raw.consumed),
    addedAt: Number.isFinite(raw.addedAt) ? raw.addedAt : Date.now(),
  }
}

function loadInitial() {
  if (typeof window === 'undefined') return createSeedItems()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw === null) return createSeedItems()
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return createSeedItems()
    const items = parsed.map(sanitize).filter(Boolean)
    return items
  } catch {
    return createSeedItems()
  }
}

/**
 * The single source of truth for inventory state.
 *
 * Responsibilities:
 *  - CRUD (add / update / delete / toggle-consumed)
 *  - persist to localStorage
 *  - derive stats & grouped views with useMemo (status is never stored!)
 *  - lazily enrich barcode items with open-database data on first load
 */
export function useInventory() {
  const [items, setItems] = useState(loadInitial)

  // ── persistence ───────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      /* storage unavailable — keep working in memory */
    }
  }, [items])

  // ── one-off cleanup of very old consumed rows ─────────────────────────────
  useEffect(() => {
    const cutoff = Date.now() - CONSUMED_RETENTION_MS
    setItems((prev) => {
      const next = prev.filter((item) => !item.consumed || item.addedAt >= cutoff)
      return next.length === prev.length ? prev : next
    })
  }, [])

  // ── lazy multi-source enrichment ──────────────────────────────────────────
  // Runs once on mount; only for seed items that already carry a barcode but
  // have no cached product payload. Uses a ref snapshot so it never re-fires.
  const attempted = useRef(new Set())
  const itemsSnapshot = useRef(items)
  itemsSnapshot.current = items

  useEffect(() => {
    let cancelled = false
    const pending = itemsSnapshot.current.filter(
      (item) => item.barcode && !item.product && !attempted.current.has(item.barcode),
    )

    ;(async () => {
      for (const item of pending.slice(0, 10)) {
        if (cancelled) return
        attempted.current.add(item.barcode)
        try {
          const product = await fetchProduct(item.barcode)
          if (cancelled || !product) continue
          setItems((prev) =>
            prev.map((row) => (row.id === item.id ? { ...row, product } : row)),
          )
        } catch {
          /* offline or not found — the item simply keeps its icon placeholder */
        }
      }
    })()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const addItem = useCallback((draft) => {
    const item = sanitize({
      ...draft,
      id: uid('item'),
      addedAt: Date.now(),
      consumed: false,
    })
    setItems((prev) => [item, ...prev])
    return item
  }, [])

  const updateItem = useCallback((id, patch) => {
    let updated = null
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        updated = sanitize({ ...item, ...patch, id: item.id, addedAt: item.addedAt })
        return updated
      }),
    )
    return updated
  }, [])

  const deleteItem = useCallback((id) => {
    let removed = null
    setItems((prev) => {
      removed = prev.find((item) => item.id === id) ?? null
      return prev.filter((item) => item.id !== id)
    })
    return removed
  }, [])

  const toggleConsumed = useCallback((id) => {
    let item = null
    setItems((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row
        item = { ...row, consumed: !row.consumed }
        return item
      }),
    )
    return item
  }, [])

  /** Attach (or clear) a fetched Open Food Facts payload. */
  const setItemProduct = useCallback((id, product) => {
    setItems((prev) => prev.map((row) => (row.id === id ? { ...row, product } : row)))
  }, [])

  const clearAll = useCallback(() => setItems([]), [])
  const resetToSeed = useCallback(() => setItems(createSeedItems()), [])

  // ── derived data ──────────────────────────────────────────────────────────
  /** Items with a freshly computed `status` + `daysLeft`, consumed rows excluded. */
  const activeItems = useMemo(() => {
    return items
      .filter((item) => !item.consumed)
      .map((item) => ({
        ...item,
        status: getStatus(item.expiryDate),
        daysLeft: daysUntil(item.expiryDate),
      }))
  }, [items])

  const consumedItems = useMemo(() => items.filter((item) => item.consumed), [items])

  /** Dashboard cards + alert counts. */
  const stats = useMemo(() => {
    const base = { total: 0, fresh: 0, expiringSoon: 0, expired: 0, consumed: consumedItems.length }
    for (const item of activeItems) {
      base.total += 1
      if (item.status === STATUS.EXPIRED) base.expired += 1
      else if (item.status === STATUS.EXPIRING_SOON) base.expiringSoon += 1
      else base.fresh += 1
    }
    return base
  }, [activeItems, consumedItems.length])

  /** Soonest-expiring first — drives the "needs attention" list. */
  const byUrgency = useMemo(() => [...activeItems].sort(compareByExpiry), [activeItems])

  /** Only the ones expiring within the threshold (incl. expired), soonest first. */
  const expiringSoon = useMemo(
    () => byUrgency.filter((item) => item.status !== STATUS.FRESH),
    [byUrgency],
  )

  /** Items that can be used in recipes (never medicine). */
  const usableForRecipes = useMemo(
    () => activeItems.filter((item) => item.category !== 'medicine'),
    [activeItems],
  )

  /** Per-category counters for the dashboard breakdown. */
  const byCategory = useMemo(() => {
    const map = { fridge: blank(), pantry: blank(), medicine: blank() }
    for (const item of activeItems) {
      const bucket = map[item.category] ?? blank()
      bucket.total += 1
      bucket[item.status] += 1
      map[item.category] = bucket
    }
    return map
  }, [activeItems])

  return {
    items,
    activeItems,
    consumedItems,
    stats,
    byCategory,
    byUrgency,
    expiringSoon,
    usableForRecipes,
    addItem,
    updateItem,
    deleteItem,
    toggleConsumed,
    setItemProduct,
    clearAll,
    resetToSeed,
    /**
     * Look up a barcode (across every open database) and return the merged
     * product without mutating inventory. The form uses this before the item
     * even exists.
     */
    lookupProduct: fetchProduct,
    isProductNotFound: (error) => error instanceof ProductNotFoundError,
    isBarcodeInvalid: (error) => error instanceof InvalidBarcodeError,
  }
}

function blank() {
  return { total: 0, fresh: 0, expiringSoon: 0, expired: 0 }
}
