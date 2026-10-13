import { CircleCheck, Package, TriangleAlert, CircleX } from 'lucide-react'
import { StatCard } from './StatCard.jsx'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { useInventoryContext } from '../../context/InventoryContext.jsx'
import { useUI, VIEWS } from '../../context/UIContext.jsx'

/**
 * The four headline metrics. "Expiring soon" and "Expired" act as filters —
 * clicking them jumps to the inventory pre-filtered by status.
 */
export function DashboardStats() {
  const { t } = useLanguage()
  const { stats } = useInventoryContext()
  const { setView, setStatusFilter } = useUI()

  const goTo = (status) => {
    setStatusFilter(status)
    setView(VIEWS.INVENTORY)
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      <StatCard
        icon={Package}
        label={t('stats.total')}
        value={stats.total}
        hint={t('stats.totalHint')}
        accent="slate"
        onClick={() => goTo('all')}
      />
      <StatCard
        icon={CircleCheck}
        label={t('stats.fresh')}
        value={stats.fresh}
        hint={t('stats.ofTotal', { n: stats.total })}
        accent="emerald"
        total={stats.total}
        onClick={() => goTo('fresh')}
      />
      <StatCard
        icon={TriangleAlert}
        label={t('stats.expiringSoon')}
        value={stats.expiringSoon}
        hint={t('stats.expiringSoonHint')}
        accent="amber"
        alert
        onClick={() => goTo('expiringSoon')}
      />
      <StatCard
        icon={CircleX}
        label={t('stats.expired')}
        value={stats.expired}
        hint={t('stats.expiredHint')}
        accent="rose"
        onClick={() => goTo('expired')}
      />
    </div>
  )
}
