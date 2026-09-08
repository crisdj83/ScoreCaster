'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Dices } from 'lucide-react'
import { Dialog } from '@/components/ui/dialog'
import { useTranslations } from '../../../components/LocaleProvider'
import { cn } from '@/lib/utils'
import { saveGameweekPredictions } from './actions'

function randomGoal() {
  if (Math.random() < 0.75) {
    return Math.floor(Math.random() * 3)
  }
  return Math.floor(Math.random() * 6)
}

export default function SuperLuckyButton({
  contestId,
  matchIds,
}: {
  contestId: string
  matchIds: string[]
}) {
  const t = useTranslations()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [rolling, setRolling] = useState(false)
  const [, startTransition] = useTransition()

  if (matchIds.length === 0) return null

  const fillGameweek = async () => {
    setRolling(true)
    try {
      await saveGameweekPredictions(
        contestId,
        matchIds.map(matchId => ({
          matchId,
          homeScore: randomGoal(),
          awayScore: randomGoal(),
        }))
      )
      startTransition(() => {
        router.refresh()
      })
    } finally {
      window.setTimeout(() => setRolling(false), 450)
    }
  }

  return (
    <>
      <span className="inline-flex shrink-0 overflow-hidden rounded-xl bg-[rgb(255_138_43_/_0.6)] p-[1.5px]">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="prediction-fixture-content prediction-lucky-pill inline-flex items-center gap-2 px-3 py-2 text-orange-200 drop-shadow-[0_1px_2px_rgb(0_0_0/0.75)] transition hover:brightness-110 active:scale-95 sm:gap-2.5 sm:px-4 sm:py-2.5"
          aria-label={t("I'm lucky")}
        >
          <Dices className={cn('h-6 w-6 sm:h-7 sm:w-7', rolling && 'animate-spin')} />
          <span className="text-[10px] font-black uppercase leading-none tracking-wider sm:text-xs">
            {t("I'm lucky")}
          </span>
        </button>
      </span>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={t('ATTENTION!')}
        titleClassName="text-center text-xl font-black uppercase tracking-[0.2em] text-amber-300"
        description={t(
          "You're handing the whole gameweek to fate. Unlocked matches get a fresh roll and your current picks for those games get benched. No refunds, only glory."
        )}
        confirmLabel={t('Yes')}
        cancelLabel={t('No')}
        onConfirm={fillGameweek}
      />
    </>
  )
}
