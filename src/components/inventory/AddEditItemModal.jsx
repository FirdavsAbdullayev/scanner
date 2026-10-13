import { useEffect, useMemo, useState } from 'react'
import {
  Barcode,
  CalendarDays,
  Camera,
  Check,
  CircleAlert,
  Hash,
  LoaderCircle,
  MapPin,
  Package,
  Search,
  Trash,
  X,
} from 'lucide-react'
import { Modal } from '../ui/Modal.jsx'
import { ScannerModal } from '../barcode/ScannerModal.jsx'
import { ProductPreview, LookupNotice } from '../barcode/ProductPreview.jsx'
import { ProductThumb } from '../ui/ProductThumb.jsx'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { useUI } from '../../context/UIContext.jsx'
import { useInventoryContext } from '../../context/InventoryContext.jsx'
import {
  CATEGORIES,
  DEFAULT_UNIT,
  DEFAULT_UNIT_BY_CATEGORY,
  UNITS,
  getCategoryIcon,
} from '../../constants/categories.js'
import { addDays, getStatus, toDateInputValue } from '../../utils/dateUtils.js'
import { suggestShelfLife } from '../../services/shelfLife.js'
import { digitsOnly, isValidBarcode } from '../../utils/format.js'
import { StatusPill } from '../ui/Badge.jsx'

const DEFAULT_EXPIRY_OFFSET = 7

const createEmptyForm = () => ({
  name: '',
  category: 'fridge',
  location: '',
  expiryDate: addDays(DEFAULT_EXPIRY_OFFSET),
  quantity: 1,
  unit: DEFAULT_UNIT_BY_CATEGORY.fridge,
  barcode: '',
})

/**
 * Create / edit product dialog.
 *
 * The same component powers both flows: `editing` switches the copy, the
 * submit button and the icon. A barcode can be typed or scanned, then looked
 * up against Open Food Facts to auto-fill the name and photo.
 */
export function AddEditItemModal({ open, editing, prefill, onClose }) {
  const { t } = useLanguage()
  const { createItem, saveItem, lookupProduct } = useInventoryContext()
  const { requestDelete } = useUI()

  const [form, setForm] = useState(createEmptyForm)
  const [product, setProduct] = useState(null)
  const [lookupState, setLookupState] = useState('idle')
  const [errors, setErrors] = useState({})
  const [scanOpen, setScanOpen] = useState(false)

  // Seed the form whenever the dialog opens (or switches target).
  useEffect(() => {
    if (!open) return
    const source = editing ?? prefill
    if (source) {
      setForm({
        name: source.name ?? '',
        category: source.category ?? 'fridge',
        location: source.location ?? '',
        expiryDate: source.expiryDate ?? addDays(DEFAULT_EXPIRY_OFFSET),
        quantity: source.quantity ?? 1,
        unit: source.unit ?? DEFAULT_UNIT_BY_CATEGORY[source.category ?? 'fridge'] ?? DEFAULT_UNIT,
        barcode: source.barcode ?? '',
      })
      setProduct(source.product ?? null)
    } else {
      setForm(createEmptyForm())
      setProduct(null)
    }
    setErrors({})
    setLookupState('idle')
    setScanOpen(false)
  }, [open, editing, prefill])

  const liveStatus = useMemo(() => (form.expiryDate ? getStatus(form.expiryDate) : null), [form.expiryDate])

  const patch = (changes) => setForm((prev) => ({ ...prev, ...changes }))

  const handleCategory = (category) => {
    setForm((prev) => ({
      ...prev,
      category,
      // Only auto-switch the unit when the user hasn't touched it.
      unit: prev.unit === DEFAULT_UNIT_BY_CATEGORY[prev.category] ? DEFAULT_UNIT_BY_CATEGORY[category] : prev.unit,
    }))
  }

  const handleBarcodeChange = (value) => {
    const code = digitsOnly(value)
    patch({ barcode: code })
    if (product && product.barcode !== code) {
      setProduct(null)
      setLookupState('idle')
    }
  }

  const lookup = async (code) => {
    if (!isValidBarcode(code)) {
      setLookupState('invalid')
      return
    }
    setLookupState('loading')
    try {
      const found = await lookupProduct(code)
      setProduct(found)
      setLookupState('found')
      setForm((prev) => {
        const next = {
          ...prev,
          barcode: found.barcode || prev.barcode,
          // Only fill the name if the user hasn't typed one yet.
          name: prev.name.trim() ? prev.name : found.name,
        }
        // Prefill a typical shelf life (e.g. "5 days after opening") while the
        // user still has the untouched default date.
        const shelfLife = suggestShelfLife(found)
        if (shelfLife && prev.expiryDate === addDays(DEFAULT_EXPIRY_OFFSET)) {
          next.expiryDate = addDays(shelfLife.days)
        }
        return next
      })
    } catch (error) {
      setProduct(null)
      setLookupState(error?.code === 'not_found' ? 'not-found' : error?.code === 'invalid' ? 'invalid' : 'error')
    }
  }

  const validate = () => {
    const next = {}
    if (form.name.trim().length < 2) next.name = t('form.error.name')
    if (!form.expiryDate) next.expiryDate = t('form.error.expiry')
    if (!(Number(form.quantity) > 0)) next.quantity = t('form.error.quantity')
    if (!form.category) next.category = t('form.error.category')
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = (event) => {
    event.preventDefault()
    if (!validate()) return

    const payload = {
      ...form,
      name: form.name.trim(),
      location: form.location.trim(),
      quantity: Number(form.quantity),
      product,
    }

    if (editing) saveItem(editing.id, payload)
    else createItem(payload)

    onClose()
  }

  const Icon = getCategoryIcon(form.category)
  const isBusy = lookupState === 'loading'

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        size="lg"
        title={editing ? t('form.editTitle') : t('form.addTitle')}
        subtitle={editing ? t('form.editSubtitle') : t('form.addSubtitle')}
        icon={editing ? <Package className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            {editing ? (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  requestDelete(editing)
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-100"
              >
                <Trash className="h-4 w-4" />
                {t('item.delete')}
              </button>
            ) : (
              <span className="hidden sm:block" />
            )}

            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                {t('form.cancel')}
              </button>
              <button
                type="submit"
                form="add-edit-item-form"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:brightness-110 active:scale-[0.98]"
              >
                <Check className="h-4 w-4" strokeWidth={2.6} />
                {editing ? t('form.save') : t('form.add')}
              </button>
            </div>
          </div>
        }
      >
        <form id="add-edit-item-form" onSubmit={submit} className="space-y-5" noValidate>
          {/* ── Barcode first: scan or type, then look up ───────────────── */}
          <div className="rounded-2xl border border-white/60 bg-white/60 p-3.5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <label htmlFor="field-barcode" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <Barcode className="h-3.5 w-3.5" />
                {t('form.barcode')}
                <span className="font-normal normal-case text-slate-400">({t('form.optional')})</span>
              </label>
              <span className="text-[10px] text-slate-400">{t('form.lookupHint')}</span>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
                <input
                  id="field-barcode"
                  value={form.barcode}
                  onChange={(event) => handleBarcodeChange(event.target.value)}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder={t('form.barcodePlaceholder')}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-9 font-mono text-sm text-slate-700 transition focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                {form.barcode && (
                  <button
                    type="button"
                    onClick={() => handleBarcodeChange('')}
                    aria-label={t('form.clearBarcode')}
                    className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => lookup(form.barcode)}
                disabled={!isValidBarcode(form.barcode) || isBusy}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                <span className="hidden sm:inline">{isBusy ? t('form.searching') : t('form.lookupShort')}</span>
              </button>

              <button
                type="button"
                onClick={() => setScanOpen(true)}
                title={t('form.scan')}
                aria-label={t('form.scan')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-100"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>

            {form.barcode && !isValidBarcode(form.barcode) && (
              <p className="mt-2 text-xs font-medium text-amber-600">{t('scanner.invalid')}</p>
            )}

            {/* Lookup feedback */}
            <div className="mt-3 space-y-2">
              {lookupState === 'found' && product && (
                <ProductPreview
                  product={product}
                  compact
                  actions={
                    <button
                      type="button"
                      onClick={() => patch({ name: product.name })}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-white/80 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 transition hover:bg-white"
                    >
                      <Check className="h-3.5 w-3.5" />
                      {t('form.useProduct')}
                    </button>
                  }
                />
              )}
              {lookupState === 'not-found' && (
                <LookupNotice tone="warning" title={t('form.notFound')} description={t('form.notFoundHint')} />
              )}
              {lookupState === 'error' && (
                <LookupNotice tone="error" title={t('form.error')} description={t('form.errorHint')} />
              )}
            </div>
          </div>

          {/* ── Name ──────────────────────────────────────────────────────── */}
          <Field label={t('form.name')} required error={errors.name} htmlFor="field-name">
            <div className="flex items-center gap-3">
              <ProductThumb
                src={product?.image}
                alt={t('item.imageAlt', { name: form.name || t('form.name') })}
                fallbackIcon={Icon}
                size="md"
              />
              <input
                id="field-name"
                data-autofocus
                value={form.name}
                onChange={(event) => patch({ name: event.target.value })}
                placeholder={t('form.namePlaceholder')}
                maxLength={80}
                className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-700 transition focus:outline-none focus:ring-2 ${
                  errors.name
                    ? 'border-rose-300 focus:ring-rose-500/20'
                    : 'border-slate-200 focus:border-emerald-300 focus:ring-emerald-500/20'
                }`}
              />
            </div>
          </Field>

          {/* ── Category ──────────────────────────────────────────────────── */}
          <Field label={t('form.category')} required error={errors.category}>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((category) => {
                const CatIcon = category.icon
                const active = form.category === category.id
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleCategory(category.id)}
                    aria-pressed={active}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-center transition ${
                      active
                        ? `${category.accent.border} ${category.accent.bg} ${category.accent.text} shadow-sm`
                        : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <CatIcon className="h-5 w-5" strokeWidth={2.1} />
                    <span className="text-[11px] font-semibold leading-tight">{t(category.labelKey)}</span>
                  </button>
                )
              })}
            </div>
          </Field>

          {/* ── Location + expiry ─────────────────────────────────────────── */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('form.location')} htmlFor="field-location">
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
                <input
                  id="field-location"
                  value={form.location}
                  onChange={(event) => patch({ location: event.target.value })}
                  placeholder={t('form.locationPlaceholder')}
                  maxLength={40}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 transition focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </Field>

            <Field label={t('form.expiry')} required error={errors.expiryDate} htmlFor="field-expiry">
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
                <input
                  id="field-expiry"
                  type="date"
                  value={form.expiryDate}
                  min="2000-01-01"
                  max={addDays(3650)}
                  onChange={(event) => patch({ expiryDate: event.target.value })}
                  className={`w-full rounded-xl border bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 transition focus:outline-none focus:ring-2 ${
                    errors.expiryDate
                      ? 'border-rose-300 focus:ring-rose-500/20'
                      : 'border-slate-200 focus:border-emerald-300 focus:ring-emerald-500/20'
                  }`}
                />
              </div>

              {/* Quick date presets */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[
                  { label: '+3', days: 3 },
                  { label: '+7', days: 7 },
                  { label: '+14', days: 14 },
                  { label: '+30', days: 30 },
                  { label: '+1y', days: 365 },
                ].map((preset) => (
                  <button
                    key={preset.days}
                    type="button"
                    onClick={() => patch({ expiryDate: addDays(preset.days) })}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-500 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                  >
                    {preset.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => patch({ expiryDate: toDateInputValue() })}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-500 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                >
                  {t('dashboard.today')}
                </button>
              </div>
            </Field>
          </div>

          {/* ── Quantity + unit ───────────────────────────────────────────── */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('form.quantity')} required error={errors.quantity} htmlFor="field-quantity">
              <div className="flex items-center gap-2">
                <input
                  id="field-quantity"
                  type="number"
                  min="1"
                  step="1"
                  value={form.quantity}
                  onChange={(event) => patch({ quantity: event.target.value })}
                  className={`w-24 rounded-xl border bg-white px-3.5 py-2.5 text-sm tabular-nums text-slate-700 transition focus:outline-none focus:ring-2 ${
                    errors.quantity
                      ? 'border-rose-300 focus:ring-rose-500/20'
                      : 'border-slate-200 focus:border-emerald-300 focus:ring-emerald-500/20'
                  }`}
                />
                <select
                  value={form.unit}
                  onChange={(event) => patch({ unit: event.target.value })}
                  aria-label={t('form.unit')}
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 transition focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  {UNITS.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {t(unit.labelKey)}
                    </option>
                  ))}
                </select>
              </div>
            </Field>

            {/* Live status preview */}
            <Field label={t('item.expiry')}>
              <div className="flex h-[46px] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5">
                {liveStatus ? (
                  <>
                    <StatusPill status={liveStatus} size="sm" />
                    <span className="truncate text-[11px] text-slate-400">
                      {form.expiryDate ? '' : t('form.error.expiry')}
                    </span>
                  </>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                    <CircleAlert className="h-3.5 w-3.5" />
                    {t('form.error.expiry')}
                  </span>
                )}
              </div>
            </Field>
          </div>
        </form>
      </Modal>

      <ScannerModal
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        onDetected={(code) => {
          handleBarcodeChange(code)
          // Auto-look-up straight after a scan — that's the whole point.
          lookup(code)
        }}
      />
    </>
  )
}

/** Labelled form row with required marker + inline error text. */
function Field({ label, required, error, htmlFor, children }) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500"
      >
        {label}
        {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
      {error && <p className="mt-1.5 text-xs font-medium text-rose-600">{error}</p>}
    </div>
  )
}
