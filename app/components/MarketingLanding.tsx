import Link from 'next/link'
import Image from 'next/image'
import { Ban, Bell, Link2, Trophy, Users, Target, BarChart2 } from 'lucide-react'
import { getTranslations } from '../../lib/i18n'
import type { Locale } from '../../lib/i18n'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { siteUrl } from '../../lib/urls'
import LandingJoinForm from './LandingJoinForm'
import ProductPreview from './ProductPreview'
import CompareSection from './CompareSection'
import type { NextMatchData, ScoreData } from './HeroBanner'

const reasons = [
  {
    icon: Ban,
    title: 'No ads. Ever.',
    body: 'Superbru users complain about ads before every pick. XactScore never shows them.',
  },
  {
    icon: Users,
    title: 'No 20-player ceiling.',
    body: 'PronoContest free contests cap at 20. Your office, family, or pub table can all play.',
  },
  {
    icon: Target,
    title: 'One sport. Exact scores.',
    body: 'No 12-sport maze. Just Premier League scores, a private table, and custom points.',
  },
  {
    icon: Bell,
    title: 'Picks that actually get in.',
    body: 'Invite link, 60-minute lock, and a reminder about two hours before kickoff if you still have scores to put in.',
  },
] as const

const steps = [
  {
    icon: Users,
    title: 'Join a league',
    body: 'Create a private league or enter a friend’s invite link. Ready in under a minute.',
  },
  {
    icon: Target,
    title: 'Pick the score',
    body: 'Call every Premier League score before picks lock, one hour before kickoff.',
  },
  {
    icon: BarChart2,
    title: 'Climb the table',
    body: 'Exact score pays most. Close calls and the right result still keep you in the race.',
  },
] as const

const faqs = [
  {
    q: 'Is XactScore really free?',
    a: 'Yes. No ads, no player cap, no premium tier. Create a private Premier League league and invite whoever you want.',
  },
  {
    q: 'How do I invite friends?',
    a: 'Create a league, copy the invite link, and send it. They join at xactscore.app/join/your-key.',
  },
  {
    q: 'When do picks lock?',
    a: 'Sixty minutes before kickoff. You can change your score until then.',
  },
  {
    q: 'Do I need an app store?',
    a: 'No. Open xactscore.app in Safari or Chrome and add it to your Home Screen. It runs like an app.',
  },
  {
    q: 'Is this like Superbru or PronoContest?',
    a: 'Same idea — predict scores with friends — without ads, a 20-player ceiling, or twelve other sports competing for attention.',
  },
] as const

export default function MarketingLanding({
  locale,
  nextMatch,
  recentScores,
}: {
  locale: Locale
  nextMatch: NextMatchData | null
  recentScores: ScoreData[]
}) {
  const t = getTranslations(locale)
  const origin = siteUrl()

  return (
    <div className="mx-auto max-w-5xl space-y-10 pb-10 pt-1 sm:space-y-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'WebApplication',
                name: 'XactScore',
                url: origin,
                applicationCategory: 'GameApplication',
                operatingSystem: 'Web',
                offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
                description: t('Predict Premier League scores with friends. No transfers, no squads — just the score, your league, and the table.'),
              },
              {
                '@type': 'FAQPage',
                mainEntity: faqs.map((faq) => ({
                  '@type': 'Question',
                  name: t(faq.q),
                  acceptedAnswer: { '@type': 'Answer', text: t(faq.a) },
                })),
              },
            ],
          }),
        }}
      />

      <section className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-orange-600 via-zinc-900 to-zinc-950 px-5 py-8 shadow-2xl sm:px-10 sm:py-12">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-orange-100">
              <Trophy className="h-3.5 w-3.5" />
              {t('Premier League predictions')}
            </div>
            <h1 className="max-w-xl text-3xl font-black uppercase leading-[0.95] tracking-tight text-white sm:text-5xl">
              {t('Call the scores.')}{' '}
              <span className="text-xactscore-accent">{t('Own the table.')}</span>
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-orange-50/90 sm:text-base">
              {t('Private Premier League leagues for friends, offices, and family.')}{' '}
              {t('Predict Premier League scores with friends. No transfers, no squads — just the score, your league, and the table.')}
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center">
              <Link href="/login" className={cn(buttonVariants(), 'w-full uppercase tracking-wider sm:w-auto')}>
                {t('Create a league')}
              </Link>
              <Link
                href="#join"
                className={cn(buttonVariants({ variant: 'glass' }), 'w-full uppercase tracking-wider sm:w-auto')}
              >
                {t('Have an invite?')}
              </Link>
            </div>
            <ul className="mt-6 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-wider text-orange-100/90">
              <li className="rounded-full border border-white/15 bg-black/20 px-3 py-1">{t('No ads')}</li>
              <li className="rounded-full border border-white/15 bg-black/20 px-3 py-1">{t('No player limit')}</li>
              <li className="rounded-full border border-white/15 bg-black/20 px-3 py-1">{t('Always free')}</li>
            </ul>
          </div>
          <ProductPreview locale={locale} />
        </div>
      </section>

      {nextMatch || recentScores.length ? (
        <section className="grid gap-3 sm:grid-cols-2">
          {nextMatch ? (
            <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-300">{t('Next up')}</p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2 font-bold text-zinc-100">
                  {nextMatch.homeCrest ? (
                    <Image src={nextMatch.homeCrest} alt="" width={22} height={22} className="h-5 w-5 object-contain" />
                  ) : null}
                  <span className="truncate">{nextMatch.homeTeam}</span>
                </span>
                <span className="text-xs font-black text-zinc-500">{t('vs')}</span>
                <span className="flex min-w-0 items-center justify-end gap-2 font-bold text-zinc-100">
                  <span className="truncate">{nextMatch.awayTeam}</span>
                  {nextMatch.awayCrest ? (
                    <Image src={nextMatch.awayCrest} alt="" width={22} height={22} className="h-5 w-5 object-contain" />
                  ) : null}
                </span>
              </div>
            </article>
          ) : null}
          {recentScores[0] ? (
            <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-300">{t('Recent results')}</p>
              <div className="mt-3 flex items-center justify-between gap-3 font-bold text-zinc-100">
                <span className="truncate">{recentScores[0].homeTeam}</span>
                <span className="tabular-nums text-xactscore-accent">
                  {recentScores[0].homeScore}–{recentScores[0].awayScore}
                </span>
                <span className="truncate text-right">{recentScores[0].awayTeam}</span>
              </div>
            </article>
          ) : null}
        </section>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-3">
        {steps.map(({ icon: Icon, title, body }) => (
          <article key={title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-lg shadow-black/20">
            <div className="mb-3 inline-flex rounded-xl bg-xactscore-accent/15 p-2.5 text-xactscore-accent">
              <Icon className="h-5 w-5" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-tight text-zinc-100">{t(title)}</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">{t(body)}</p>
          </article>
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-black uppercase tracking-tight text-zinc-100 sm:text-2xl">
          {t('Why groups switch')}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {reasons.map(({ icon: Icon, title, body }) => (
            <article key={title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <div className="mb-3 inline-flex rounded-xl bg-xactscore-accent/15 p-2.5 text-xactscore-accent">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-tight text-zinc-100">{t(title)}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{t(body)}</p>
            </article>
          ))}
        </div>
      </section>

      <CompareSection locale={locale} />

      <section id="join" className="scroll-mt-28 rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-8">
        <div className="mb-4 flex items-center gap-2 text-xactscore-accent">
          <Link2 className="h-5 w-5" />
          <h2 className="text-sm font-black uppercase tracking-tight text-zinc-100">{t('Have an invite?')}</h2>
        </div>
        <p className="mb-4 max-w-xl text-sm leading-6 text-zinc-400">
          {t('Create a private league or enter a friend’s invite link. Ready in under a minute.')}
        </p>
        <LandingJoinForm />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black uppercase tracking-tight text-zinc-100 sm:text-2xl">
          {t('Frequently asked questions')}
        </h2>
        {faqs.map((faq) => (
          <details key={faq.q} className="group rounded-2xl border border-white/10 bg-white/[0.04]">
            <summary className="cursor-pointer list-none px-5 py-4 text-sm font-black uppercase tracking-tight text-zinc-100 marker:hidden">
              {t(faq.q)}
            </summary>
            <p className="border-t border-white/10 px-5 py-4 text-sm leading-6 text-zinc-400">{t(faq.a)}</p>
          </details>
        ))}
      </section>

      <div className="rounded-2xl border border-orange-400/20 bg-gradient-to-br from-orange-600/30 to-zinc-950 px-5 py-8 text-center sm:px-10">
        <p className="text-xl font-black uppercase tracking-tight text-white sm:text-2xl">{t('Switch from Superbru or PronoContest')}</p>
        <p className="mx-auto mt-2 max-w-lg text-sm text-orange-50/80">
          {t('Always free, no ads, unlimited players. Built for a private Premier League table — not a sports megamenu.')}
        </p>
        <Link href="/login" className={cn(buttonVariants(), 'mt-5 uppercase tracking-wider')}>
          {t('Start for free')}
        </Link>
      </div>
    </div>
  )
}
