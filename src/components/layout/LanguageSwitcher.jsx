import { Languages } from 'lucide-react'
import { useLanguage } from '../../i18n/LanguageContext.jsx'

/**
 * Segmented EN / UZ / RU control.
 * Renders as compact pills in the header and as a full row in the drawer.
 */
export function LanguageSwitcher({ variant = 'pills' }) {
  const { lang, setLang, languages, t } = useLanguage()

  if (variant === 'stacked') {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          <Languages className="h-3.5 w-3.5" />
          {t('lang.label')}
        </div>
        <div className="flex flex-col gap-1">
          {languages.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => setLang(l.code)}
              aria-current={lang === l.code ? 'true' : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                lang === l.code
                  ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="text-base leading-none">{l.flag}</span>
              <span className="flex-1 text-left">{l.label}</span>
              {lang === l.code && <span className="h-2 w-2 rounded-full bg-emerald-500" />}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div
      className="relative flex items-center gap-0.5 rounded-full border border-white/60 bg-white/70 p-0.5 backdrop-blur-md"
      role="group"
      aria-label={t('lang.label')}
    >
      {languages.map((l) => {
        const active = lang === l.code
        return (
          <button
            key={l.code}
            type="button"
            onClick={() => setLang(l.code)}
            aria-pressed={active}
            title={l.label}
            className={`rounded-full px-2 py-1 text-[11px] font-bold tracking-wide transition sm:px-2.5 sm:text-xs ${
              active
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm'
                : 'text-slate-500 hover:bg-white hover:text-slate-700'
            }`}
          >
            {l.short}
          </button>
        )
      })}
    </div>
  )
}
