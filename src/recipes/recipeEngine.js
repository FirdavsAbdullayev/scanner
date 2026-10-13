/**
 * Smart Kitchen recipe engine.
 *
 * Pure, deterministic and offline-friendly: it scores the template library in
 * `recipeTemplates.js` against the ingredient signals extracted from the
 * user's items. No API key, no network, no surprises — but it *does* use real
 * Open Food Facts data whenever a product has been enriched from a barcode.
 *
 * Pipeline:
 *   1. pick the candidate pool  → expiring-soon items (fallback: fresh ones)
 *   2. extract ingredient tags  → recipeSignals.extractTags()
 *   3. score every template     → overlap with the pool's tags + coverage
 *   4. attach the items used    → so the UI can show "uses these items"
 *   5. fall back to generics    → when nothing matches well
 */

import { GENERIC_TEMPLATES, RECIPE_TEMPLATES } from './recipeTemplates.js'
import { extractTags } from './recipeSignals.js'

/** Weights tuned so "covers more of my items" beats "fits the template loosely". */
const WEIGHT_USED_ITEMS = 30
const WEIGHT_COVERAGE = 45

/**
 * @param {Array<object>} items           items from the inventory context
 * @param {string} _lang                  reserved for future language-aware tweaks
 * @param {{ limit?: number, offset?: number }} [options]
 *        `offset` rotates the ranking so repeated calls surface fresh ideas.
 */
export function generateRecipes(items = [], _lang = 'uz', options = {}) {
  const { limit = 3, offset = 0 } = options

  // Only edible, unconsumed items participate.
  const edible = items.filter((item) => !item.consumed && item.category !== 'medicine')

  const expiring = edible.filter((item) => item.status === 'expiringSoon')
  const fresh = edible.filter((item) => item.status === 'fresh')

  // Prefer expiring-soon; if there are none (or too few), top up with fresh ones.
  const pool = expiring.length >= 2 ? expiring : [...expiring, ...fresh.slice(0, 4)]
  const usedFallbackPool = expiring.length < 2

  // Decorate each candidate with its ingredient tags.
  const tagged = pool.map((item) => {
    const { tags, evidence } = extractTags(item)
    return { ...item, tags, evidence }
  })

  // Items that produced no signal at all can't drive a recipe match, but they
  // are still useful to list in the "analysed" strip.
  const signalItems = tagged.filter((item) => item.tags.size > 0)

  const scored = []

  for (const template of RECIPE_TEMPLATES) {
    const usedItems = signalItems.filter((item) =>
      [...item.tags].some((tag) => template.tags.includes(tag)),
    )
    if (usedItems.length === 0) continue

    const matchedTags = template.tags.filter((tag) => signalItems.some((item) => item.tags.has(tag)))
    const coverage = matchedTags.length / template.tags.length
    const score = usedItems.length * WEIGHT_USED_ITEMS + coverage * WEIGHT_COVERAGE

    scored.push({
      id: template.id,
      template,
      score,
      matchedTags,
      usedItems: sortByUrgency(usedItems),
      generic: false,
    })
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    // Tie-break: fewer unmatched tags wins.
    return b.matchedTags.length - a.matchedTags.length
  })

  const best = scored[0]?.score ?? 0

  // Rotate the ranking on request so "More recipes" genuinely changes the list
  // while still presenting the strongest matches first on the initial run.
  const start = scored.length > 0 ? offset % scored.length : 0
  const rotated = scored.length > 0 ? [...scored.slice(start), ...scored.slice(0, start)] : []

  const ranked = rotated.slice(0, limit).map((entry, index) => ({
    ...entry,
    rank: index,
    matchPercent: best > 0 ? Math.max(55, Math.round((entry.score / best) * 99)) : 60,
  }))

  if (ranked.length > 0) {
    return {
      recipes: ranked,
      pool: tagged,
      signalItems,
      generic: false,
      usedFallbackPool,
    }
  }

  // ── Nothing matched: use the generic "chef's surprise" fallbacks ──────────
  const fallbackItems = sortByUrgency(tagged).slice(0, 4)
  const generic = GENERIC_TEMPLATES.slice(0, Math.min(2, limit)).map((template, index) => ({
    id: template.id,
    template,
    score: 0,
    matchedTags: [],
    usedItems: fallbackItems,
    generic: true,
    rank: index,
    matchPercent: null,
  }))

  return {
    recipes: tagged.length > 0 ? generic : [],
    pool: tagged,
    signalItems,
    generic: true,
    usedFallbackPool,
  }
}

/** Soonest expiry first; items without a date go last. */
function sortByUrgency(items) {
  return [...items].sort((a, b) => {
    const aDays = Number.isFinite(a.daysLeft) ? a.daysLeft : Number.POSITIVE_INFINITY
    const bDays = Number.isFinite(b.daysLeft) ? b.daysLeft : Number.POSITIVE_INFINITY
    return aDays - bDays
  })
}

/**
 * Human readable list of the used item names, joined with a separator.
 * The caller localises the surrounding sentence.
 */
export function joinItemNames(items = [], separator = ', ') {
  return items.map((item) => item.name).join(separator)
}

/** How many distinct tags the pool produced — handy for a "confidence" hint. */
export function countTags(items = []) {
  const set = new Set()
  items.forEach((item) => item.tags?.forEach((tag) => set.add(tag)))
  return set.size
}
