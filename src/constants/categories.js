import { Apple, Milk, Pill, Refrigerator, Wheat } from 'lucide-react'

/**
 * The three storage areas of the app.
 * `icon` is a rendered lucide component, `accent` a Tailwind class soup used by
 * tabs, chips and the dashboard breakdown.
 */
export const CATEGORIES = [
  {
    id: 'fridge',
    labelKey: 'category.fridge',
    hintKey: 'category.fridge.hint',
    icon: Refrigerator,
    accent: {
      text: 'text-teal-700',
      bg: 'bg-teal-50',
      border: 'border-teal-200',
      solid: 'bg-teal-500',
      gradient: 'from-teal-500 to-emerald-500',
      ring: 'ring-teal-200',
      softText: 'text-teal-600',
    },
  },
  {
    id: 'pantry',
    labelKey: 'category.pantry',
    hintKey: 'category.pantry.hint',
    icon: Wheat,
    accent: {
      text: 'text-amber-700',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      solid: 'bg-amber-500',
      gradient: 'from-amber-500 to-orange-500',
      ring: 'ring-amber-200',
      softText: 'text-amber-600',
    },
  },
  {
    id: 'medicine',
    labelKey: 'category.medicine',
    hintKey: 'category.medicine.hint',
    icon: Pill,
    accent: {
      text: 'text-violet-700',
      bg: 'bg-violet-50',
      border: 'border-violet-200',
      solid: 'bg-violet-500',
      gradient: 'from-violet-500 to-fuchsia-500',
      ring: 'ring-violet-200',
      softText: 'text-violet-600',
    },
  },
]

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id)

export function getCategory(id) {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0]
}

export function getCategoryAccent(id) {
  return getCategory(id).accent
}

/** Icon used when a product has no photo (medicine items, manual entries…). */
export function getCategoryIcon(id) {
  if (id === 'medicine') return Pill
  if (id === 'pantry') return Wheat
  if (id === 'fridge') return Milk
  return Apple
}

/** Colour language for the three computed statuses. */
export const STATUS_STYLES = {
  fresh: {
    label: 'status.fresh',
    icon: null,
    text: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    solid: 'bg-emerald-500',
    gradient: 'from-emerald-500 to-teal-500',
    dot: 'bg-emerald-500',
    ring: 'ring-emerald-200',
  },
  expiringSoon: {
    label: 'status.expiringSoon',
    text: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    solid: 'bg-amber-500',
    gradient: 'from-amber-500 to-orange-400',
    dot: 'bg-amber-500',
    ring: 'ring-amber-200',
  },
  expired: {
    label: 'status.expired',
    text: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    solid: 'bg-rose-500',
    gradient: 'from-rose-500 to-red-500',
    dot: 'bg-rose-500',
    ring: 'ring-rose-200',
  },
  consumed: {
    label: 'status.consumed',
    text: 'text-slate-600',
    bg: 'bg-slate-100',
    border: 'border-slate-200',
    solid: 'bg-slate-400',
    gradient: 'from-slate-400 to-slate-500',
    dot: 'bg-slate-400',
    ring: 'ring-slate-200',
  },
}

export function getStatusStyle(status) {
  return STATUS_STYLES[status] ?? STATUS_STYLES.fresh
}

/** Units offered in the "add product" form. */
export const UNITS = [
  { id: 'pcs', labelKey: 'unit.pcs' },
  { id: 'l', labelKey: 'unit.l' },
  { id: 'ml', labelKey: 'unit.ml' },
  { id: 'kg', labelKey: 'unit.kg' },
  { id: 'g', labelKey: 'unit.g' },
  { id: 'pack', labelKey: 'unit.pack' },
  { id: 'box', labelKey: 'unit.box' },
  { id: 'bottle', labelKey: 'unit.bottle' },
  { id: 'blister', labelKey: 'unit.blister' },
  { id: 'tube', labelKey: 'unit.tube' },
  { id: 'can', labelKey: 'unit.can' },
]

export const DEFAULT_UNIT = 'pcs'

/** Sensible default unit per category, used when the user switches category. */
export const DEFAULT_UNIT_BY_CATEGORY = {
  fridge: 'l',
  pantry: 'pack',
  medicine: 'blister',
}

export function getUnitLabel(unitId) {
  return UNITS.find((u) => u.id === unitId)?.labelKey ?? 'unit.pcs'
}
