import { useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useLanguage } from '../../i18n/LanguageContext.jsx'

/**
 * Accessible modal dialog.
 *
 * - renders into a portal on <body> so it is never clipped by a parent
 * - closes on Escape and on backdrop click
 * - locks body scroll while open
 * - traps Tab focus inside the panel
 * - animates in with a subtle scale + fade
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {string} [props.title]
 * @param {string} [props.subtitle]
 * @param {React.ReactNode} [props.icon]   small element shown left of the title
 * @param {React.ReactNode} [props.footer]
 * @param {'sm'|'md'|'lg'|'xl'} [props.size]
 */
export function Modal({
  open,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
}) {
  const { t } = useLanguage()
  const panelRef = useRef(null)
  const previouslyFocused = useRef(null)

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose?.()
        return
      }
      if (event.key !== 'Tab' || !panelRef.current) return

      // Simple focus trap.
      const focusables = panelRef.current.querySelectorAll(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      )
      if (!focusables.length) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    },
    [onClose],
  )

  useEffect(() => {
    if (!open) return undefined

    previouslyFocused.current = document.activeElement
    const { overflow, paddingRight } = document.body.style
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    document.body.style.overflow = 'hidden'
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`

    // Focus the first sensible control for keyboard users.
    const timer = setTimeout(() => {
      const target = panelRef.current?.querySelector('[data-autofocus]') ?? panelRef.current
      target?.focus?.()
    }, 40)

    return () => {
      clearTimeout(timer)
      document.body.style.overflow = overflow
      document.body.style.paddingRight = paddingRight
      previouslyFocused.current?.focus?.()
    }
  }, [open])

  if (!open || typeof document === 'undefined') return null

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center overflow-y-auto p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label={t('common.close')}
        tabIndex={-1}
        onClick={closeOnBackdrop ? onClose : undefined}
        className="absolute inset-0 h-full w-full cursor-default bg-slate-900/35 backdrop-blur-sm animate-fade-in"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`relative z-10 flex max-h-[92dvh] w-full ${sizes[size]} flex-col overflow-hidden rounded-t-3xl border border-white/60 bg-white/95 shadow-2xl backdrop-blur-xl animate-pop-in sm:rounded-3xl`}
      >
        {(title || subtitle) && (
          <header className="flex items-start gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
            {icon && (
              <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25">
                {icon}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-semibold text-slate-900">{title}</h2>
              {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t('common.close')}
              className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
          </header>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>

        {footer && (
          <footer className="border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6">{footer}</footer>
        )}
      </div>
    </div>,
    document.body,
  )
}
