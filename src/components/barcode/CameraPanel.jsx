import { Camera, CameraOff, CircleAlert, Flashlight, FlashlightOff, LoaderCircle, ScanLine, SwitchCamera } from 'lucide-react'
import { useLanguage } from '../../i18n/LanguageContext.jsx'

/**
 * Camera viewport with a scan reticle and status messaging.
 * Pure presentation — the hook does the heavy lifting.
 *
 * @param {object} props
 * @param {ReturnType<import('./useBarcodeScanner.js').useBarcodeScanner>} props.scanner
 * @param {boolean} [props.compact]
 */
export function CameraPanel({ scanner, compact = false }) {
  const { t } = useLanguage()
  const { videoRef, status, error, start, stop, isActive, devices, switchCamera, torch, toggleTorch } = scanner
  const canFlip = (devices?.length ?? 0) > 1

  const errorMessage = {
    'permission-denied': t('scanner.denied'),
    'no-camera': t('scanner.noCamera'),
    'insecure-context': t('scanner.hint'),
    unsupported: t('scanner.hint'),
    'camera-busy': t('scanner.busy'),
    'camera-error': t('scanner.error'),
  }[error]

  return (
    <div className="space-y-3">
      <div
        className={`relative w-full overflow-hidden rounded-2xl border border-slate-800/10 bg-slate-900 ${
          compact ? 'aspect-4/3' : 'aspect-video'
        }`}
      >
        <video
          ref={videoRef}
          muted
          playsInline
          autoPlay
          className={`h-full w-full object-cover transition-opacity duration-300 ${
            isActive ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Idle / error placeholder */}
        {!isActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-slate-800 to-slate-900 px-6 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white/80 backdrop-blur-sm">
              {error ? <CameraOff className="h-6 w-6" /> : <ScanLine className="h-6 w-6" />}
            </span>
            <p className="max-w-xs text-sm font-medium text-white/80">
              {errorMessage ?? t('scanner.idle')}
            </p>
            {error && <p className="max-w-xs text-xs text-white/50">{t('scanner.tips')}</p>}
          </div>
        )}

        {/* Reticle + scanline */}
        {isActive && (
          <>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="relative h-[58%] w-[74%] max-w-md">
                <Corner className="left-0 top-0 border-l-4 border-t-4" />
                <Corner className="right-0 top-0 border-r-4 border-t-4" />
                <Corner className="bottom-0 left-0 border-b-4 border-l-4" />
                <Corner className="bottom-0 right-0 border-b-4 border-r-4" />
                <span className="absolute inset-x-0 h-0.5 animate-scanline bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_rgba(16,185,129,0.9)]" />
              </div>
            </div>
            <div className="absolute inset-x-0 top-0 flex items-center justify-center gap-2 bg-gradient-to-b from-slate-900/80 to-transparent px-4 py-3">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              <span className="text-xs font-semibold text-white/90">{t('scanner.scanning')}</span>
            </div>
            <p className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/80 to-transparent px-4 pb-3 pt-6 text-center text-[11px] text-white/70">
              {t('scanner.reticle')}
            </p>
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => (isActive ? stop() : start())}
          className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
            isActive
              ? 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 hover:brightness-110'
          }`}
        >
          {status === 'starting' ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : isActive ? (
            <CameraOff className="h-4 w-4" />
          ) : (
            <Camera className="h-4 w-4" />
          )}
          {status === 'starting' ? t('common.loading') : isActive ? t('scanner.stop') : t('scanner.start')}
        </button>

        {torch?.available && (
          <button
            type="button"
            onClick={toggleTorch}
            aria-pressed={torch.on}
            aria-label={torch.on ? t('scanner.torchOff') : t('scanner.torchOn')}
            title={torch.on ? t('scanner.torchOff') : t('scanner.torchOn')}
            className={`inline-flex h-[42px] w-[42px] items-center justify-center rounded-xl border transition ${
              torch.on
                ? 'border-amber-200 bg-amber-100 text-amber-700'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {torch.on ? <Flashlight className="h-4 w-4" /> : <FlashlightOff className="h-4 w-4" />}
          </button>
        )}

        {canFlip && (
          <button
            type="button"
            onClick={switchCamera}
            aria-label={t('scanner.flipCamera')}
            title={t('scanner.flipCamera')}
            className="inline-flex h-[42px] w-[42px] items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
          >
            <SwitchCamera className="h-4 w-4" />
          </button>
        )}
      </div>

      <p className="inline-flex items-center gap-1.5 text-[11px] text-slate-400">
        <CircleAlert className="h-3.5 w-3.5" />
        {t('scanner.cameraNote')}
      </p>
    </div>
  )
}

function Corner({ className }) {
  return <span aria-hidden="true" className={`absolute h-8 w-8 rounded-sm border-emerald-400 ${className}`} />
}
