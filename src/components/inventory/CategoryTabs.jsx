import { LayoutGrid } from 'lucide-react'
import { CATEGORIES } from '../../constants/categories.js'
import { useLanguage } from '../../i18n/LanguageContext.jsx'

/**
 * Storage-area tabs with live counts.
 * `value` is a category id or 'all'.
 */
export function CategoryTabs({ value, onChange, counts }) {
  const { t } = useLanguage()

  const tabs = [
    { id: 'all', labelKey: 'category.all', icon: LayoutGrid, accent: null },
    ...CATEGORIES,
  ]

  return (
    <div
      className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
      role="tablist"
      aria-label={t('form.category')}
    >
      {tabs.map((tab) => {
        const active = value === tab.id
        const Icon = tab.icon
        const count = counts?.[tab.id] ?? 0
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={`flex shrink-0 items-center gap-2 rounded-2xl border px-3.5 py-2.5 text-sm font-semibold transition ${
              active
                ? 'border-transparent bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25'
                : 'border-white/60 bg-white/70 text-slate-600 backdrop-blur-md hover:bg-white hover:text-slate-900'
            }`}
          >
            <Icon className="h-4 w-4" strokeWidth={2.1} />
            <span className="whitespace-nowrap">{t(tab.labelKey)}</span>
            <span
              className={`min-w-5 rounded-full px-1.5 py-0.5 text-center text-[11px] font-bold tabular-nums ${
                active ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
