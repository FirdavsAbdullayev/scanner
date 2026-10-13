import { BadgeCheck, ExternalLink, Hash, Layers, TriangleAlert } from 'lucide-react'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { ProductThumb } from '../ui/ProductThumb.jsx'
import { Chip } from '../ui/Badge.jsx'

const NUTRI_TONES = {
  a: 'bg-emerald-500 text-white',
  b: 'bg-lime-500 text-white',
  c: 'bg-amber-500 text-white',
  d: 'bg-orange-500 text-white',
  e: 'bg-rose-500 text-white',
}

/**
 * Renders a normalized Open Food Facts product.
 *
 * @param {object} props
 * @param {import('../../services/openFoodFacts.js').NormalizedProduct} props.product
 * @param {React.ReactNode} [props.actions]  buttons rendered under the card
 * @param {boolean} [props.compact]
 */
export function ProductPreview({ product, actions, compact = false }) {
  const { t } = useLanguage()
  if (!product) return null

  return (
    <div className="overflow-hidden rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/90 to-teal-50/60 p-4">
      <div className="flex items-start gap-3.5">
        <ProductThumb
          src={product.image}
          alt={t('item.imageAlt', { name: product.name })}
          size={compact ? 'md' : 'lg'}
          className="bg-white"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-balance text-sm font-bold leading-snug text-slate-900">{product.name}</h3>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
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
              </div>
            </div>
          </div>

          <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
            <BadgeCheck className="h-3.5 w-3.5" />
            {t('item.fromOff')}
          </p>
        </div>
      </div>

      {product.categories?.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <Layers className="h-3.5 w-3.5 text-emerald-600/70" />
          {product.categories.slice(0, 4).map((category) => (
            <Chip key={category} className="bg-white/80 text-slate-600">
              {category}
            </Chip>
          ))}
        </div>
      )}

      {product.ingredients && (
        <p className="mt-3 line-clamp-3 text-[11px] leading-relaxed text-slate-500">
          <span className="font-semibold text-slate-600">{t('recipes.ingredients')}: </span>
          {product.ingredients}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
        <span className="inline-flex items-center gap-1 font-mono">
          <Hash className="h-3.5 w-3.5" />
          {product.barcode}
        </span>
        <a
          href={`https://world.openfoodfacts.org/product/${product.barcode}`}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1 font-semibold text-emerald-600 underline underline-offset-2 hover:text-emerald-700"
        >
          Open Food Facts
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {actions && <div className="mt-4 flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
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
