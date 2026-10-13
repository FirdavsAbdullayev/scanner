import { useState } from 'react'
import {
  BadgeCheck,
  BookOpen,
  CalendarDays,
  ChevronDown,
  Database,
  Disc3,
  ExternalLink,
  Flame,
  FlaskConical,
  Hash,
  Layers,
  Pill,
  Sparkles,
  Stethoscope,
  Tag,
  TriangleAlert,
} from 'lucide-react'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { ProductThumb } from '../ui/ProductThumb.jsx'
import { Chip } from '../ui/Badge.jsx'
import { SOURCES, sourceMeta } from '../../services/productLookup.js'
import { flagEmoji, regionName } from '../../services/barcodeInfo.js'

const NUTRI_TONES = {
  a: 'bg-emerald-500 text-white',
  b: 'bg-lime-500 text-white',
  c: 'bg-amber-500 text-white',
  d: 'bg-orange-500 text-white',
  e: 'bg-rose-500 text-white',
}

/** NOVA 1 (unprocessed) → 4 (ultra-processed). */
const NOVA_TONES = {
  1: 'bg-emerald-100 text-emerald-700',
  2: 'bg-lime-100 text-lime-700',
  3: 'bg-amber-100 text-amber-700',
  4: 'bg-rose-100 text-rose-700',
}

/** What kind of thing the barcode turned out to be → badge for the card. */
const KIND_BADGES = {
  medicine: { icon: Pill, labelKey: 'productKind.medicine', tone: 'bg-rose-50 text-rose-700 ring-rose-100' },
  book: { icon: BookOpen, labelKey: 'productKind.book', tone: 'bg-indigo-50 text-indigo-700 ring-indigo-100' },
  media: { icon: Disc3, labelKey: 'productKind.media', tone: 'bg-violet-50 text-violet-700 ring-violet-100' },
}

const NUTRIENT_ROWS = [
  { key: 'energyKcal', labelKey: 'product.energy', unit: 'kcal' },
  { key: 'fat', labelKey: 'product.fat', unit: 'g' },
  { key: 'saturatedFat', labelKey: 'product.saturated', unit: 'g' },
  { key: 'carbohydrates', labelKey: 'product.carbs', unit: 'g' },
  { key: 'sugars', labelKey: 'product.sugars', unit: 'g' },
  { key: 'fiber', labelKey: 'product.fiber', unit: 'g' },
  { key: 'proteins', labelKey: 'product.protein', unit: 'g' },
  { key: 'salt', labelKey: 'product.salt', unit: 'g' },
]

/** Symbology → i18n key. */
const TYPE_KEYS = {
  ean8: 'barcode.typeEan8',
  upca: 'barcode.typeUpca',
  ean13: 'barcode.typeEan13',
  gtin14: 'barcode.typeGtin14',
  isbn: 'barcode.typeIsbn',
  issn: 'barcode.typeIssn',
  unknown: 'barcode.typeUnknown',
}

/** What the code identifies → i18n key. */
const KIND_KEYS = {
  product: 'barcode.kindProduct',
  book: 'barcode.kindBook',
  periodical: 'barcode.kindPeriodical',
  internal: 'barcode.kindInternal',
  coupon: 'barcode.kindCoupon',
}

/**
 * Small row of chips describing the barcode itself — purely offline facts
 * (symbology, what it identifies, GS1 country of origin, check-digit validity).
 *
 * @param {object} props
 * @param {import('../../services/barcodeInfo.js').BarcodeInfo} props.info
 */
export function BarcodeMeta({ info, className = '' }) {
  const { t, locale } = useLanguage()
  if (!info) return null

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
        <ScanBadge />
        {t(TYPE_KEYS[info.type] ?? 'barcode.typeUnknown')}
      </span>
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
        {t(KIND_KEYS[info.kind] ?? 'barcode.kindProduct')}
      </span>
      {info.countryCode && (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
          <span aria-hidden="true">{flagEmoji(info.countryCode)}</span>
          {regionName(info.countryCode, locale, info.countryCode)}
        </span>
      )}
      {info.hasCheckDigit &&
        (info.valid ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
            <BadgeCheck className="h-3 w-3" />
            {t('barcode.valid')}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700 ring-1 ring-rose-100">
            <TriangleAlert className="h-3 w-3" />
            {t('barcode.invalid')}
          </span>
        ))}
    </div>
  )
}

/** Tiny inline glyph so the type chip doesn't need a second icon import. */
function ScanBadge() {
  return <Hash className="h-3 w-3" />
}

/**
 * Renders a product that was automatically enriched from the open databases.
 *
 * Everything here was collected for the user the moment they scanned (or typed)
 * the barcode: identity (name/brand/quantity), photos, categories, labels,
 * allergens and the nutrition table — merged from as many sources as had data.
 *
 * @param {object} props
 * @param {import('../../services/productLookup.js').NormalizedProduct} props.product
 * @param {React.ReactNode} [props.actions]  buttons rendered under the card
 * @param {boolean} [props.compact]          condensed variant (add/edit form)
 */
export function ProductPreview({ product, actions, compact = false }) {
  const { t, locale } = useLanguage()
  const [showAllIngredients, setShowAllIngredients] = useState(false)

  if (!product) return null

  const numberFormat = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 })
  const countFormat = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 })

  const foundSources = (product.sources?.length ? product.sources : [product.source])
    .map((id) => sourceMeta(id) ?? SOURCES.find((s) => s.id === id))
    .filter(Boolean)
  // Only sources with a per-product page get a link (the enrichers — Open
  // Prices, RxNav — contribute data but have no product URL of their own).
  const linkSources = foundSources.filter((source) => source.network && typeof source.productUrl === 'function')

  const kindBadge = KIND_BADGES[product.productKind]
  const KindIcon = kindBadge?.icon

  const nutrients = NUTRIENT_ROWS.map((row) => ({
    ...row,
    value: product.nutriments?.[row.key],
  })).filter((row) => Number.isFinite(row.value))

  const facts = [
    product.genre && { icon: Disc3, label: t('product.genre'), value: product.genre },
    product.trackCount != null && {
      icon: Hash,
      label: t('product.tracks'),
      value: countFormat.format(product.trackCount),
    },
    product.releaseDate && { icon: CalendarDays, label: t('product.releaseDate'), value: product.releaseDate },
    product.format && { icon: Layers, label: t('product.format'), value: product.format },
    product.label && { icon: Tag, label: t('product.label'), value: product.label },
    product.publisher && { icon: BookOpen, label: t('product.publisher'), value: product.publisher },
    product.pages != null && { icon: BookOpen, label: t('product.pages'), value: countFormat.format(product.pages) },
    product.dosageForm && { icon: Pill, label: t('product.dosageForm'), value: product.dosageForm },
    product.activeIngredients && {
      icon: FlaskConical,
      label: t('product.activeIngredients'),
      value: product.activeIngredients,
    },
    product.drugStatus && { icon: Stethoscope, label: t('product.drugStatus'), value: product.drugStatus },
    product.price && { icon: Tag, label: t('product.price'), value: formatPrice(product.price, locale) },
  ].filter(Boolean)

  const hasDetails =
    facts.length > 0 ||
    product.categories?.length > 0 ||
    product.labels?.length > 0 ||
    product.allergens?.length > 0 ||
    nutrients.length > 0

  return (
    <div className="overflow-hidden rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/90 to-teal-50/60 p-4">
      {/* Identity */}
      <div className="flex items-start gap-3.5">
        <ProductThumb
          src={product.image}
          alt={t('item.imageAlt', { name: product.name })}
          size={compact ? 'md' : 'lg'}
          className="bg-white"
        />

        <div className="min-w-0 flex-1">
          <h3 className="text-balance text-sm font-bold leading-snug text-slate-900">{product.name}</h3>

          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {kindBadge && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${kindBadge.tone}`}
              >
                <KindIcon className="h-3 w-3" />
                {t(kindBadge.labelKey)}
              </span>
            )}
            {product.brand && <Chip className="bg-white/80 text-slate-600">{product.brand}</Chip>}
            {product.quantity && <Chip className="bg-white/80 text-slate-600">{product.quantity}</Chip>}
            {product.nutriScore && (
              <span
                className={`inline-flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-[10px] font-extrabold uppercase ${
                  NUTRI_TONES[product.nutriScore] ?? 'bg-slate-400 text-white'
                }`}
                title={`${t('item.nutriscore')}: ${product.nutriScore.toUpperCase()}`}
              >
                {product.nutriScore}
              </span>
            )}
            {product.nova && (
              <span
                className={`inline-flex h-5 items-center justify-center rounded-md px-1.5 text-[10px] font-bold ${
                  NOVA_TONES[product.nova] ?? 'bg-slate-100 text-slate-600'
                }`}
                title={t('product.novaHint')}
              >
                NOVA {product.nova}
              </span>
            )}
          </div>

          {/* Auto-collection banner + provenance */}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
              <Sparkles className="h-3.5 w-3.5" />
              {t('product.auto')}
            </span>
            {foundSources.map((source) => (
              <span
                key={source.id}
                className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-slate-600 ring-1 ring-emerald-100"
                title={t('product.sourceTitle', { name: t(source.labelKey) })}
              >
                <span aria-hidden="true">{source.emoji}</span>
                {t(source.labelKey)}
              </span>
            ))}
            {product.fromKnowledgeBase && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-teal-700 ring-1 ring-teal-100">
                <Database className="h-3 w-3" />
                {t('product.fromMemory')}
              </span>
            )}
          </div>
        </div>
      </div>

      {hasDetails && (
        <div className={`mt-3.5 space-y-3 ${compact ? '' : 'rounded-xl bg-white/60 p-3'}`}>
          {facts.length > 0 && (
            <dl className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
              {facts.map((fact) => (
                <div key={fact.label} className="flex items-center gap-1.5">
                  <fact.icon className="h-3.5 w-3.5 text-emerald-600/70" />
                  <dt className="font-semibold text-slate-400">{fact.label}:</dt>
                  <dd className="font-medium text-slate-600">{fact.value}</dd>
                </div>
              ))}
            </dl>
          )}

          {product.categories?.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 shrink-0 text-emerald-600/70" />
              {product.categories.slice(0, compact ? 3 : 5).map((category) => (
                <Chip key={category} className="bg-white/80 text-slate-600">
                  {category}
                </Chip>
              ))}
            </div>
          )}

          {!compact && product.labels?.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 shrink-0 text-emerald-600/70" />
              {product.labels.map((label) => (
                <Chip key={label} className="bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                  {label}
                </Chip>
              ))}
            </div>
          )}

          {product.allergens?.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <TriangleAlert className="h-3.5 w-3.5 shrink-0 text-amber-500" />
              <span className="text-[10px] font-bold uppercase tracking-wide text-amber-600">
                {t('product.allergens')}
              </span>
              {product.allergens.map((allergen) => (
                <Chip key={allergen} className="bg-amber-50 text-amber-700 ring-1 ring-amber-100">
                  {allergen}
                </Chip>
              ))}
            </div>
          )}

          {!compact && nutrients.length > 0 && (
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                <Flame className="h-3.5 w-3.5" />
                {t('product.per100g')}
              </p>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                {nutrients.map((row) => (
                  <div key={row.key} className="rounded-lg bg-white/80 px-2 py-1.5 ring-1 ring-slate-100">
                    <p className="truncate text-[10px] font-medium text-slate-400">{t(row.labelKey)}</p>
                    <p className="text-xs font-bold text-slate-700">
                      {numberFormat.format(row.value)}
                      <span className="ml-0.5 text-[10px] font-semibold text-slate-400">{row.unit}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {product.ingredients && (
            <div>
              <button
                type="button"
                onClick={() => setShowAllIngredients((prev) => !prev)}
                className="flex w-full items-center gap-1.5 text-left text-[10px] font-bold uppercase tracking-wide text-slate-400"
                aria-expanded={showAllIngredients}
              >
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showAllIngredients ? 'rotate-180' : ''}`} />
                {t('recipes.ingredients')}
              </button>
              <p className={`mt-1 text-[11px] leading-relaxed text-slate-500 ${showAllIngredients ? '' : 'line-clamp-3'}`}>
                {product.ingredients}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Footer: barcode facts + source links */}
      <div className="mt-3 space-y-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-slate-400">
          <span className="inline-flex items-center gap-1 font-mono">
            <Hash className="h-3.5 w-3.5" />
            {product.barcode}
          </span>
          {linkSources.map((source) => (
            <a
              key={source.id}
              href={
                source.id === product.source && product.externalUrl
                  ? product.externalUrl
                  : source.productUrl(product.barcode)
              }
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 font-semibold text-emerald-600 underline underline-offset-2 hover:text-emerald-700"
            >
              {source.emoji} {t('product.viewSource')}
              <ExternalLink className="h-3 w-3" />
            </a>
          ))}
        </div>
        <BarcodeMeta info={product.info} />
      </div>

      {actions && <div className="mt-4 flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

/** "4.45 €" (plus the shop, when the crowd-sourced price knows one). */
function formatPrice(price, locale) {
  let amount
  try {
    amount = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: price.currency || 'EUR',
      maximumFractionDigits: 2,
    }).format(price.amount)
  } catch {
    amount = `${price.amount} ${price.currency}`
  }
  return price.store ? `${amount} · ${price.store}` : amount
}

/** Not-found / error notice shown instead of a product card. */
export function LookupNotice({ tone = 'warning', title, description }) {
  const tones = {
    warning: 'border-amber-200 bg-amber-50 text-amber-700',
    error: 'border-rose-200 bg-rose-50 text-rose-700',
  }
  return (
    <div className={`flex items-start gap-2.5 rounded-2xl border p-3.5 ${tones[tone]}`}>
      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        {description && <p className="mt-0.5 text-xs opacity-80">{description}</p>}
      </div>
    </div>
  )
}
