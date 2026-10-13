import { Barcode, CircleCheck, Hash, MapPin, Pencil, Trash, Undo2 } from 'lucide-react'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { useInventoryContext } from '../../context/InventoryContext.jsx'
import { useUI } from '../../context/UIContext.jsx'
import { getCategoryIcon, getUnitLabel } from '../../constants/categories.js'
import { ProductThumb } from '../ui/ProductThumb.jsx'
import { Chip, StatusPill } from '../ui/Badge.jsx'
import { DaysLeft } from './DaysLeft.jsx'
import { QuantityStepper } from '../ui/QuantityStepper.jsx'

/**
 * A single inventory product.
 *
 * Behaviour:
 *  - consumed rows render muted, without the status pill
 *  - actions stay visible on touch devices and fade in on hover (desktop)
 *  - the quantity stepper writes straight through to the inventory context
 */
export function ItemCard({ item, index = 0 }) {
  const { t, formatDate } = useLanguage()
  const { setQuantity, consumeItem } = useInventoryContext()
  const { openEditItem, requestDelete } = useUI()

  const categoryIcon = getCategoryIcon(item.category)
  const isConsumed = item.consumed
  const status = item.status ?? 'fresh'

  return (
    <article
      style={{ animationDelay: `${Math.min(index, 12) * 35}ms` }}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-white/80 p-4 shadow-soft backdrop-blur-md transition duration-300 animate-fade-in-up ${
        isConsumed
          ? 'border-slate-200/70 opacity-70'
          : status === 'expired'
            ? 'border-rose-200/80 hover:border-rose-300'
            : status === 'expiringSoon'
              ? 'border-amber-200/80 hover:border-amber-300'
              : 'border-white/60 hover:border-emerald-300'
      } hover:-translate-y-0.5 hover:shadow-xl`}
    >
      {/* Coloured status strip */}
      {!isConsumed && (
        <span
          aria-hidden="true"
          className={`absolute inset-x-0 top-0 h-1 ${
            status === 'expired'
              ? 'bg-gradient-to-r from-rose-500 to-red-500'
              : status === 'expiringSoon'
                ? 'bg-gradient-to-r from-amber-500 to-orange-400'
                : 'bg-gradient-to-r from-emerald-500 to-teal-500'
          }`}
        />
      )}

      <div className="flex items-start gap-3.5 pt-1">
        <ProductThumb
          src={item.product?.image}
          alt={t('item.imageAlt', { name: item.name })}
          fallbackIcon={categoryIcon}
          size="lg"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-bold leading-snug text-slate-900" title={item.name}>
                {item.name}
              </h3>
              {item.product?.brand && (
                <p className="truncate text-[11px] font-medium text-slate-400">{item.product.brand}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex shrink-0 items-center gap-0.5 opacity-100 transition lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100">
              <IconBtn
                label={isConsumed ? t('item.undo') : t('item.markConsumed')}
                icon={isConsumed ? Undo2 : CircleCheck}
                onClick={() => consumeItem(item.id)}
                tone="emerald"
              />
              <IconBtn label={t('item.edit')} icon={Pencil} onClick={() => openEditItem(item)} tone="slate" />
              <IconBtn label={t('item.delete')} icon={Trash} onClick={() => requestDelete(item)} tone="rose" />
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {isConsumed ? (
              <StatusPill status="consumed" size="sm" />
            ) : (
              <StatusPill status={status} size="sm" />
            )}
            <Chip icon={MapPin} title={t('item.location')}>
              <span className="max-w-24 truncate">{item.location || '—'}</span>
            </Chip>
          </div>
        </div>
      </div>

      {/* Status detail */}
      {!isConsumed && (
        <div
          className={`mt-3 flex items-center justify-between gap-2 rounded-xl px-3 py-2 ${
            status === 'expired'
              ? 'bg-rose-50'
              : status === 'expiringSoon'
                ? 'bg-amber-50'
                : 'bg-emerald-50'
          }`}
        >
          <DaysLeft expiryDate={item.expiryDate} status={status} className="text-xs" />
          <span className="text-[11px] font-medium text-slate-500">{formatDate(item.expiryDate)}</span>
        </div>
      )}

      {isConsumed && (
        <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2">
          <span className="text-[11px] font-medium text-slate-400">
            {t('item.expiry')}: {formatDate(item.expiryDate)}
          </span>
        </div>
      )}

      {/* Footer: meta + quantity */}
      <div className="mt-auto flex items-center justify-between gap-2 pt-3">
        <div className="flex min-w-0 items-center gap-1.5">
          {(item.barcode || item.product?.barcode) && (
            <Chip icon={Barcode} title={item.product?.barcode || item.barcode} className="max-w-28">
              <span className="truncate font-mono text-[10px]">{item.product?.barcode || item.barcode}</span>
            </Chip>
          )}
          {item.product && (
            <Chip icon={Hash} title={t('item.fromOff')} className="bg-emerald-50 text-emerald-600">
              <span className="truncate">{item.product.categories?.[0] ?? t('item.fromOff')}</span>
            </Chip>
          )}
        </div>

        {!isConsumed && (
          <QuantityStepper
            value={item.quantity}
            onChange={(next) => setQuantity(item.id, next)}
            unitLabel={t(getUnitLabel(item.unit))}
            size="sm"
          />
        )}
      </div>
    </article>
  )
}

const TONES = {
  emerald: 'hover:bg-emerald-50 hover:text-emerald-600',
  rose: 'hover:bg-rose-50 hover:text-rose-600',
  slate: 'hover:bg-slate-100 hover:text-slate-700',
}

function IconBtn({ label, icon: Icon, onClick, tone = 'slate' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition ${TONES[tone]}`}
    >
      <Icon className="h-4 w-4" strokeWidth={2.1} />
    </button>
  )
}
