import { useEffect, useState } from 'react'
import { Check, ScanBarcode } from 'lucide-react'
import { Modal } from '../ui/Modal.jsx'
import { CameraPanel } from './CameraPanel.jsx'
import { useBarcodeScanner } from './useBarcodeScanner.js'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { digitsOnly, isValidBarcode } from '../../utils/format.js'

/**
 * Compact camera dialog used by the add/edit form's "Scan" button.
 * It only detects a code and hands it back — no network calls here.
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {(code: string) => void} props.onDetected
 */
export function ScannerModal({ open, onClose, onDetected }) {
  const { t } = useLanguage()
  const [detected, setDetected] = useState(null)

  const scanner = useBarcodeScanner({
    onDetected: (code) => setDetected(code),
  })

  // Reset and release the camera whenever the dialog closes.
  useEffect(() => {
    if (open) return undefined
    setDetected(null)
    scanner.stop()
    return undefined
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const confirm = () => {
    if (!detected) return
    onDetected(detected)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title={t('form.scan')}
      subtitle={t('scanner.tips')}
      icon={<ScanBarcode className="h-5 w-5" />}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            {t('form.cancel')}
          </button>
          <button
            type="button"
            disabled={!detected}
            onClick={confirm}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Check className="h-4 w-4" strokeWidth={2.6} />
            {t('form.useProduct')}
          </button>
        </div>
      }
    >
      <CameraPanel scanner={scanner} compact />

      <div className="mt-4">
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
          {t('form.barcode')}
        </label>
        <input
          data-autofocus
          value={detected ?? ''}
          onChange={(event) => setDetected(digitsOnly(event.target.value))}
          inputMode="numeric"
          placeholder={t('form.barcodePlaceholder')}
          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-mono text-sm text-slate-700 transition focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        />
        {detected && !isValidBarcode(detected) && (
          <p className="mt-1.5 text-xs font-medium text-amber-600">{t('scanner.invalid')}</p>
        )}
      </div>
    </Modal>
  )
}
