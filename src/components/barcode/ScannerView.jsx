import { useCallback, useEffect, useState } from 'react'
import { Hash, LoaderCircle, Plus, ScanBarcode, ScanSearch, Search, Sparkles } from 'lucide-react'
import { CameraPanel } from './CameraPanel.jsx'
import { ProductPreview, LookupNotice } from './ProductPreview.jsx'
import { useBarcodeScanner } from './useBarcodeScanner.js'
import { EmptyState } from '../ui/EmptyState.jsx'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { useUI } from '../../context/UIContext.jsx'
import { SAMPLE_BARCODES } from '../../constants/barcodeSamples.js'
import { digitsOnly, isValidBarcode } from '../../utils/format.js'
import { fetchProduct, InvalidBarcodeError, ProductNotFoundError } from '../../services/openFoodFacts.js'

/**
 * Full-page scanner: live camera on one side, manual entry + sample codes on
 * the other, with the Open Food Facts result rendered underneath.
 *
 * A successful scan or a manual lookup both land in `result`, and the
 * "Add to inventory" button forwards it to the add-product modal.
 */
export function ScannerView() {
  const { t } = useLanguage()
  const { openAddItem } = useUI()

  const [manualCode, setManualCode] = useState('')
  const [lookupCode, setLookupCode] = useState('')
  const [result, setResult] = useState(null)
  const [state, setState] = useState('idle') // idle | loading | found | not-found | error | invalid
  const [flash, setFlash] = useState(false)

  const lookup = useCallback(
    async (rawCode) => {
      const code = digitsOnly(rawCode)
      if (!isValidBarcode(code)) {
        setState('invalid')
        setResult(null)
        return
      }
      setManualCode(code)
      setLookupCode(code)
      setState('loading')
      setResult(null)
      try {
        const product = await fetchProduct(code)
        setResult(product)
        setState('found')
      } catch (error) {
        if (error instanceof ProductNotFoundError) setState('not-found')
        else if (error instanceof InvalidBarcodeError) setState('invalid')
        else setState('error')
      }
    },
    [],
  )

  // Called by the camera hook after a clean read.
  const handleDetected = useCallback(
    (code) => {
      setFlash(true)
      lookup(code)
    },
    [lookup],
  )

  const scanner = useBarcodeScanner({ onDetected: handleDetected })

  useEffect(() => {
    if (!flash) return undefined
    const timer = setTimeout(() => setFlash(false), 900)
    return () => clearTimeout(timer)
  }, [flash])

  const addToInventory = () => {
    if (!result) return
    openAddItem({
      name: result.name,
      barcode: result.barcode,
      product: result,
      category: guessCategory(result),
    })
  }

  /**
   * A brand-new / local product usually isn't in Open Food Facts at all. The
   * barcode is still perfectly valid, so let the user create the item with just
   * the code they scanned (or typed) and fill the rest in manually.
   */
  const addWithCode = (code) => {
    const clean = digitsOnly(code || lookupCode)
    openAddItem({ barcode: clean, name: '' })
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {/* Camera */}
      <section className="glass space-y-4 rounded-2xl p-4 shadow-soft sm:p-5">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <ScanBarcode className="h-4 w-4 text-emerald-600" />
            {t('scanner.start')}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">{t('scanner.tips')}</p>
        </div>

        <CameraPanel scanner={scanner} />

        {flash && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm font-semibold text-emerald-700 animate-pop-in">
            <Sparkles className="h-4 w-4 animate-pulse" />
            {t('scanner.scanSuccess')}
            {scanner.lastCode && <span className="font-mono text-xs text-emerald-600">{scanner.lastCode}</span>}
          </div>
        )}
      </section>

      {/* Manual entry + result */}
      <section className="space-y-4">
        <div className="glass space-y-4 rounded-2xl p-4 shadow-soft sm:p-5">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <Hash className="h-4 w-4 text-emerald-600" />
              {t('scanner.manual')}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">{t('scanner.manualHint')}</p>
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault()
              lookup(manualCode)
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={manualCode}
                onChange={(event) => setManualCode(digitsOnly(event.target.value))}
                inputMode="numeric"
                autoComplete="off"
                placeholder={t('scanner.manualPlaceholder')}
                aria-label={t('scanner.manual')}
                className="w-full rounded-2xl border border-white/60 bg-white/80 py-3 pl-10 pr-3 font-mono text-sm tracking-wide text-slate-700 shadow-sm backdrop-blur-md transition placeholder:font-sans placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <button
              type="submit"
              disabled={state === 'loading'}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:brightness-110 disabled:opacity-60"
            >
              {state === 'loading' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ScanSearch className="h-4 w-4" />}
              <span className="hidden sm:inline">{t('form.lookupShort')}</span>
            </button>
          </form>

          {/* Sample barcodes */}
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              {t('scanner.samples')}
            </p>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_BARCODES.map((sample) => (
                <button
                  key={sample.code}
                  type="button"
                  onClick={() => lookup(sample.code)}
                  title={sample.hint}
                  className="group inline-flex items-center gap-2 rounded-xl border border-white/60 bg-white/80 px-3 py-2 text-left shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
                >
                  <span className="text-base leading-none">{sample.emoji}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-semibold text-slate-700">{sample.label}</span>
                    <span className="block font-mono text-[10px] text-slate-400">{sample.code}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Result area */}
        <div className="glass rounded-2xl p-4 shadow-soft sm:p-5">
          <h2 className="text-sm font-bold text-slate-800">{t('scanner.result')}</h2>

          <div className="mt-3">
            {state === 'loading' && (
              <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <LoaderCircle className="h-5 w-5 animate-spin text-emerald-500" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-1/2 rounded-full bg-slate-200 animate-shimmer" />
                  <div className="h-3 w-1/3 rounded-full bg-slate-200 animate-shimmer" />
                </div>
              </div>
            )}

            {state === 'found' && result && (
              <ProductPreview
                product={result}
                actions={
                  <button
                    type="button"
                    onClick={addToInventory}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:brightness-110"
                  >
                    <Plus className="h-4 w-4" strokeWidth={2.6} />
                    {t('scanner.addToInventory')}
                  </button>
                }
              />
            )}

            {state === 'not-found' && (
              <div className="space-y-3">
                <LookupNotice tone="warning" title={t('form.notFound')} description={t('form.notFoundHint')} />
                <button
                  type="button"
                  onClick={() => addWithCode(lookupCode)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:brightness-110 active:scale-[0.99]"
                >
                  <Plus className="h-4 w-4" strokeWidth={2.6} />
                  <span>{t('scanner.addWithCode')}</span>
                  {lookupCode && <span className="font-mono text-xs text-white/80">{lookupCode}</span>}
                </button>
              </div>
            )}
            {state === 'error' && (
              <div className="space-y-3">
                <LookupNotice tone="error" title={t('form.error')} description={t('form.errorHint')} />
                {isValidBarcode(lookupCode) && (
                  <button
                    type="button"
                    onClick={() => addWithCode(lookupCode)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:brightness-110 active:scale-[0.99]"
                  >
                    <Plus className="h-4 w-4" strokeWidth={2.6} />
                    <span>{t('scanner.addWithCode')}</span>
                    <span className="font-mono text-xs text-white/80">{lookupCode}</span>
                  </button>
                )}
              </div>
            )}
            {state === 'invalid' && <LookupNotice tone="warning" title={t('scanner.invalid')} />}

            {state === 'idle' && (
              <EmptyState icon={ScanBarcode} tone="slate" title={t('scanner.emptyState')} compact />
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

/** Rough category guess so the add-form starts on a sensible tab. */
function guessCategory(product) {
  const haystack = `${product.categories?.join(' ') ?? ''} ${product.name ?? ''}`.toLowerCase()
  if (/medicine|pharm|paracet|ibuprofen|vitamin|drug/.test(haystack)) return 'medicine'
  if (/yogurt|milk|cheese|dairy|cream|butter|egg/.test(haystack)) return 'fridge'
  if (/frozen|fish|meat|chicken|vegetable|fruit|salad/.test(haystack)) return 'fridge'
  return 'pantry'
}
