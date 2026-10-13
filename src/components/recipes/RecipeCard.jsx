import { useState } from 'react'
import {
  Beef,
  CakeSlice,
  ChevronDown,
  CookingPot,
  Cookie,
  CupSoda,
  Egg,
  Fish,
  Flame,
  ListChecks,
  Salad,
  Sandwich,
  Soup,
  Sparkles,
  Timer,
  TriangleAlert,
  Utensils,
} from 'lucide-react'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { getCategoryIcon } from '../../constants/categories.js'
import { ProductThumb } from '../ui/ProductThumb.jsx'
import { DaysLeft } from '../inventory/DaysLeft.jsx'

/** Map the `icon` key from a template to a real lucide component. */
const ICONS = {
  egg: Egg,
  cookie: Cookie,
  sandwich: Sandwich,
  soup: Soup,
  salad: Salad,
  cup: CupSoda,
  meat: Beef,
  fish: Fish,
  cake: CakeSlice,
  pot: CookingPot,
  utensils: Utensils,
  sparkles: Sparkles,
}

const DIFFICULTY_TONES = {
  easy: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  hard: 'bg-rose-50 text-rose-700 border-rose-200',
}

/**
 * A single recipe suggestion.
 *
 * Shows the localized title, time/servings/difficulty, the expiring items it
 * consumes (with thumbnails + days-left), the ingredients and a collapsible
 * step list.
 */
export function RecipeCard({ recipe, index = 0 }) {
  const { t, lang } = useLanguage()
  const [open, setOpen] = useState(index === 0)

  const { template, usedItems = [], matchPercent, generic } = recipe
  const Icon = ICONS[template.icon] ?? Utensils

  const title = template.title[lang] ?? template.title.uz
  const ingredients = template.ingredients[lang] ?? template.ingredients.uz
  const steps = template.steps[lang] ?? template.steps.uz
  const difficultyKey = `difficulty.${template.difficulty}`

  return (
    <article
      style={{ animationDelay: `${Math.min(index, 6) * 70}ms` }}
      className={`flex flex-col overflow-hidden rounded-2xl border bg-white/85 shadow-soft backdrop-blur-md transition duration-300 animate-fade-in-up hover:-translate-y-0.5 hover:shadow-xl ${
        generic ? 'border-slate-200/70' : 'border-violet-200/70'
      }`}
    >
      {/* Header */}
      <div
        className={`relative px-5 pt-5 pb-4 ${
          generic
            ? 'bg-gradient-to-br from-slate-50 to-white'
            : 'bg-gradient-to-br from-violet-50 via-white to-fuchsia-50/60'
        }`}
      >
        <div className="flex items-start gap-3">
          <span
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg ${
              generic
                ? 'bg-gradient-to-br from-slate-500 to-slate-600 shadow-slate-500/20'
                : 'bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-violet-500/25'
            }`}
          >
            <Icon className="h-6 w-6" strokeWidth={1.9} />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-600 ring-1 ring-violet-200">
                <Sparkles className="h-3 w-3" />
                {generic ? t('recipes.generic') : t('recipes.aiBadge')}
              </span>
              {matchPercent != null && (
                <span className="text-[11px] font-bold text-violet-600">
                  {matchPercent}% {t('recipes.match')}
                </span>
              )}
            </div>

            <h3 className="mt-1.5 text-balance text-base font-bold leading-snug text-slate-900">
              <span className="mr-1">{template.emoji}</span>
              {title}
            </h3>
          </div>
        </div>

        {/* Meta row */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-semibold">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 text-slate-600 ring-1 ring-white/70">
            <Timer className="h-3.5 w-3.5 text-slate-400" />
            {t('recipes.time', { n: template.time })}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 text-slate-600 ring-1 ring-white/70">
            <Utensils className="h-3.5 w-3.5 text-slate-400" />
            {t('recipes.servings', { n: template.servings })}
          </span>
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${DIFFICULTY_TONES[template.difficulty]}`}>
            <Flame className="h-3.5 w-3.5" />
            {t(difficultyKey)}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 px-5 py-4">
        {/* Items consumed */}
        {usedItems.length > 0 && (
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">
              {t('recipes.uses')}
            </p>
            <ul className="flex flex-wrap gap-2">
              {usedItems.map((item) => {
                const ItemIcon = getCategoryIcon(item.category)
                return (
                  <li
                    key={item.id}
                    className="inline-flex max-w-full items-center gap-2 rounded-xl border border-white/70 bg-white/80 px-2 py-1.5 shadow-sm"
                  >
                    <ProductThumb
                      src={item.product?.image}
                      alt={t('item.imageAlt', { name: item.name })}
                      fallbackIcon={ItemIcon}
                      size="sm"
                      className="h-7 w-7 rounded-lg"
                    />
                    <span className="min-w-0">
                      <span className="block max-w-32 truncate text-xs font-semibold text-slate-700">
                        {item.name}
                      </span>
                      {item.daysLeft != null && (
                        <DaysLeft
                          expiryDate={item.expiryDate}
                          status={item.status ?? 'fresh'}
                          showIcon={false}
                          className="text-[10px]"
                        />
                      )}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {/* Why this fits */}
        {!generic && usedItems.length > 0 && (
          <div className="flex items-start gap-2 rounded-xl bg-violet-50/70 px-3 py-2.5">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-500" />
            <p className="text-[11px] leading-relaxed text-violet-900/80">
              {t('recipes.whyDetail', { items: usedItems.map((item) => item.name).join(', ') })}
            </p>
          </div>
        )}

        {/* Ingredients */}
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
            <ListChecks className="h-3.5 w-3.5" />
            {t('recipes.ingredients')}
          </p>
          <ul className="space-y-1.5">
            {ingredients.map((ingredient) => (
              <li key={ingredient} className="flex items-start gap-2 text-xs text-slate-600">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                <span>{ingredient}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Steps (collapsible) */}
        <div className="mt-auto">
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            aria-expanded={open}
            className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white/70 px-3.5 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-white"
          >
            <span className="flex items-center gap-1.5">
              <CookingPot className="h-4 w-4 text-emerald-600" />
              {open ? t('recipes.hideSteps') : t('recipes.showSteps')}
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
          </button>

          {open && (
            <ol className="mt-3 space-y-2.5 animate-fade-in">
              {steps.map((step, stepIndex) => (
                <li key={step} className="flex items-start gap-2.5 text-xs leading-relaxed text-slate-600">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">
                    {stepIndex + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      {generic && (
        <p className="flex items-center gap-2 border-t border-slate-100 bg-amber-50/60 px-5 py-2.5 text-[11px] font-medium text-amber-800">
          <TriangleAlert className="h-3.5 w-3.5" />
          {t('recipes.genericHint')}
        </p>
      )}
    </article>
  )
}
