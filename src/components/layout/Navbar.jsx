import { Plus, ScanBarcode, Sparkles } from 'lucide-react'
import { NAV_ITEMS } from './navItems.js'
import { LanguageSwitcher } from './LanguageSwitcher.jsx'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { useInventoryContext } from '../../context/InventoryContext.jsx'
import { useUI, VIEWS } from '../../context/UIContext.jsx'

/**
 * Sticky top bar.
 *  - phones: brand + language + scan shortcut
 *  - desktop: the current section title + subtitle, with quick actions
 */
export function Navbar() {
  const { t } = useLanguage()
  const inventory = useInventoryContext()
  const { view, setView, openAddItem } = useUI()

  const meta = NAV_ITEMS.find((item) => item.id === view) ?? NAV_ITEMS[0]
  const needsAttention = inventory.stats.expiringSoon + inventory.stats.expired

  return (
    <header className="sticky top-0 z-30 border-b border-white/50 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
        {/* Brand — mobile only */}
        <div className="flex min-w-0 items-center gap-2.5 lg:hidden">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-md shadow-emerald-500/30">
            <Sparkles className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold tracking-tight text-slate-900">
              {t('app.name')}
            </p>
            <p className="truncate text-[10px] font-medium text-slate-500">
              {t('app.shortTagline')}
            </p>
          </div>
        </div>

        {/* Section title — desktop only */}
        <div className="hidden min-w-0 lg:block">
          <h1 className="truncate text-lg font-bold tracking-tight text-slate-900">{t(meta.titleKey)}</h1>
          <p className="truncate text-xs text-slate-500">{t(meta.subtitleKey)}</p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {needsAttention > 0 && (
            <button
              type="button"
              onClick={() => setView(VIEWS.INVENTORY)}
              className="hidden items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 sm:inline-flex"
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
              {t('stats.itemsNeedAttention', { n: needsAttention })}
            </button>
          )}

          <LanguageSwitcher />

          <button
            type="button"
            onClick={() => setView(VIEWS.SCANNER)}
            aria-label={t('scanner.title')}
            title={t('scanner.title')}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/60 bg-white/70 text-slate-500 backdrop-blur-md transition hover:bg-white hover:text-emerald-600"
          >
            <ScanBarcode className="h-4.5 w-4.5" />
          </button>

          <button
            type="button"
            onClick={() => openAddItem()}
            className="hidden items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-3.5 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:brightness-110 active:scale-[0.98] sm:flex"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            <span className="hidden md:inline">{t('inventory.add')}</span>
          </button>
        </div>
      </div>
    </header>
  )
}
