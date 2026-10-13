import { useCallback, useEffect, useRef, useState } from 'react'
import { ChefHat, CircleAlert, Plus, RefreshCw, Sparkles, TriangleAlert, WandSparkles } from 'lucide-react'
import { RecipeCard } from './RecipeCard.jsx'
import { AnalyzingLoader } from './AnalyzingLoader.jsx'
import { EmptyState } from '../ui/EmptyState.jsx'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { useInventoryContext } from '../../context/InventoryContext.jsx'
import { useUI } from '../../context/UIContext.jsx'
import { generateRecipes } from '../../recipes/recipeEngine.js'
import { getCategoryIcon } from '../../constants/categories.js'
import { ProductThumb } from '../ui/ProductThumb.jsx'
import { DaysLeft } from '../inventory/DaysLeft.jsx'

/**
 * Smart Kitchen page.
 *
 * The user hits one button; we run a short staged "analysis" animation and then
 * render 2–3 recipe suggestions built from the items that expire soonest.
 */
export function RecipesView() {
  const { t, lang } = useLanguage()
  const { usableForRecipes, expiringSoon } = useInventoryContext()
  const { openAddItem } = useUI()

  const [result, setResult] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const variantRef = useRef(0)
  const timerRef = useRef(null)

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const run = useCallback(
    (freshRun = true) => {
      if (analyzing) return
      // A brand-new run starts from the strongest matches; "more recipes"
      // rotates the ranking so the suggestions actually change.
      const offset = freshRun ? 0 : variantRef.current * 3
      if (freshRun) variantRef.current = 0

      setAnalyzing(true)
      setResult(null)
      // A deliberate beat so the staged loader is visible — the computation
      // itself is synchronous and instant.
      timerRef.current = setTimeout(() => {
        setResult(generateRecipes(usableForRecipes, lang, { offset }))
        variantRef.current += 1
        setAnalyzing(false)
      }, 1900)
    },
    [analyzing, usableForRecipes, lang],
  )

  const watchItems = expiringSoon.filter((item) => item.status === 'expiringSoon').slice(0, 6)
  const hasEdibleItems = usableForRecipes.length > 0

  return (
    <div className="space-y-5">
      {/* Hero / trigger */}
      <section className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/80 p-5 shadow-soft backdrop-blur-md sm:p-6">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-gradient-to-br from-violet-300/40 to-fuchsia-300/20 blur-3xl"
        />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-violet-600 ring-1 ring-violet-200">
              <WandSparkles className="h-3.5 w-3.5" />
              {t('recipes.aiBadge')}
            </span>
            <h2 className="mt-3 text-balance text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
              {t('recipes.subtitle')}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">{t('recipes.tip')}</p>
          </div>

          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => run(!result)}
              disabled={analyzing || !hasEdibleItems}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-3.5 text-sm font-bold text-white shadow-xl shadow-violet-500/25 transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {result ? <RefreshCw className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
              {result ? t('recipes.regenerate') : t('recipes.generate')}
            </button>
            <button
              type="button"
              onClick={() => openAddItem()}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/60 bg-white/80 px-5 py-3.5 text-sm font-semibold text-slate-600 backdrop-blur-md transition hover:bg-white"
            >
              <Plus className="h-4 w-4" strokeWidth={2.6} />
              {t('inventory.add')}
            </button>
          </div>
        </div>

        {/* Watch strip */}
        <div className="relative mt-5 border-t border-white/60 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
              <TriangleAlert className="h-3.5 w-3.5 text-amber-500" />
              {t('recipes.watchTitle')}
            </span>

            {watchItems.length === 0 ? (
              <span className="text-xs text-slate-400">{t('recipes.watchEmpty')}</span>
            ) : (
              watchItems.map((item) => {
                const ItemIcon = getCategoryIcon(item.category)
                return (
                  <span
                    key={item.id}
                    className="inline-flex max-w-full items-center gap-2 rounded-xl border border-amber-200/70 bg-amber-50/70 px-2 py-1"
                  >
                    <ProductThumb
                      src={item.product?.image}
                      alt={t('item.imageAlt', { name: item.name })}
                      fallbackIcon={ItemIcon}
                      size="sm"
                      className="h-6 w-6 rounded-md"
                    />
                    <span className="max-w-28 truncate text-[11px] font-semibold text-amber-900">{item.name}</span>
                    <DaysLeft expiryDate={item.expiryDate} status={item.status} showIcon={false} className="text-[10px]" />
                  </span>
                )
              })
            )}
          </div>
        </div>
      </section>

      {/* Results */}
      {analyzing && <AnalyzingLoader />}

      {!analyzing && !result && hasEdibleItems && (
        <div className="glass rounded-2xl shadow-soft">
          <EmptyState
            icon={ChefHat}
            tone="violet"
            title={t('recipes.generate')}
            description={t('recipes.subtitle')}
            actions={
              <button
                type="button"
                onClick={() => run(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:brightness-110"
              >
                <Sparkles className="h-4 w-4" />
                {t('recipes.generate')}
              </button>
            }
          />
        </div>
      )}

      {!analyzing && !result && !hasEdibleItems && (
        <div className="glass rounded-2xl shadow-soft">
          <EmptyState
            icon={ChefHat}
            tone="violet"
            title={t('recipes.noItems.title')}
            description={t('recipes.noItems.text')}
            actions={
              <button
                type="button"
                onClick={() => openAddItem()}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:brightness-110"
              >
                <Plus className="h-4 w-4" strokeWidth={2.6} />
                {t('inventory.add')}
              </button>
            }
          />
        </div>
      )}

      {!analyzing && result && (
        <>
          {result.pool.length === 0 ? (
            <div className="glass rounded-2xl shadow-soft">
              <EmptyState
                icon={Sparkles}
                title={t('recipes.empty.title')}
                description={t('recipes.empty.text')}
              />
            </div>
          ) : (
            <>
              {/* Analysis summary */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-2xl border border-white/60 bg-white/70 px-4 py-3 backdrop-blur-md">
                <p className="text-xs font-bold text-slate-700">
                  {t('recipes.count', { n: result.recipes.length })}
                </p>
                <p className="text-[11px] text-slate-400">
                  {t('recipes.basedOn')}: {result.pool.length}
                </p>
                {result.usedFallbackPool && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-600">
                    <CircleAlert className="h-3.5 w-3.5" />
                    {t('recipes.watchEmpty')} — {t('recipes.tip')}
                  </span>
                )}
                <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] text-slate-400">
                  <CircleAlert className="h-3.5 w-3.5" />
                  {t('recipes.pantryNote')}
                </span>
              </div>

              <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {result.recipes.map((recipe, index) => (
                  <RecipeCard key={recipe.id} recipe={recipe} index={index} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
