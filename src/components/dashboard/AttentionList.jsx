import { ArrowRight, CircleCheck, Pencil } from 'lucide-react'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { useInventoryContext } from '../../context/InventoryContext.jsx'
import { useUI, VIEWS } from '../../context/UIContext.jsx'
import { getCategoryIcon } from '../../constants/categories.js'
import { ProductThumb } from '../ui/ProductThumb.jsx'
import { StatusPill } from '../ui/Badge.jsx'
import { DaysLeft } from '../inventory/DaysLeft.jsx'
import { EmptyState } from '../ui/EmptyState.jsx'

/**
 * The "needs attention" list: the soonest-expiring (and already expired)
 * items, with inline edit / consumed actions.
 */
export function AttentionList() {
  const { t, formatDate } = useLanguage()
  const { expiringSoon, consumeItem } = useInventoryContext()
  const { setView, setStatusFilter, openEditItem } = useUI()

  const items = expiringSoon.slice(0, 5)

  return (
    <section className="glass flex flex-col rounded-2xl p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-800">{t('dashboard.attention')}</h2>
          <p className="mt-0.5 text-xs text-slate-500">{t('dashboard.attentionHint')}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setStatusFilter('expiringSoon')
            setView(VIEWS.INVENTORY)
          }}
          className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-emerald-600 transition hover:text-emerald-700"
        >
          {t('dashboard.viewAll')}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {items.length === 0 ? (
        <EmptyState icon={CircleCheck} tone="emerald" title={t('dashboard.allFresh')} description={t('dashboard.allFreshHint')} compact />
      ) : (
        <ul className="mt-4 space-y-2">
          {items.map((item) => {
            const Icon = getCategoryIcon(item.category)
            return (
              <li
                key={item.id}
                className="group flex items-center gap-3 rounded-2xl border border-white/70 bg-white/70 p-2.5 transition hover:border-emerald-200 hover:bg-white hover:shadow-sm"
              >
                <ProductThumb src={item.product?.image} alt={t('item.imageAlt', { name: item.name })} fallbackIcon={Icon} size="sm" />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">{item.name}</p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <DaysLeft expiryDate={item.expiryDate} status={item.status} className="text-[11px]" />
                    <span className="hidden text-[11px] text-slate-400 sm:inline">· {formatDate(item.expiryDate)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <StatusPill status={item.status} size="sm" className="hidden sm:inline-flex" />
                  <div className="flex items-center opacity-100 transition lg:opacity-0 lg:group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => consumeItem(item.id)}
                      title={t('item.markConsumed')}
                      aria-label={t('item.markConsumed')}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-600"
                    >
                      <CircleCheck className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditItem(item)}
                      title={t('item.edit')}
                      aria-label={t('item.edit')}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
