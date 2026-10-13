import { useEffect, useRef, useState } from 'react'
import { ArrowDownUp, CircleCheck, CircleX, Eye, EyeOff, ListFilter, Search, TriangleAlert, X } from 'lucide-react'
import { useLanguage } from '../../i18n/LanguageContext.jsx'

const STATUS_OPTIONS = [
  { id: 'all', labelKey: 'status.all', icon: ListFilter },
  { id: 'fresh', labelKey: 'status.fresh', icon: CircleCheck, dot: 'bg-emerald-500' },
  { id: 'expiringSoon', labelKey: 'status.expiringSoon', icon: TriangleAlert, dot: 'bg-amber-500' },
  { id: 'expired', labelKey: 'status.expired', icon: CircleX, dot: 'bg-rose-500' },
]

const SORT_OPTIONS = [
  { id: 'expiry', labelKey: 'sort.expiry' },
  { id: 'name', labelKey: 'sort.name' },
  { id: 'added', labelKey: 'sort.added' },
  { id: 'quantity', labelKey: 'sort.quantity' },
]

/**
 * Search + status filter chips + sort control + "show consumed" toggle.
 */
export function InventoryToolbar({
  query,
  onQueryChange,
  status,
  onStatusChange,
  sort,
  onSortChange,
  showConsumed,
  onShowConsumedChange,
  statusCounts,
}) {
  const { t } = useLanguage()
  const [sortOpen, setSortOpen] = useState(false)
  const sortRef = useRef(null)
  const inputRef = useRef(null)

  // Close the sort dropdown on outside click / Escape.
  useEffect(() => {
    if (!sortOpen) return undefined
    const onClick = (event) => {
      if (!sortRef.current?.contains(event.target)) setSortOpen(false)
    }
    const onKey = (event) => {
      if (event.key === 'Escape') setSortOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [sortOpen])

  // "/" focuses the search box.
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        event.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const activeSort = SORT_OPTIONS.find((option) => option.id === sort) ?? SORT_OPTIONS[0]

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={t('inventory.search')}
            className="w-full rounded-2xl border border-white/60 bg-white/80 py-3 pl-10 pr-10 text-sm text-slate-700 shadow-sm backdrop-blur-md transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
          {query && (
            <button
              type="button"
              onClick={() => onQueryChange('')}
              aria-label={t('common.clear')}
              className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Sort */}
          <div className="relative flex-1 sm:flex-none" ref={sortRef}>
            <button
              type="button"
              onClick={() => setSortOpen((open) => !open)}
              aria-expanded={sortOpen}
              aria-haspopup="listbox"
              className="flex w-full items-center gap-2 rounded-2xl border border-white/60 bg-white/80 px-3.5 py-3 text-sm font-medium text-slate-600 shadow-sm backdrop-blur-md transition hover:bg-white"
            >
              <ArrowDownUp className="h-4 w-4 text-slate-400" />
              <span className="truncate">{t(activeSort.labelKey)}</span>
            </button>

            {sortOpen && (
              <div
                role="listbox"
                className="absolute right-0 z-30 mt-2 w-52 overflow-hidden rounded-2xl border border-white/60 bg-white/95 p-1.5 shadow-xl backdrop-blur-xl animate-scale-in"
              >
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    role="option"
                    aria-selected={option.id === sort}
                    onClick={() => {
                      onSortChange(option.id)
                      setSortOpen(false)
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition ${
                      option.id === sort ? 'bg-emerald-50 font-semibold text-emerald-700' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {t(option.labelKey)}
                    {option.id === sort && <CircleCheck className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Consumed toggle */}
          <button
            type="button"
            onClick={() => onShowConsumedChange(!showConsumed)}
            aria-pressed={showConsumed}
            title={showConsumed ? t('inventory.hideConsumed') : t('inventory.showConsumed')}
            className={`flex shrink-0 items-center gap-2 rounded-2xl border px-3.5 py-3 text-sm font-medium shadow-sm backdrop-blur-md transition ${
              showConsumed
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-white/60 bg-white/80 text-slate-500 hover:bg-white'
            }`}
          >
            {showConsumed ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            <span className="hidden md:inline">
              {showConsumed ? t('inventory.hideConsumed') : t('inventory.showConsumed')}
            </span>
          </button>
        </div>
      </div>

      {/* Status chips */}
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
        {STATUS_OPTIONS.map((option) => {
          const active = status === option.id
          const Icon = option.icon
          const count = statusCounts?.[option.id]
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onStatusChange(option.id)}
              aria-pressed={active}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                active
                  ? 'border-slate-800 bg-slate-800 text-white'
                  : 'border-white/60 bg-white/70 text-slate-500 backdrop-blur-md hover:bg-white hover:text-slate-700'
              }`}
            >
              {option.dot ? (
                <span className={`h-1.5 w-1.5 rounded-full ${option.dot}`} />
              ) : (
                <Icon className="h-3.5 w-3.5" />
              )}
              {t(option.labelKey)}
              {count != null && (
                <span className={`tabular-nums ${active ? 'text-white/70' : 'text-slate-400'}`}>{count}</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
