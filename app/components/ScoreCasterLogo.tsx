import { Activity, CircleDot } from 'lucide-react'

export default function ScoreCasterLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex items-center ${compact ? 'gap-2' : 'gap-3'}`}>
      <div className={`relative flex items-center justify-center rounded-2xl bg-[#0d0d0d] text-[#ff7a18] shadow-lg shadow-orange-950/30 ${compact ? 'h-9 w-9' : 'h-14 w-14'}`}>
        <Activity className={compact ? 'h-5 w-5' : 'h-8 w-8'} strokeWidth={3} />
        <CircleDot className={`absolute ${compact ? 'right-1 top-1 h-2.5 w-2.5' : 'right-1.5 top-1.5 h-3.5 w-3.5'}`} fill="currentColor" strokeWidth={2.5} />
      </div>
      <span className={`font-black uppercase tracking-[-0.06em] text-[#f5f5f5] ${compact ? 'text-lg' : 'text-4xl md:text-5xl'}`}>
        ScoreCaster
      </span>
    </div>
  )
}
