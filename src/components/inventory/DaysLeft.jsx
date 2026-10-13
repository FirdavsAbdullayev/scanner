import { Clock } from 'lucide-react'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { describeDaysLeft } from '../../utils/dateUtils.js'
import { getStatusStyle } from '../../constants/categories.js'

/**
 * Localized "3 days left" / "Expires today" / "Expired 2 days ago" text,
 * tinted by the computed status.
 */
export function DaysLeft({ expiryDate, status, showIcon = true, className = '' }) {
  const { t } = useLanguage()
  const { key, vars } = describeDaysLeft(expiryDate)
  const style = getStatusStyle(status)

  return (
    <span className={`inline-flex items-center gap-1 font-semibold ${style.text} ${className}`}>
      {showIcon && <Clock className="h-3.5 w-3.5" strokeWidth={2.2} />}
      {t(key, vars)}
    </span>
  )
}
