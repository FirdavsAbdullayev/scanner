import { Plus, Sparkles } from 'lucide-react'
import { NAV_ITEMS } from './navItems.js'
import { LanguageSwitcher } from './LanguageSwitcher.jsx'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { useInventoryContext } from '../../context/InventoryContext.jsx'
import { useUI } from '../../context/UIContext.jsx'

const BADGE_TONES = {
  alert: 'bg-amber-500 text-white',
  ai: 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white',
  neutral: 'bg-slate-200 text-slate-700',
}

/** Fixed glass sidebar — desktop and up. */
export function Sidebar() {
  const { t } = useLanguage()
  const inventory = useInventoryContext()
  const { view, setView, openAddItem } = useUI()
  const { stats } = inventory

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col p-4 lg:flex">
      <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-white/60 bg-white/70 shadow-soft backdrop-blur-xl">
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-4">
          <span className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/30">
            <Sparkles className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold tracking-tight text-slate-900">
              {t('app.name')}
            </p>
            <p className="truncate text-[11px] font-medium text-slate-500">{t('app.shortTagline')}</p>
          </div>
        </div>

        {/* Primary action */}
        <div className="px-4 pb-3">
          <button
            type="button"
            onClick={() => openAddItem()}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:brightness-110 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            {t('inventory.add')}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2 no-scrollbar" aria-label={t('nav.primary')}>
          {NAV_ITEMS.map((item) => {
            const active = view === item.id
            const Icon = item.icon
            const badge = item.badge(inventory)
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setView(item.id)}
                aria-current={active ? 'page' : undefined}
                className={`group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition ${
                  active
                    ? 'bg-gradient-to-r from-emerald-500/12 to-teal-500/10 text-emerald-700 ring-1 ring-emerald-200/70'
                    : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'
                }`}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
                    active
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/25'
                      : 'bg-slate-100/80 text-slate-500 group-hover:bg-white group-hover:text-emerald-600'
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" strokeWidth={2.1} />
                </span>
                <span className="flex-1 text-left">{t(item.labelKey)}</span>
                {badge != null && (
                  <span
                    className={`min-w-6 rounded-full px-1.5 py-0.5 text-center text-[11px] font-bold tabular-nums ${
                      BADGE_TONES[item.badgeTone] ?? BADGE_TONES.neutral
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Footer stats + language */}
        <div className="space-y-3 border-t border-white/60 px-4 py-4">
          <div className="grid grid-cols-3 gap-2">
            <MiniStat value={stats.fresh} label={t('status.fresh')} dot="bg-emerald-500" />
            <MiniStat value={stats.expiringSoon} label={t('status.expiringSoon')} dot="bg-amber-500" />
            <MiniStat value={stats.expired} label={t('status.expired')} dot="bg-rose-500" />
          </div>
          <LanguageSwitcher variant="stacked" />
        </div>
      </div>
    </aside>
  )
}

function MiniStat({ value, label, dot }) {
  return (
    <div className="rounded-xl bg-white/70 px-2 py-2 text-center ring-1 ring-white/60">
      <div className="flex items-center justify-center gap-1.5">
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        <span className="text-sm font-bold tabular-nums text-slate-800">{value}</span>
      </div>
      <p className="mt-0.5 truncate text-[10px] font-medium text-slate-500">{label}</p>
    </div>
  )
}
