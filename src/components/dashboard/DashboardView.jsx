import { useMemo } from 'react'
import { Gauge, Plus, Sparkles, TrendingUp, TriangleAlert } from 'lucide-react'
import { DashboardStats } from './DashboardStats.jsx'
import { ExpiryTimeline } from './ExpiryTimeline.jsx'
import { CategoryBreakdown } from './CategoryBreakdown.jsx'
import { AttentionList } from './AttentionList.jsx'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { useInventoryContext } from '../../context/InventoryContext.jsx'
import { useUI, VIEWS } from '../../context/UIContext.jsx'
import { EmptyState } from '../ui/EmptyState.jsx'

/** Landing screen: metrics, 7-day forecast, per-category status and alerts. */
export function DashboardView() {
  const { t, formatDate } = useLanguage()
  const { items, byUrgency, stats, usableForRecipes } = useInventoryContext()
  const { setView, openAddItem, loadDemoData } = useUI()

  const insights = useMemo(() => {
    const soonest = byUrgency[0] ?? null
    const expiringCount = usableForRecipes.filter((item) => item.status === 'expiringSoon').length
    return { soonest, expiringCount }
  }, [byUrgency, usableForRecipes])

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="glass rounded-3xl shadow-soft">
          <EmptyState
            icon={Sparkles}
            title={t('dashboard.noItems')}
            description={t('dashboard.noItemsHint')}
            actions={
              <>
                <button
                  type="button"
                  onClick={() => openAddItem()}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:brightness-110"
                >
                  <Plus className="h-4 w-4" strokeWidth={2.5} />
                  {t('inventory.add')}
                </button>
                <button
                  type="button"
                  onClick={loadDemoData}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  {t('common.reset')}
                </button>
              </>
            }
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <DashboardStats />

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <ExpiryTimeline />

          {/* Insight strip */}
          <div className="grid gap-3 sm:grid-cols-2">
            <InsightCard
              icon={Gauge}
              tone="emerald"
              label={t('dashboard.insight.closest')}
              value={insights.soonest ? insights.soonest.name : t('dashboard.insight.none')}
              meta={insights.soonest ? formatDate(insights.soonest.expiryDate) : ''}
            />
            <InsightCard
              icon={TrendingUp}
              tone="violet"
              label={t('recipes.watchTitle')}
              value={t('recipes.count', { n: insights.expiringCount })}
              meta={t('recipes.subtitle')}
              action={{ label: t('nav.recipes'), onClick: () => setView(VIEWS.RECIPES) }}
            />
          </div>
        </div>

        <div className="space-y-5">
          <AttentionList />

          {/* Alert banner */}
          {stats.expired > 0 && (
            <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 backdrop-blur-md">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                <TriangleAlert className="h-4.5 w-4.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-rose-800">
                  {t('stats.itemsNeedAttention', { n: stats.expired })}
                </p>
                <p className="mt-0.5 text-xs text-rose-600">{t('stats.expiredHint')}</p>
                <button
                  type="button"
                  onClick={() => setView(VIEWS.INVENTORY)}
                  className="mt-2 text-xs font-bold text-rose-700 underline underline-offset-2 hover:text-rose-800"
                >
                  {t('dashboard.viewAll')}
                </button>
              </div>
            </div>
          )}

          <CategoryBreakdown />
        </div>
      </div>
    </div>
  )
}

const TONES = {
  emerald: 'bg-emerald-100 text-emerald-600',
  violet: 'bg-violet-100 text-violet-600',
}

function InsightCard({ icon: Icon, label, value, meta, tone = 'emerald', action }) {
  return (
    <div className="glass rounded-2xl p-4 shadow-soft">
      <div className="flex items-center gap-2">
        <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${TONES[tone]}`}>
          <Icon className="h-4 w-4" strokeWidth={2.1} />
        </span>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      </div>
      <p className="mt-2.5 truncate text-sm font-bold text-slate-800">{value}</p>
      {meta && <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-slate-400">{meta}</p>}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-2 text-[11px] font-bold text-emerald-600 underline underline-offset-2 transition hover:text-emerald-700"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
