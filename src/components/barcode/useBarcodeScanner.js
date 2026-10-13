import { useCallback, useEffect, useRef, useState } from 'react'
import { isSecureCameraContext } from '../../utils/format.js'

/**
 * Camera barcode scanner built on @zxing/browser.
 *
 * The library is imported lazily (dynamic `import()`) so it never lands in the
 * initial bundle — it is only fetched the moment a user actually starts the
 * camera.
 *
 * Detection quality knobs (this is what makes real 1D barcodes actually scan):
 *   - a high-resolution "environment" stream (a 640×480 preview can't resolve a
 *     product barcode),
 *   - the TRY_HARDER hint + an explicit format list,
 *   - a short interval between decode attempts (default is a sluggish 500 ms),
 *   - a bonus native `BarcodeDetector` loop when the browser exposes it
 *     (Android Chrome) — it is markedly better at 1D codes than pure JS.
 *
 * @param {{ onDetected?: (code: string) => void, dedupeMs?: number }} options
 * @returns {{
 *   videoRef: React.RefObject<HTMLVideoElement>,
 *   status: 'idle'|'starting'|'scanning'|'error'|'unsupported',
 *   error: string|null,
 *   start: (deviceId?: string) => Promise<void>,
 *   stop: () => void,
 *   toggle: () => void,
 *   lastCode: string|null,
 *   isActive: boolean,
 *   devices: MediaDeviceInfo[],
 *   deviceId: string|null,
 *   switchCamera: () => void,
 *   torch: { available: boolean, on: boolean },
 *   toggleTorch: () => Promise<void>,
 * }}
 */
export function useBarcodeScanner({ onDetected, dedupeMs = 2500 } = {}) {
  const videoRef = useRef(null)
  const controlsRef = useRef(null)
  const streamRef = useRef(null)
  const nativeTimerRef = useRef(null)
  const lastRef = useRef({ code: null, at: 0 })
  const detectedRef = useRef(onDetected)
  detectedRef.current = onDetected

  const statusRef = useRef('idle')
  const deviceIdRef = useRef(null)

  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const [lastCode, setLastCode] = useState(null)
  const [devices, setDevices] = useState([])
  const [deviceId, setDeviceId] = useState(null)
  const [torch, setTorch] = useState({ available: false, on: false })

  const updateStatus = useCallback((next) => {
    statusRef.current = next
    setStatus(next)
  }, [])

  const stop = useCallback(() => {
    if (nativeTimerRef.current) {
      clearTimeout(nativeTimerRef.current)
      nativeTimerRef.current = null
    }

    try {
      controlsRef.current?.stop()
    } catch {
      /* already stopped */
    }
    controlsRef.current = null

    // Belt-and-braces: also kill the raw stream (some browsers keep the LED on).
    try {
      const stream = streamRef.current ?? videoRef.current?.srcObject
      stream?.getTracks?.().forEach((track) => track.stop())
    } catch {
      /* ignore */
    }
    streamRef.current = null
    if (videoRef.current) {
      try {
        videoRef.current.srcObject = null
      } catch {
        /* ignore */
      }
    }
    setTorch({ available: false, on: false })
    updateStatus('idle')
  }, [updateStatus])

  const start = useCallback(
    async (requestedId) => {
      if (statusRef.current === 'starting' || statusRef.current === 'scanning') return

      const explicit = typeof requestedId === 'string' ? requestedId.trim() : ''
      const targetId = explicit || deviceIdRef.current || undefined
      setError(null)

      if (!isSecureCameraContext()) {
        updateStatus('error')
        setError('insecure-context')
        return
      }
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        updateStatus('unsupported')
        setError('unsupported')
        return
      }

      updateStatus('starting')
      try {
        const [browserModule, libraryModule] = await Promise.all([
          import('@zxing/browser'),
          import('@zxing/library'),
        ])
        const { BrowserMultiFormatReader } = browserModule
        const { DecodeHintType } = libraryModule

        // TRY_HARDER spends more effort scanning more rows — it's the single
        // biggest win for angled / small 1D barcodes. We deliberately do NOT
        // restrict POSSIBLE_FORMATS, so every symbology the library supports
        // (including GS1 DataBar, used on fresh produce) is still attempted.
        const hints = new Map()
        hints.set(DecodeHintType.TRY_HARDER, true)

        const reader = new BrowserMultiFormatReader(hints, {
          delayBetweenScanAttempts: 160,
          delayBetweenScanSuccess: 800,
          tryPlayVideoTimeout: 8000,
        })

        // Shared "we got a code" path — guards against a double read from the
        // two engines (zxing + native) racing each other.
        const emit = (code) => {
          if (!code) return
          const now = Date.now()
          if (code === lastRef.current.code && now - lastRef.current.at < dedupeMs) return
          lastRef.current = { code, at: now }
          setLastCode(code)
          stop()
          detectedRef.current?.(code)
        }

        const handleResult = (result) => {
          if (!result) return
          emit(result.getText())
        }

        // A low-res stream is the #1 reason barcodes "open but never scan", so
        // deliberately request a big frame and continuous autofocus.
        const richConstraints = targetId
          ? { video: { deviceId: { exact: targetId }, width: { ideal: 1920 }, height: { ideal: 1080 } } }
          : {
              video: {
                facingMode: { ideal: 'environment' },
                width: { ideal: 1920 },
                height: { ideal: 1080 },
                advanced: [{ focusMode: 'continuous' }],
              },
            }

        let controls
        try {
          controls = await reader.decodeFromConstraints(richConstraints, videoRef.current, handleResult)
        } catch (err) {
          // Some devices reject the advanced/resolution constraints — retry with
          // the bare minimum rather than failing outright.
          if (err?.name === 'OverconstrainedError') {
            const basic = targetId
              ? { video: { deviceId: { exact: targetId } } }
              : { video: { facingMode: 'environment' } }
            controls = await reader.decodeFromConstraints(basic, videoRef.current, handleResult)
          } else {
            throw err
          }
        }

        controlsRef.current = controls
        const stream = videoRef.current?.srcObject ?? null
        streamRef.current = stream
        updateStatus('scanning')
        setTorch({ available: typeof controls?.switchTorch === 'function', on: false })

        // Enumerate the cameras so the UI can offer a switcher.
        try {
          const all = await navigator.mediaDevices.enumerateDevices()
          setDevices(all.filter((device) => device.kind === 'videoinput'))
          const activeId = stream?.getVideoTracks?.()[0]?.getSettings?.().deviceId
          if (activeId) {
            deviceIdRef.current = activeId
            setDeviceId(activeId)
          }
        } catch {
          /* enumeration is optional */
        }

        // Bonus engine: the browser's own BarcodeDetector (Android Chrome) is
        // far more reliable on 1D codes. Runs alongside zxing; first to read wins.
        startNativeDetector(emit)
      } catch (err) {
        const name = err?.name ?? ''
        const message =
          name === 'NotAllowedError' || name === 'SecurityError'
            ? 'permission-denied'
            : name === 'NotFoundError' || name === 'OverconstrainedError' || name === 'DevicesNotFoundError'
              ? 'no-camera'
              : name === 'NotReadableError' || name === 'TrackStartError'
                ? 'camera-busy'
                : 'camera-error'
        setError(message)
        updateStatus('error')
      }

      /** Fire a low-frequency native detection loop, if the API exists. */
      function startNativeDetector(onCode) {
        const Detector = typeof window !== 'undefined' ? window.BarcodeDetector : undefined
        if (typeof Detector !== 'function') return

        let detector
        try {
          // No explicit formats → the detector uses every format it supports.
          detector = new Detector()
        } catch {
          try {
            detector = new Detector({
              formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'code_93', 'itf', 'codabar', 'qr_code'],
            })
          } catch {
            return
          }
        }

        const tick = async () => {
          if (statusRef.current !== 'scanning') return
          const video = videoRef.current
          try {
            if (video && video.readyState >= 2) {
              const results = await detector.detect(video)
              if (results && results.length) {
                onCode(results[0].rawValue)
                return
              }
            }
          } catch {
            /* frame not ready / unsupported — keep trying */
          }
          if (statusRef.current === 'scanning') {
            nativeTimerRef.current = setTimeout(tick, 140)
          }
        }
        nativeTimerRef.current = setTimeout(tick, 140)
      }
    },
    [dedupeMs, stop, updateStatus],
  )

  const toggle = useCallback(() => {
    if (statusRef.current === 'scanning' || statusRef.current === 'starting') stop()
    else start()
  }, [start, stop])

  /** Turn the flashlight on/off — only wired up when the device supports it. */
  const toggleTorch = useCallback(async () => {
    const controls = controlsRef.current
    if (!controls?.switchTorch) return
    const next = !torch.on
    try {
      await controls.switchTorch(next)
      setTorch((prev) => ({ ...prev, on: next }))
    } catch {
      /* torch is experimental — ignore failures */
    }
  }, [torch.on])

  /** Cycle to the next video input (usually just rear ⇄ front). */
  const switchCamera = useCallback(() => {
    const list = devices
    if (list.length < 2) return
    const current = deviceIdRef.current ?? deviceId
    const index = list.findIndex((device) => device.deviceId === current)
    const next = list[(index + 1) % list.length]
    if (!next?.deviceId) return
    deviceIdRef.current = next.deviceId
    setDeviceId(next.deviceId)
    stop()
    // Give the previous stream a beat to fully release before re-acquiring.
    setTimeout(() => start(next.deviceId), 150)
  }, [devices, deviceId, start, stop])

  // Always release the camera when the component unmounts.
  useEffect(() => stop, [stop])

  return {
    videoRef,
    status,
    error,
    start,
    stop,
    toggle,
    lastCode,
    isActive: status === 'scanning' || status === 'starting',
    devices,
    deviceId,
    switchCamera,
    torch,
    toggleTorch,
  }
}

export default useBarcodeScanner
