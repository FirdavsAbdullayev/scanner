import { createContext, useContext, useMemo } from 'react'
import { useInventory } from '../hooks/useInventory.js'
import { useToastContext } from './ToastContext.jsx'
import { useLanguage } from '../i18n/LanguageContext.jsx'

const InventoryContext = createContext(null)

/**
 * Wraps `useInventory()` with localized toasts so every consumer gets
 * CRUD + feedback in one call. Components stay free of toast plumbing.
 */
export function InventoryProvider({ children }) {
  const inventory = useInventory()
  const { toast } = useToastContext()
  const { t } = useLanguage()

  const value = useMemo(() => {
    const {
      addItem,
      updateItem,
      deleteItem,
      toggleConsumed,
      lookupProduct,
      resetToSeed,
      clearAll,
      ...rest
    } = inventory

    return {
      ...rest,

      /** Add + toast. */
      createItem(draft) {
        const item = addItem(draft)
        toast({ title: t('toast.added', { name: item.name }), tone: 'success' })
        return item
      },

      /** Patch + toast. */
      saveItem(id, patch) {
        const item = updateItem(id, patch)
        if (item) toast({ title: t('toast.updated', { name: item.name }), tone: 'success' })
        return item
      },

      /** Delete + toast. */
      removeItem(id) {
        const removed = deleteItem(id)
        if (removed) toast({ title: t('toast.deleted', { name: removed.name }), tone: 'info' })
        return removed
      },

      /** Flip consumed and toast either way. */
      consumeItem(id) {
        const item = toggleConsumed(id)
        if (item) {
          toast({
            title: item.consumed
              ? t('toast.consumed', { name: item.name })
              : t('toast.restored', { name: item.name }),
            tone: item.consumed ? 'success' : 'info',
          })
        }
        return item
      },

      /** Quantity stepper (never drops below 1). */
      setQuantity(id, quantity) {
        return updateItem(id, { quantity: Math.max(1, Number(quantity) || 1) })
      },

      /** Reload the demo dataset. */
      loadDemoData() {
        resetToSeed()
        toast({ title: t('toast.productLoaded'), tone: 'success' })
      },

      /** Wipe the inventory. */
      wipeInventory() {
        clearAll()
        toast({ title: t('toast.deleted', { name: t('nav.inventory') }), tone: 'info' })
      },

      lookupProduct,
    }
  }, [inventory, toast, t])

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>
}

export function useInventoryContext() {
  const ctx = useContext(InventoryContext)
  if (!ctx) throw new Error('useInventoryContext must be used inside <InventoryProvider>')
  return ctx
}

export { InventoryContext }
