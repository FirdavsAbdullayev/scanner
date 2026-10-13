import { useMemo } from 'react'
import { CalendarDays, CircleX } from 'lucide-react'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { useInventoryContext } from '../../context/InventoryContext.jsx'
import { nextDays } from '../../utils/dateUtils.js'

/**
 * Seven-day forecast: how many items expire on each of the next 7 days.
 * Bars are scaled to the busiest day; today gets an emerald highlight.
 */
export function ExpiryTimeline() {
  const { t, formatWeekday, formatDate } = useLanguage()
  const { activeItems, stats } = useInventoryContext()

  const days = useMemo(() => {
    const window = nextDays(7)
    const counts = window.map((iso) => ({
      iso,
      count: activeItems.filter((item) => item.expiryDate === iso).length,
    }))
    const max = Math.max(1, ...counts.map((c) => c.count))
    return counts.map((entry, index) => ({ ...entry, max, isToday: index === 0, index }))
  }, [activeItems])

  const total = days.reduce((sum, day) => sum + day.count, 0)

  return (
    <section className="glass rounded-2xl p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <CalendarDays className="h-4 w-4 text-emerald-600" />
            {t('dashboard.timeline')}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">{t('dashboard.timelineHint')}</p>
        </div>
        {stats.expired > 0 && (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-600">
            <CircleX className="h-3.5 w-3.5" />
            {stats.expired} · {t('status.expired')}
          </span>
        )}
      </div>

      {total === 0 && stats.expired === 0 ? (
        <p className="mt-6 rounded-xl bg-emerald-50/70 px-4 py-6 text-center text-sm font-medium text-emerald-700">
          {t('dashboard.allFresh')}
        </p>
      ) : (
        <div className="mt-5 flex items-end justify-between gap-1.5 sm:gap-2.5">
          {days.map((day) => {
            const height = day.count === 0 ? 6 : Math.max(14, Math.round((day.count / day.max) * 76))
            return (
              <div key={day.iso} className="group flex flex-1 flex-col items-center gap-2">
                <span
                  className={`text-[11px] font-bold tabular-nums ${
                    day.count === 0 ? 'text-slate-300' : 'text-slate-600'
                  }`}
                >
                  {day.count}
                </span>

                <div className="relative flex h-20 w-full items-end justify-center">
                  <div
                    title={`${formatDate(day.iso)} — ${day.count}`}
                    style={{ height: `${height}px` }}
                    className={`w-full max-w-8 rounded-t-lg transition-all duration-500 ease-out ${
                      day.count === 0
                        ? 'bg-slate-200/80'
                        : day.isToday
                          ? 'bg-gradient-to-t from-amber-500 to-amber-400 shadow-sm shadow-amber-500/30'
                          : 'bg-gradient-to-t from-emerald-500 to-teal-400 group-hover:brightness-110'
                    }`}
                  />
                </div>

                <div className="text-center leading-tight">
                  <p
                    className={`text-[10px] font-semibold ${
                      day.isToday ? 'text-amber-600' : 'text-slate-400'
                    }`}
                  >
                    {day.index === 0 ? t('dashboard.today') : formatWeekday(day.iso).replace('.', '')}
                  </p>
                  <p className="text-[9px] tabular-nums text-slate-300">
                    {day.iso.slice(8, 10)}.{day.iso.slice(5, 7)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
