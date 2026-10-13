import { Layers } from 'lucide-react'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { useInventoryContext } from '../../context/InventoryContext.jsx'
import { CATEGORIES } from '../../constants/categories.js'
import { useUI, VIEWS } from '../../context/UIContext.jsx'

/**
 * Per-category stacked progress bar: how much of each storage area is
 * fresh / expiring soon / expired. Clicking a row filters the inventory.
 */
export function CategoryBreakdown() {
  const { t } = useLanguage()
  const { byCategory } = useInventoryContext()
  const { setView, setCategoryFilter } = useUI()

  return (
    <section className="glass rounded-2xl p-5 shadow-soft">
      <div>
        <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <Layers className="h-4 w-4 text-emerald-600" />
          {t('dashboard.breakdown')}
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">{t('dashboard.breakdownHint')}</p>
      </div>

      <ul className="mt-4 space-y-3.5">
        {CATEGORIES.map((category) => {
          const bucket = byCategory[category.id] ?? { total: 0, fresh: 0, expiringSoon: 0, expired: 0 }
          const Icon = category.icon
          const percent = (count) => (bucket.total ? (count / bucket.total) * 100 : 0)

          return (
            <li key={category.id}>
              <button
                type="button"
                onClick={() => {
                  setCategoryFilter(category.id)
                  setView(VIEWS.INVENTORY)
                }}
                className="w-full text-left"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-xl ${category.accent.bg} ${category.accent.text}`}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2.1} />
                  </span>
                  <span className="flex-1 truncate text-sm font-semibold text-slate-700">
                    {t(category.labelKey)}
                  </span>
                  <span className="text-sm font-bold tabular-nums text-slate-800">{bucket.total}</span>
                </div>

                <div className="mt-2 flex h-2 w-full gap-0.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${percent(bucket.fresh)}%` }} />
                  <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${percent(bucket.expiringSoon)}%` }} />
                  <div className="h-full bg-rose-500 transition-all duration-500" style={{ width: `${percent(bucket.expired)}%` }} />
                </div>

                <div className="mt-1.5 flex items-center gap-3 text-[10px] font-medium text-slate-400">
                  <span className="inline-flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {bucket.fresh}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    {bucket.expiringSoon}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                    {bucket.expired}
                  </span>
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
