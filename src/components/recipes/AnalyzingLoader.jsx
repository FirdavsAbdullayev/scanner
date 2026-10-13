import { useEffect, useState } from 'react'
import { Brain, LoaderCircle } from 'lucide-react'
import { useLanguage } from '../../i18n/LanguageContext.jsx'

const STEP_KEYS = ['recipes.analyzing1', 'recipes.analyzing2', 'recipes.analyzing3', 'recipes.analyzing4']

/**
 * Staged "AI is thinking" loader. Cycles through the pipeline messages so the
 * (instant) computation feels like real analysis — and doubles as a shimmer
 * skeleton for the cards that are about to appear.
 */
export function AnalyzingLoader() {
  const { t } = useLanguage()
  const [step, setStep] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setStep((prev) => (prev + 1) % STEP_KEYS.length), 620)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="space-y-4">
      <div className="glass flex items-center gap-3.5 rounded-2xl p-4 shadow-soft">
        <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25">
          <Brain className="h-5 w-5" />
          <span className="absolute inset-0 animate-ping rounded-2xl bg-violet-400/40" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-800">{t('recipes.analyzing')}</p>
          <p className="mt-0.5 text-xs text-slate-500">{t(STEP_KEYS[step])}</p>
        </div>
        <LoaderCircle className="h-5 w-5 animate-spin text-violet-500" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <div key={index} className="glass space-y-3 rounded-2xl p-5 shadow-soft">
            <div className="h-5 w-2/3 rounded-full bg-slate-200 animate-shimmer" />
            <div className="h-3 w-1/3 rounded-full bg-slate-200 animate-shimmer" />
            <div className="h-24 rounded-xl bg-slate-100 animate-shimmer" />
            <div className="space-y-2">
              <div className="h-3 w-full rounded-full bg-slate-200 animate-shimmer" />
              <div className="h-3 w-5/6 rounded-full bg-slate-200 animate-shimmer" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
