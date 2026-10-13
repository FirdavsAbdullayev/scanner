import { ChefHat, LayoutDashboard, Package, ScanBarcode } from 'lucide-react'
import { VIEWS } from '../../context/UIContext.jsx'

/**
 * Navigation definition shared by the desktop sidebar and the mobile tab bar.
 * `badge` receives the inventory context and returns a number (or null).
 */
export const NAV_ITEMS = [
  {
    id: VIEWS.DASHBOARD,
    labelKey: 'nav.dashboard',
    titleKey: 'dashboard.title',
    subtitleKey: 'dashboard.subtitle',
    icon: LayoutDashboard,
    badge: (inv) => (inv.stats.expiringSoon + inv.stats.expired > 0 ? inv.stats.expiringSoon + inv.stats.expired : null),
    badgeTone: 'alert',
  },
  {
    id: VIEWS.INVENTORY,
    labelKey: 'nav.inventory',
    titleKey: 'inventory.title',
    subtitleKey: 'inventory.subtitle',
    icon: Package,
    badge: (inv) => inv.stats.total || null,
    badgeTone: 'neutral',
  },
  {
    id: VIEWS.SCANNER,
    labelKey: 'nav.scanner',
    titleKey: 'scanner.title',
    subtitleKey: 'scanner.subtitle',
    icon: ScanBarcode,
    badge: () => null,
  },
  {
    id: VIEWS.RECIPES,
    labelKey: 'nav.recipes',
    titleKey: 'recipes.title',
    subtitleKey: 'recipes.subtitle',
    icon: ChefHat,
    badge: (inv) => {
      const count = inv.usableForRecipes.filter((i) => i.status === 'expiringSoon').length
      return count > 0 ? count : null
    },
    badgeTone: 'ai',
  },
]
