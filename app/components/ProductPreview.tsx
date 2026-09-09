import { getTranslations } from '../../lib/i18n'
import type { Locale } from '../../lib/i18n'

export default function ProductPreview({ locale }: { locale: Locale }) {
  const t = getTranslations(locale)

  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div className="pointer-events-none absolute -inset-8 rounded-[2rem] bg-slate-300/30 blur-3xl dark:bg-orange-500/20" aria-hidden />
      <div className="relative space-y-3 rounded-[28px] border border-slate-200 bg-white p-3 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:border-white/15 dark:bg-zinc-950/80 dark:shadow-2xl dark:shadow-black/50">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:border-white/10 dark:bg-white/[0.05] dark:shadow-none">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500 dark:text-orange-300/90">{t('Your pick')}</p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="w-16 truncate text-sm font-bold text-slate-900 dark:font-bold dark:text-zinc-100">ARS</span>
            <div className="flex items-center gap-2">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-lg font-black tabular-nums text-slate-900 dark:border-orange-400/40 dark:bg-orange-500/20 dark:text-white dark:shadow-none">
                2
              </span>
              <span className="text-xs font-black text-zinc-500">–</span>
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-lg font-black tabular-nums text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-none">
                1
              </span>
            </div>
            <span className="w-16 truncate text-right text-sm font-bold text-slate-900 dark:font-bold dark:text-zinc-100">CHE</span>
          </div>
          <p className="mt-3 text-center text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            {t('Locks 60 min before kickoff')}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:border-white/10 dark:bg-white/[0.05] dark:shadow-none">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500 dark:text-orange-300/90">{t('League table')}</p>
          <ul className="mt-3 space-y-2 text-sm">
            {[
              { place: '1', name: 'Alex', pts: '48' },
              { place: '2', name: 'Sam', pts: '45' },
              { place: '3', name: 'You', pts: '44', you: true },
            ].map((row) => (
              <li
                key={row.place}
                className={`flex items-center justify-between rounded-xl px-3 py-2 ${
                  row.you ? 'border-0 bg-indigo-100 text-indigo-700 dark:border-orange-400/30 dark:bg-orange-500/15 dark:text-orange-50' : 'border-0 bg-white text-slate-900 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:border-transparent dark:bg-black/20 dark:text-zinc-200'
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
