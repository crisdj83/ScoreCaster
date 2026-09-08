import Link from 'next/link'
import { Trophy, Users, Target, BarChart2 } from 'lucide-react'
import { getTranslations } from '../../lib/i18n'
import type { Locale } from '../../lib/i18n'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function MarketingLanding({ locale }: { locale: Locale }) {
  const t = getTranslations(locale)

  const steps = [
    {
      icon: Users,
      title: t('Join a league'),
      body: t('Create a private league or enter a friend’s invite link. Ready in under a minute.'),
    },
    {
      icon: Target,
      title: t('Pick the score'),
      body: t('Call every Premier League score before picks lock, one hour before kickoff.'),
    },
    {
      icon: BarChart2,
      title: t('Climb the table'),
      body: t('Exact score pays most. Close calls and the right result still keep you in the race.'),
    },
  ]

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-8 pt-2 sm:space-y-10">
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-orange-600 via-zinc-900 to-zinc-950 px-5 py-8 shadow-2xl sm:px-10 sm:py-12">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-orange-100">
          <Trophy className="h-3.5 w-3.5" />
          {t('Premier League predictions')}
        </div>
        <h1 className="max-w-xl text-3xl font-black uppercase leading-none tracking-tight text-white sm:text-5xl">
          {t('Call the scores.')}{' '}
          <span className="text-xactscore-accent">{t('Own the table.')}</span>
        </h1>
        <p className="mt-4 max-w-lg text-sm leading-6 text-orange-50/90 sm:text-base">
          {t('Predict Premier League scores with friends. No transfers, no squads — just the score, your league, and the table.')}
        </p>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'XactScore',
              url: 'https://xactscore.app',
              applicationCategory: 'GameApplication',
              operatingSystem: 'Web',
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
              description: t('Predict match scores and compete with friends.'),
            }),
          }}
        />
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center">
          <Link href="/login" className={cn(buttonVariants(), 'w-full uppercase tracking-wider sm:w-auto')}>
            {t('Start for free')}
          </Link>
          <Link
            href="/help"
            className={cn(buttonVariants({ variant: 'glass' }), 'w-full uppercase tracking-wider sm:w-auto')}
          >
            {t('How it works')}
          </Link>
        </div>
        <ul className="mt-6 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-wider text-orange-100/90">
          <li className="rounded-full border border-white/15 bg-black/20 px-3 py-1">{t('No ads')}</li>
          <li className="rounded-full border border-white/15 bg-black/20 px-3 py-1">{t('No player limit')}</li>
          <li className="rounded-full border border-white/15 bg-black/20 px-3 py-1">{t('Always free')}</li>
        </ul>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {steps.map(({ icon: Icon, title, body }) => (
          <article
            key={title}
            className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-lg shadow-black/20"
          >
            <div className="mb-3 inline-flex rounded-xl bg-xactscore-accent/15 p-2.5 text-xactscore-accent">
              <Icon className="h-5 w-5" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-tight text-zinc-100">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">{body}</p>
          </article>
        ))}
      </section>

      <p className="text-center text-sm text-zinc-500">
        {t('Already have an account?')}{' '}
        <Link href="/login" className="font-bold text-xactscore-accent underline-offset-2 hover:underline">
          {t('Sign In')}
        </Link>
      </p>
    </div>
  )
}
