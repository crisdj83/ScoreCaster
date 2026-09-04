import { CircleDot, Goal, Medal, Trophy } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const ICONS: LucideIcon[] = [CircleDot, Goal, Trophy, Medal]

function iconIndex(value: string) {
  return Array.from(value).reduce((total, character) => total + character.charCodeAt(0), 0) % ICONS.length
}

export default function ContestIcon({ contestId, size = 'md' }: { contestId: string; size?: 'sm' | 'md' }) {
  const Icon = ICONS[iconIndex(contestId)]
  const dimensions = size === 'sm' ? 'h-9 w-9' : 'h-12 w-12'
  const iconSize = size === 'sm' ? 'h-5 w-5' : 'h-6 w-6'

  return (
    <span className={`inline-flex ${dimensions} shrink-0 items-center justify-center rounded-xl border border-orange-300/40 bg-gradient-to-br from-orange-400 to-orange-700 text-white shadow-lg`}>
      <Icon className={iconSize} aria-hidden="true" />
    </span>
  )
}
