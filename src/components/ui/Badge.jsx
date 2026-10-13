import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { getStatusStyle } from '../../constants/categories.js'

/**
 * Small pill showing a computed status (fresh / expiring soon / expired / consumed).
 * Renders a coloured dot plus the localized label.
 */
export function StatusPill({ status, size = 'md', className = '' }) {
  const { t } = useLanguage()
  const style = getStatusStyle(status)

  const sizes = {
    sm: 'px-2 py-0.5 text-[11px] gap-1.5',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2',
  }
  const dotSizes = { sm: 'h-1.5 w-1.5', md: 'h-1.5 w-1.5', lg: 'h-2 w-2' }

  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold ${style.bg} ${style.text} ${style.border} ${sizes[size]} ${className}`}
    >
      <span className={`rounded-full ${style.dot} ${dotSizes[size]} ${status === 'expiringSoon' ? 'animate-pulse' : ''}`} />
      {t(style.label)}
    </span>
  )
}

/** Neutral, dashed-free chip used for category / location / barcode metadata. */
export function Chip({ children, icon: Icon, className = '', title }) {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1.5 rounded-full bg-slate-100/80 px-2.5 py-1 text-[11px] font-medium text-slate-600 ${className}`}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {children}
    </span>
  )
}
