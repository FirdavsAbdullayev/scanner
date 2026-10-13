import { CircleCheck, CircleX, Info, TriangleAlert, X } from 'lucide-react'
import { useLanguage } from '../../i18n/LanguageContext.jsx'

const TONES = {
  success: {
    icon: CircleCheck,
    accent: 'border-emerald-200 bg-white/90',
    iconWrap: 'bg-emerald-100 text-emerald-600',
    bar: 'bg-emerald-500',
  },
  error: {
    icon: CircleX,
    accent: 'border-rose-200 bg-white/90',
    iconWrap: 'bg-rose-100 text-rose-600',
    bar: 'bg-rose-500',
  },
  warning: {
    icon: TriangleAlert,
    accent: 'border-amber-200 bg-white/90',
    iconWrap: 'bg-amber-100 text-amber-600',
    bar: 'bg-amber-500',
  },
  info: {
    icon: Info,
    accent: 'border-slate-200 bg-white/90',
    iconWrap: 'bg-slate-100 text-slate-600',
    bar: 'bg-slate-400',
  },
}

/**
 * Fixed toast stack. Bottom-centre on mobile (above the tab bar),
 * bottom-right on larger screens.
 */
export function Toasts({ toasts, onDismiss }) {
  const { t } = useLanguage()
  if (!toasts?.length) return null

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-20 z-[120] flex flex-col items-center gap-2 px-3 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:items-end sm:px-0"
      role="region"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => {
        const tone = TONES[toast.tone] ?? TONES.info
        const Icon = tone.icon
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 overflow-hidden rounded-2xl border px-4 py-3 shadow-soft backdrop-blur-md animate-fade-in-up ${tone.accent}`}
          >
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${tone.iconWrap}`}>
              <Icon className="h-4.5 w-4.5" strokeWidth={2.2} />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-sm font-semibold text-slate-800">{toast.title}</p>
              {toast.description && (
                <p className="mt-0.5 text-xs text-slate-500">{toast.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label={t('toast.dismiss')}
              className="-mr-1 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
