import { useCallback, useEffect, useMemo, useState } from 'react'
import { Sidebar } from './components/layout/Sidebar.jsx'
import { Navbar } from './components/layout/Navbar.jsx'
import { MobileNav } from './components/layout/MobileNav.jsx'
import { DashboardView } from './components/dashboard/DashboardView.jsx'
import { InventoryView } from './components/inventory/InventoryView.jsx'
import { ScannerView } from './components/barcode/ScannerView.jsx'
import { RecipesView } from './components/recipes/RecipesView.jsx'
import { AddEditItemModal } from './components/inventory/AddEditItemModal.jsx'
import { ConfirmDialog } from './components/ui/ConfirmDialog.jsx'
import { LanguageProvider, useLanguage } from './i18n/LanguageContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import { InventoryProvider, useInventoryContext } from './context/InventoryContext.jsx'
import { UIProvider, VIEWS } from './context/UIContext.jsx'

/**
 * AI-Expiry Tracker
 * ─────────────────
 * Provider order matters: the inventory layer talks to both the toast queue and
 * the translator, so it has to sit inside both.
 */
export default function App() {
  return (
    <LanguageProvider>
      <ToastProvider>
        <InventoryProvider>
          <AppShell />
        </InventoryProvider>
      </ToastProvider>
    </LanguageProvider>
  )
}

/**
 * Layout + navigation + dialog orchestration.
 * Owns the "view" and the global filters so the dashboard can deep-link into a
 * pre-filtered inventory.
 */
function AppShell() {
  const { t } = useLanguage()
  const inventory = useInventoryContext()

  // ── navigation & cross-view filters ──────────────────────────────────────
  const [view, setView] = useState(VIEWS.DASHBOARD)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // ── dialogs ──────────────────────────────────────────────────────────────
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [prefill, setPrefill] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)

  // Scroll to the top whenever the section changes.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [view])

  const openAddItem = useCallback((draft = null) => {
    setEditing(null)
    setPrefill(draft)
    setAddOpen(true)
  }, [])

  const openEditItem = useCallback((item) => {
    setEditing(item)
    setPrefill(null)
    setAddOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setAddOpen(false)
    setEditing(null)
    setPrefill(null)
  }, [])

  const requestDelete = useCallback((item) => setPendingDelete(item), [])

  const confirmDelete = useCallback(() => {
    if (pendingDelete) inventory.removeItem(pendingDelete.id)
    setPendingDelete(null)
  }, [pendingDelete, inventory])

  const uiValue = useMemo(
    () => ({
      view,
      setView,
      categoryFilter,
      setCategoryFilter,
      statusFilter,
      setStatusFilter,
      openAddItem,
      openEditItem,
      requestDelete,
      ...inventory,
    }),
    [view, categoryFilter, statusFilter, openAddItem, openEditItem, requestDelete, inventory],
  )

  return (
    <UIProvider value={uiValue}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-xl focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-emerald-700 focus:shadow-lg"
      >
        {t('common.skipToContent')}
      </a>

      <div className="min-h-dvh">
        <Sidebar />

        <div className="lg:pl-72">
          <Navbar />

          <main id="main-content" className="mx-auto max-w-7xl px-4 pb-28 pt-5 sm:px-6 lg:pb-12">
            {view === VIEWS.DASHBOARD && <DashboardView />}
            {view === VIEWS.INVENTORY && <InventoryView />}
            {view === VIEWS.SCANNER && <ScannerView />}
            {view === VIEWS.RECIPES && <RecipesView />}

            <footer className="mt-10 pb-2 text-center text-[11px] text-slate-400">
              <p>
                {t('app.name')} · {t('common.madeWith')}
              </p>
            </footer>
          </main>
        </div>

        <MobileNav />

        <AddEditItemModal
          open={addOpen}
          editing={editing}
          prefill={prefill}
          onClose={closeModal}
        />

        <ConfirmDialog
          item={pendingDelete}
          onCancel={() => setPendingDelete(null)}
          onConfirm={confirmDelete}
        />
      </div>
    </UIProvider>
  )
}
