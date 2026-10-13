import { Minus, Plus } from 'lucide-react'
import { useLanguage } from '../../i18n/LanguageContext.jsx'

/**
 * Compact quantity stepper used on inventory cards and in the add/edit form.
 * Never goes below 1.
 */
export function QuantityStepper({ value, onChange, unitLabel, size = 'md' }) {
  const { t } = useLanguage()
  const numeric = Number(value) || 1

  const sizes = {
    sm: 'h-7 w-7',
    md: 'h-8 w-8',
  }
  const text = { sm: 'text-xs', md: 'text-sm' }

  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white/80 p-1">
      <button
        type="button"
        aria-label={t('item.decrease')}
        onClick={() => onChange(Math.max(1, numeric - 1))}
        disabled={numeric <= 1}
        className={`flex items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:opacity-40 disabled:hover:bg-transparent ${sizes[size]}`}
      >
        <Minus className="h-3.5 w-3.5" strokeWidth={2.5} />
      </button>
      <span className={`min-w-9 text-center font-semibold tabular-nums text-slate-700 ${text[size]}`}>
        {numeric}
        {unitLabel ? <span className="ml-0.5 font-normal text-slate-400">{unitLabel}</span> : null}
      </span>
      <button
        type="button"
        aria-label={t('item.increase')}
        onClick={() => onChange(numeric + 1)}
        className={`flex items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 ${sizes[size]}`}
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
      </button>
    </div>
  )
}
