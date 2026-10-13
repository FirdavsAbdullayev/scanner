/**
 * Friendly empty state: a soft icon bubble, a title, a hint and optional
 * actions. Used by the inventory grid, dashboard and recipe page.
 */
export function EmptyState({ icon: Icon, title, description, actions, tone = 'emerald', compact = false }) {
  const tones = {
    emerald: 'from-emerald-100 to-teal-50 text-emerald-500',
    amber: 'from-amber-100 to-orange-50 text-amber-500',
    slate: 'from-slate-100 to-slate-50 text-slate-400',
    violet: 'from-violet-100 to-fuchsia-50 text-violet-500',
  }

  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${compact ? 'py-8' : 'py-14'} px-6`}
    >
      {Icon && (
        <span
          className={`mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br shadow-inner ${tones[tone] ?? tones.emerald}`}
        >
          <Icon className={compact ? 'h-7 w-7' : 'h-8 w-8'} strokeWidth={1.8} />
        </span>
      )}
      <h3 className="text-balance text-base font-semibold text-slate-800">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-balance text-sm text-slate-500">{description}</p>
      )}
      {actions && <div className="mt-5 flex flex-wrap items-center justify-center gap-2">{actions}</div>}
    </div>
  )
}
