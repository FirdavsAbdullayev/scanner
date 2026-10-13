import { useEffect, useRef, useState } from 'react'

const ACCENTS = {
  slate: {
    wrap: 'hover:border-slate-300',
    iconWrap: 'bg-slate-100 text-slate-600',
    value: 'text-slate-900',
    glow: 'from-slate-400/20 to-slate-300/10',
    bar: 'bg-slate-400',
  },
  emerald: {
    wrap: 'hover:border-emerald-300',
    iconWrap: 'bg-emerald-100 text-emerald-600',
    value: 'text-emerald-700',
    glow: 'from-emerald-400/25 to-teal-300/10',
    bar: 'bg-emerald-500',
  },
  amber: {
    wrap: 'hover:border-amber-300',
    iconWrap: 'bg-amber-100 text-amber-600',
    value: 'text-amber-700',
    glow: 'from-amber-400/30 to-orange-300/10',
    bar: 'bg-amber-500',
  },
  rose: {
    wrap: 'hover:border-rose-300',
    iconWrap: 'bg-rose-100 text-rose-600',
    value: 'text-rose-700',
    glow: 'from-rose-400/25 to-red-300/10',
    bar: 'bg-rose-500',
  },
}

/**
 * Dashboard metric card with a subtle count-up animation.
 *
 * @param {object} props
 * @param {React.ComponentType} props.icon
 * @param {string} props.label
 * @param {number} props.value
 * @param {string} [props.hint]
 * @param {keyof typeof ACCENTS} [props.accent]
 * @param {boolean} [props.alert]   adds a pulsing ring (used for "expiring soon")
 * @param {() => void} [props.onClick]
 * @param {number} [props.total]    renders a thin progress bar when provided
 */
export function StatCard({ icon: Icon, label, value = 0, hint, accent = 'slate', alert = false, onClick, total }) {
  const style = ACCENTS[accent] ?? ACCENTS.slate
  const animated = useCountUp(value)
  const percent = total && total > 0 ? Math.round((value / total) * 100) : null

  const Tag = onClick ? 'button' : 'div'

  return (
    <Tag
      {...(onClick ? { type: 'button', onClick } : {})}
      className={`group relative w-full overflow-hidden rounded-2xl border border-white/60 bg-white/80 p-4 text-left shadow-soft backdrop-blur-md transition duration-300 ${style.wrap} ${
        onClick ? 'hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0' : ''
      } ${alert && value > 0 ? 'ring-1 ring-amber-200' : ''}`}
    >
      {/* Decorative tint */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-gradient-to-br blur-2xl ${style.glow}`}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className={`mt-2 text-3xl font-extrabold tabular-nums leading-none ${style.value}`}>{animated}</p>
          {hint && <p className="mt-1.5 line-clamp-2 text-[11px] leading-snug text-slate-400">{hint}</p>}
        </div>
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${style.iconWrap} ${
            alert && value > 0 ? 'animate-pulse-ring' : ''
          }`}
        >
          <Icon className="h-5 w-5" strokeWidth={2.1} />
        </span>
      </div>

      {percent != null && (
        <div className="relative mt-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${style.bar}`}
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="mt-1 text-[10px] font-medium text-slate-400">{percent}%</p>
        </div>
      )}
    </Tag>
  )
}

/** Ease-out count-up so numbers feel alive without being distracting. */
function useCountUp(target, duration = 700) {
  const [display, setDisplay] = useState(target)
  const fromRef = useRef(target)

  useEffect(() => {
    const from = fromRef.current
    if (from === target) {
      setDisplay(target)
      return undefined
    }

    let raf = 0
    const start = performance.now()
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(from + (target - from) * eased))
      if (progress < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        fromRef.current = target
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])

  return display
}
