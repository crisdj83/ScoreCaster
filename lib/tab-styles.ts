/** Shared frosted-glass tab / pill styles for nav uniformity */
export const tabBase =
  'inline-flex items-center gap-1.5 rounded-full border px-3 text-[10px] font-bold uppercase tracking-wider outline-none transition-all duration-300 active:scale-95 focus-visible:outline-none sm:gap-2 sm:px-4 sm:text-xs'

export const tabActive =
  'border-white/20 bg-white/10 text-orange-200 shadow-lg shadow-orange-500/10 backdrop-blur-md'

export const tabInactive =
  'border-white/[0.06] bg-white/[0.03] text-zinc-400 backdrop-blur-sm hover:border-white/15 hover:bg-white/10 hover:text-zinc-100'

/** Contest / hub tabs use rounded-xl but the same frosted selected look */
export const segmentBase =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold uppercase tracking-wider outline-none transition-all duration-300 active:scale-95 focus-visible:outline-none whitespace-nowrap md:px-4 md:text-sm'

export const segmentActive =
  'border-white/20 bg-white/10 text-orange-200 shadow-lg shadow-orange-500/10 backdrop-blur-md'

export const segmentInactive =
  'border-transparent bg-transparent text-zinc-400 hover:border-white/15 hover:bg-white/10 hover:text-zinc-100'

/** iOS-style bottom tab bar item (mobile floating nav) */
export const iosTabItem =
  'flex min-h-11 min-w-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl py-1.5 text-[10px] font-bold uppercase tracking-wide transition-all duration-300 active:scale-90'
