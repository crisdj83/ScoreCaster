/** Shared frosted-glass tab / pill styles for nav uniformity */
export const tabBase =
  'inline-flex items-center gap-1.5 rounded-full border px-3 text-[10px] font-bold uppercase tracking-wider outline-none transition-all focus-visible:outline-none sm:gap-2 sm:px-4 sm:text-xs'

export const tabActive =
  'border-white/25 bg-white/10 text-orange-100 shadow-sm backdrop-blur-md'

export const tabInactive =
  'border-zinc-700/80 bg-zinc-900/60 text-zinc-300 backdrop-blur-sm hover:border-white/20 hover:bg-white/5 hover:text-zinc-100'

/** Contest / hub tabs use rounded-xl but the same frosted selected look */
export const segmentBase =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold uppercase tracking-wider outline-none transition-all focus-visible:outline-none whitespace-nowrap md:px-4 md:text-sm'

export const segmentActive =
  'border-white/25 bg-white/10 text-orange-100 shadow-sm backdrop-blur-md'

export const segmentInactive =
  'border-transparent bg-transparent text-zinc-400 hover:border-white/15 hover:bg-white/5 hover:text-zinc-100'
