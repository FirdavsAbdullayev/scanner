import { useMemo, useState } from 'react'
import { Package, PackageOpen, Plus, RotateCcw } from 'lucide-react'
import { CategoryTabs } from './CategoryTabs.jsx'
import { InventoryToolbar } from './InventoryToolbar.jsx'
import { ItemGrid } from './ItemGrid.jsx'
import { EmptyState } from '../ui/EmptyState.jsx'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { useInventoryContext } from '../../context/InventoryContext.jsx'
import { useUI } from '../../context/UIContext.jsx'
import { compareByExpiry } from '../../utils/dateUtils.js'
import { CATEGORY_IDS } from '../../constants/categories.js'

/**
 * The inventory screen: category tabs, search / filter / sort toolbar and the
 * product grid. All filtering happens in `useMemo` over the derived items.
 */
export function InventoryView() {
  const { t } = useLanguage()
  const { items, activeItems, consumedItems } = useInventoryContext()
  const {
    categoryFilter,
    setCategoryFilter,
    statusFilter,
    setStatusFilter,
    openAddItem,
    loadDemoData,
  } = useUI()

  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('expiry')
  const [showConsumed, setShowConsumed] = useState(false)

  /** Items decorated with a status — consumed rows get their own badge. */
  const decorated = useMemo(() => {
    if (!showConsumed) return activeItems
    return [
      ...activeItems,
      ...consumedItems.map((item) => ({ ...item, status: 'consumed', daysLeft: null })),
    ]
  }, [activeItems, consumedItems, showConsumed])

  /** Counts for the category tabs (consumed rows included only when shown). */
  const categoryCounts = useMemo(() => {
    const counts = { all: decorated.length }
    CATEGORY_IDS.forEach((id) => {
      counts[id] = decorated.filter((item) => item.category === id).length
    })
    return counts
  }, [decorated])

  /** Counts for the status chips (based on the category-filtered set). */
  const statusCounts = useMemo(() => {
    const scoped = decorated.filter((item) => categoryFilter === 'all' || item.category === categoryFilter)
    return {
      all: scoped.length,
      fresh: scoped.filter((item) => item.status === 'fresh').length,
      expiringSoon: scoped.filter((item) => item.status === 'expiringSoon').length,
      expired: scoped.filter((item) => item.status === 'expired').length,
    }
  }, [decorated, categoryFilter])

  /** The final list: category → status → search → sort. */
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()

    const filtered = decorated.filter((item) => {
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false
      if (statusFilter !== 'all' && item.status !== statusFilter) return false
      if (!needle) return true
      return (
        item.name.toLowerCase().includes(needle) ||
        (item.barcode ?? '').includes(needle) ||
        (item.location ?? '').toLowerCase().includes(needle) ||
        (item.product?.brand ?? '').toLowerCase().includes(needle) ||
        (item.product?.categories ?? []).some((c) => c.toLowerCase().includes(needle))
      )
    })

    const sorted = [...filtered]
    switch (sort) {
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'added':
        sorted.sort((a, b) => b.addedAt - a.addedAt)
        break
      case 'quantity':
        sorted.sort((a, b) => b.quantity - a.quantity)
        break
      case 'expiry':
      default:
        sorted.sort(compareByExpiry)
        break
    }
    return sorted
  }, [decorated, categoryFilter, statusFilter, query, sort])

  const hasFilters = categoryFilter !== 'all' || statusFilter !== 'all' || query.trim() !== ''

  const clearFilters = () => {
    setCategoryFilter('all')
    setStatusFilter('all')
    setQuery('')
  }

  return (
    <div className="space-y-5">
      {/* Toolbar card */}
      <div className="glass space-y-4 rounded-2xl p-4 shadow-soft sm:p-5">
        <CategoryTabs value={categoryFilter} onChange={setCategoryFilter} counts={categoryCounts} />
        <InventoryToolbar
          query={query}
          onQueryChange={setQuery}
          status={statusFilter}
          onStatusChange={setStatusFilter}
          sort={sort}
          onSortChange={setSort}
          showConsumed={showConsumed}
          onShowConsumedChange={setShowConsumed}
          statusCounts={statusCounts}
        />
        <div className="flex items-center justify-between gap-3 border-t border-white/60 pt-3">
          <p className="text-xs font-semibold text-slate-500">
            {visible.length > 0 ? t('inventory.count', { n: visible.length }) : t('inventory.countZero')}
          </p>
          <button
            type="button"
            onClick={() => openAddItem()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.6} />
            {t('inventory.add')}
          </button>
        </div>
      </div>

      {/* Grid / empty states */}
      {visible.length > 0 ? (
        <ItemGrid items={visible} />
      ) : items.length === 0 ? (
        <div className="glass rounded-2xl shadow-soft">
          <EmptyState
            icon={PackageOpen}
            title={t('inventory.empty.title')}
            description={t('inventory.empty.text')}
            actions={
              <>
                <button
                  type="button"
                  onClick={() => openAddItem()}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:brightness-110"
                >
                  <Plus className="h-4 w-4" strokeWidth={2.5} />
                  {t('inventory.add')}
                </button>
                <button
                  type="button"
                  onClick={loadDemoData}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  <RotateCcw className="h-4 w-4" />
                  {t('common.reset')}
                </button>
              </>
            }
          />
        </div>
      ) : (
        <div className="glass rounded-2xl shadow-soft">
          <EmptyState
            icon={Package}
            tone="slate"
            title={t('inventory.emptyFiltered.title')}
            description={t('inventory.emptyFiltered.text')}
            actions={
              hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  <RotateCcw className="h-4 w-4" />
                  {t('inventory.clearFilters')}
                </button>
              )
            }
          />
        </div>
      )}
    </div>
  )
}
