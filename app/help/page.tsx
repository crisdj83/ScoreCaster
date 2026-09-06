import { CircleHelp, ChevronDown } from 'lucide-react'
import { getTranslations } from '../../lib/i18n'
import { getServerLocale } from '../../lib/i18n-server'
import { PageHeader } from '@/components/ui/page-header'

const sections = [
  {
    title: 'Getting started',
    body: 'Create an account, choose a username, and head to the Contests page to join a league or create your own.',
  },
  {
    title: 'Making predictions',
    body: 'Open a contest and select Predictions to see the fixture calendar. Choose a score for both teams; your prediction is saved automatically until kickoff.',
  },
  {
    title: 'Scoring and rankings',
    body: 'You earn the most points for an exact score, with additional points for a close prediction or the correct result. Check Ranking to follow your progress against the rest of your league.',
  },
  {
    title: 'Contests and invites',
    body: 'Contest admins can choose full season, first half, or second half, customize scoring, and share the invite key with friends. You can belong to multiple contests at once.',
  },
  {
    title: 'Your profile',
    body: 'Use Profile to update your username, favorite Premier League team, avatar, and personal quote. Your profile helps your league recognize you.',
  },
  {
    title: 'Messages',
    body: 'Messages are discussions between members of your contests. Use them to talk about fixtures, banter, and league news.',
  },
] as const

export default function HelpPage() {
  const t = getTranslations(getServerLocale())

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-12 pt-2">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-zinc-950 p-2.5 text-xactscore-accent">
          <CircleHelp className="h-6 w-6" />
        </div>
        <PageHeader
          className="mb-0"
          title={t('Help')}
          description={t('Everything you need to get the most from XactScore.')}
        />
      </div>

      <div className="space-y-3">
        {sections.map((section) => (
          <details
            key={section.title}
            className="group rounded-xl border border-zinc-800 bg-zinc-900 shadow-lg shadow-black/20"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-black text-zinc-100 marker:hidden">
              <span>{t(section.title)}</span>
              <ChevronDown className="h-5 w-5 shrink-0 text-xactscore-accent transition-transform group-open:rotate-180" />
            </summary>
            <p className="border-t border-zinc-800 px-5 pb-5 pt-4 text-sm leading-6 text-zinc-400">
              {t(section.body)}
            </p>
          </details>
        ))}
      </div>
    </div>
  )
}
