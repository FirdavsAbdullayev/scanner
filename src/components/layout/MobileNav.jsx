import { Plus } from 'lucide-react'
import { NAV_ITEMS } from './navItems.js'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { useInventoryContext } from '../../context/InventoryContext.jsx'
import { useUI } from '../../context/UIContext.jsx'

/**
 * Bottom tab bar for phones and small tablets.
 * The middle slot is a raised "add" action.
 */
export function MobileNav() {
  const { t } = useLanguage()
  const inventory = useInventoryContext()
  const { view, setView, openAddItem } = useUI()

  // Two items either side of the central FAB.
  const left = NAV_ITEMS.slice(0, 2)
  const right = NAV_ITEMS.slice(2)

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/60 bg-white/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
      aria-label={t('nav.primary')}
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-between gap-1 px-2 py-1.5">
        {left.map((item) => (
          <TabButton key={item.id} item={item} active={view === item.id} onSelect={setView} inventory={inventory} t={t} />
        ))}

        {/* Centre action */}
        <div className="relative flex w-16 shrink-0 justify-center">
          <button
            type="button"
            onClick={() => openAddItem()}
            aria-label={t('inventory.add')}
            className="absolute -top-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-xl shadow-emerald-500/35 transition active:scale-95"
          >
            <Plus className="h-6 w-6" strokeWidth={2.6} />
          </button>
        </div>

        {right.map((item) => (
          <TabButton key={item.id} item={item} active={view === item.id} onSelect={setView} inventory={inventory} t={t} />
        ))}
      </div>
    </nav>
  )
}

function TabButton({ item, active, onSelect, inventory, t }) {
  const Icon = item.icon
  const badge = item.badge(inventory)
  return (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      aria-current={active ? 'page' : undefined}
      className={`relative flex flex-1 flex-col items-center gap-0.5 rounded-2xl px-1 py-2 text-[10px] font-semibold transition ${
        active ? 'text-emerald-600' : 'text-slate-400'
      }`}
    >
      <span className="relative">
        <Icon className="h-5.5 w-5.5" strokeWidth={active ? 2.4 : 2} />
        {badge != null && (
          <span
            className={`absolute -right-2.5 -top-1.5 min-w-4 rounded-full px-1 text-center text-[9px] font-bold leading-4 ${
              item.badgeTone === 'alert'
                ? 'bg-amber-500 text-white'
                : item.badgeTone === 'ai'
                  ? 'bg-violet-500 text-white'
                  : 'bg-slate-200 text-slate-600'
            }`}
          >
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </span>
      <span className="max-w-16 truncate">{t(item.labelKey)}</span>
      {active && <span className="absolute inset-x-4 -bottom-0.5 h-0.5 rounded-full bg-emerald-500" />}
    </button>
  )
}
