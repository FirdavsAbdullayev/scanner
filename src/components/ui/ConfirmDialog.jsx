import { TriangleAlert } from 'lucide-react'
import { Modal } from './Modal.jsx'
import { useLanguage } from '../../i18n/LanguageContext.jsx'

/**
 * Destructive-action confirmation.
 * @param {object} props
 * @param {object|null} props.item   the item pending deletion
 * @param {() => void} props.onCancel
 * @param {() => void} props.onConfirm
 */
export function ConfirmDialog({ item, onCancel, onConfirm }) {
  const { t } = useLanguage()
  const open = Boolean(item)

  return (
    <Modal
      open={open}
      onClose={onCancel}
      size="sm"
      title={t('confirm.deleteTitle')}
      icon={<TriangleAlert className="h-5 w-5" />}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            {t('confirm.cancel')}
          </button>
          <button
            type="button"
            data-autofocus
            onClick={onConfirm}
            className="rounded-xl bg-gradient-to-r from-rose-500 to-red-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 transition hover:brightness-110 active:scale-[0.98]"
          >
            {t('confirm.delete')}
          </button>
        </div>
      }
    >
      <p className="text-sm leading-relaxed text-slate-600">
        {t('confirm.deleteMessage', { name: item?.name ?? '' })}
      </p>
      {item && (
        <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3">
          <span className="text-sm font-semibold text-slate-700">{item.name}</span>
          <span className="text-xs text-slate-400">{item.expiryDate}</span>
        </div>
      )}
    </Modal>
  )
}
