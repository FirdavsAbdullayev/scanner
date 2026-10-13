import { useState } from 'react'
import {
  ChevronDown,
  CircleAlert,
  CircleCheck,
  ExternalLink,
  KeyRound,
  LoaderCircle,
  Settings2,
} from 'lucide-react'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { KEY_PROVIDERS, clearApiKeys, readApiKeys, setApiKey } from '../../services/apiKeys.js'
import { verifyApiKey } from '../../services/productLookup.js'

/** How each verification outcome is rendered. */
const CHECK_STYLES = {
  checking: { tone: 'text-slate-500', icon: LoaderCircle, messageKey: 'sources.checking', spin: true },
  ok: { tone: 'text-emerald-600', icon: CircleCheck, messageKey: 'sources.keyOk' },
  invalid: { tone: 'text-rose-600', icon: CircleAlert, messageKey: 'sources.keyInvalid' },
  http: { tone: 'text-amber-600', icon: CircleAlert, messageKey: 'sources.keyNetwork' },
  network: { tone: 'text-amber-600', icon: CircleAlert, messageKey: 'sources.keyNetwork' },
}

/**
 * Collapsible panel that turns on the optional *retail* catalogues.
 *
 * Those databases (UPCitemdb, EAN-Search, Go-UPC) cover the widest range of
 * barcodes overall but all require a free API key. Keys are stored in this
 * browser only and sent straight to the provider — never through a third party.
 * With no key the app simply queries its keyless sources, as before.
 */
export function AdvancedSources() {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [keys, setKeys] = useState(() => readApiKeys())
  const [drafts, setDrafts] = useState({})
  const [checks, setChecks] = useState({})

  const activeCount = Object.keys(keys).length

  const save = async (providerId) => {
    const value = drafts[providerId] ?? keys[providerId] ?? ''
    setApiKey(providerId, value)
    const next = readApiKeys()
    setKeys(next)
    setDrafts((previous) => ({ ...previous, [providerId]: next[providerId] ?? '' }))

    if (!next[providerId]) {
      setChecks((previous) => ({ ...previous, [providerId]: undefined }))
      return
    }
    setChecks((previous) => ({ ...previous, [providerId]: 'checking' }))
    const result = await verifyApiKey(providerId, next[providerId])
    setChecks((previous) => ({ ...previous, [providerId]: result.ok ? 'ok' : result.reason }))
  }

  const clearAll = () => {
    clearApiKeys()
    setKeys({})
    setDrafts({})
    setChecks({})
  }

  return (
    <div className="rounded-2xl border border-white/60 bg-white/70 shadow-sm backdrop-blur-md">
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 px-3.5 py-3 text-left"
      >
        <Settings2 className="h-4 w-4 shrink-0 text-emerald-600" />
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-bold text-slate-700">{t('sources.advanced')}</span>
          <span className="block text-[11px] leading-snug text-slate-500">{t('sources.advancedHint')}</span>
        </span>
        {activeCount > 0 && (
          <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-100">
            {t('sources.activeCount', { n: activeCount })}
          </span>
        )}
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="space-y-2.5 border-t border-slate-100 px-3.5 py-3">
          {KEY_PROVIDERS.map((provider) => {
            const state = checks[provider.id]
            const style = state ? CHECK_STYLES[state] : null
            const StatusIcon = style?.icon

            return (
              <div key={provider.id} className="rounded-xl bg-white/80 p-2.5 ring-1 ring-slate-100">
                <div className="flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-[11px] font-bold text-slate-600">{t(provider.labelKey)}</span>
                  <a
                    href={provider.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 underline underline-offset-2 hover:text-emerald-700"
                  >
                    {t('sources.getKey')}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                <div className="mt-1.5 flex gap-1.5">
                  <input
                    type="password"
                    value={drafts[provider.id] ?? keys[provider.id] ?? ''}
                    onChange={(event) =>
                      setDrafts((previous) => ({ ...previous, [provider.id]: event.target.value }))
                    }
                    placeholder={t('sources.keyPlaceholder')}
                    aria-label={t(provider.labelKey)}
                    autoComplete="off"
                    spellCheck={false}
                    className="min-w-0 flex-1 rounded-lg border border-white/60 bg-white/90 px-2.5 py-1.5 font-mono text-[11px] text-slate-700 shadow-sm transition focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => save(provider.id)}
                    disabled={state === 'checking'}
                    className="shrink-0 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:brightness-110 disabled:opacity-60"
                  >
                    {t('sources.save')}
                  </button>
                </div>

                {style && (
                  <p className={`mt-1.5 flex items-center gap-1.5 text-[10px] font-semibold ${style.tone}`}>
                    <StatusIcon className={`h-3 w-3 ${style.spin ? 'animate-spin' : ''}`} />
                    {t(style.messageKey)}
                  </p>
                )}
              </div>
            )
          })}

          {activeCount > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="w-full rounded-lg border border-slate-200 bg-white/80 px-3 py-1.5 text-[11px] font-semibold text-slate-500 transition hover:border-rose-200 hover:text-rose-600"
            >
              {t('sources.clearAll')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
