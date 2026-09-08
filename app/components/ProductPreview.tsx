import { getTranslations } from '../../lib/i18n'
import type { Locale } from '../../lib/i18n'

export default function ProductPreview({ locale }: { locale: Locale }) {
  const t = getTranslations(locale)

  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div className="pointer-events-none absolute -inset-8 rounded-[2rem] bg-orange-500/20 blur-3xl" aria-hidden />
      <div className="relative space-y-3 rounded-[1.75rem] border border-white/15 bg-zinc-950/80 p-3 shadow-2xl shadow-black/50 backdrop-blur-xl">
        <article className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-300/90">{t('Your pick')}</p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="w-16 truncate text-sm font-bold text-zinc-100">ARS</span>
            <div className="flex items-center gap-2">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-orange-400/40 bg-orange-500/20 text-lg font-black tabular-nums text-white">
                2
              </span>
              <span className="text-xs font-black text-zinc-500">–</span>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-lg font-black tabular-nums text-white">
                1
              </span>
            </div>
            <span className="w-16 truncate text-right text-sm font-bold text-zinc-100">CHE</span>
          </div>
          <p className="mt-3 text-center text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            {t('Locks 60 min before kickoff')}
          </p>
        </article>

        <article className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-300/90">{t('League table')}</p>
          <ul className="mt-3 space-y-2 text-sm">
            {[
              { place: '1', name: 'Alex', pts: '48' },
              { place: '2', name: 'Sam', pts: '45' },
              { place: '3', name: 'You', pts: '44', you: true },
            ].map((row) => (
              <li
                key={row.place}
                className={`flex items-center justify-between rounded-xl px-3 py-2 ${
                  row.you ? 'border border-orange-400/30 bg-orange-500/15 text-orange-50' : 'bg-black/20 text-zinc-200'
                }`}
              >
                <span className="font-bold">
                  <span className="mr-2 tabular-nums text-zinc-500">{row.place}</span>
                  {row.name}
                </span>
                <span className="font-black tabular-nums">
                  {row.pts} {t('pts')}
                </span>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </div>
  )
}
