import { useMemo } from 'react'
import { Database, ScanSearch, Sparkles } from 'lucide-react'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { LookupNotice, BarcodeMeta } from './ProductPreview.jsx'
import { analyzeBarcode } from '../../services/barcodeInfo.js'

/**
 * Shown when no open database knows the code.
 *
 * The promise of "collect information about any barcode" still holds here: the
 * barcode itself is analysed offline (symbology, GS1 country of origin, check
 * digit) and the app offers to add — and *remember* — the product, so the next
 * scan of that code resolves instantly.
 *
 * @param {object} props
 * @param {string} props.code
 * @param {string[]} [props.checked]      ids of the databases that were queried
 * @param {'warning'|'error'} [props.tone]
 * @param {string} [props.title]
 * @param {string} [props.description]
 * @param {React.ReactNode} [props.actions]
 */
export function BarcodeProfile({ code, checked = [], tone = 'warning', title, description, actions }) {
  const { t } = useLanguage()
  const info = useMemo(() => analyzeBarcode(code), [code])

  if (!info) {
    return title ? <LookupNotice tone={tone} title={title} description={description} /> : null
  }

  return (
    <div className="space-y-3">
      {title && <LookupNotice tone={tone} title={title} description={description} />}

      <div className="overflow-hidden rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/90 to-teal-50/60 p-4">
        <div className="flex items-center gap-2">
          <ScanSearch className="h-4 w-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-800">{t('barcode.profile')}</h3>
        </div>

        <p className="mt-2 font-mono text-lg font-semibold tracking-wide text-slate-800">{info.code}</p>

        <BarcodeMeta info={info} className="mt-2.5" />

        {info.restricted && (
          <p className="mt-3 rounded-xl bg-amber-50 px-2.5 py-2 text-[11px] font-medium text-amber-700 ring-1 ring-amber-100">
            {t('barcode.internalHint')}
          </p>
        )}

        {checked.length > 0 && (
          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
            <Database className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            {t('barcode.checkedSources', { n: checked.length })}
          </p>
        )}

        <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-emerald-700">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {t('barcode.rememberHint')}
        </p>

        {actions && <div className="mt-3.5 flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  )
}
