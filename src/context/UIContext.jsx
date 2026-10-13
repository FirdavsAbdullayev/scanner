import { createContext, useContext } from 'react'

/**
 * Lightweight UI orchestration: which section is visible, and which modal
 * (add / edit / delete-confirm) is currently open.
 *
 * `App` owns the state and supplies the value — this file only defines the
 * contract so leaf components can open dialogs without prop-drilling.
 */
const UIContext = createContext(null)

export const VIEWS = {
  DASHBOARD: 'dashboard',
  INVENTORY: 'inventory',
  SCANNER: 'scanner',
  RECIPES: 'recipes',
}

export function UIProvider({ value, children }) {
  return <UIContext.Provider value={value}>{children}</UIContext.Provider>
}

export function useUI() {
  const ctx = useContext(UIContext)
  if (!ctx) throw new Error('useUI must be used inside <UIProvider>')
  return ctx
}

export { UIContext }
