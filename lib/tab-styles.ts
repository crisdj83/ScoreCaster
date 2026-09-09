/** Shared frosted-glass tab / pill styles for nav uniformity */
export const tabBase =
  'inline-flex items-center gap-1.5 rounded-full border px-3 text-[10px] font-bold uppercase tracking-wider outline-none transition-all duration-300 active:scale-95 focus-visible:outline-none sm:gap-2 sm:px-4 sm:text-xs'

export const tabActive =
  'border-transparent bg-transparent text-indigo-600 shadow-none backdrop-blur-md dark:border-white/20 dark:bg-white/10 dark:text-orange-200'

export const tabInactive =
  'border-xactscore-border bg-xactscore-surface text-xactscore-muted backdrop-blur-sm hover:border-slate-200 hover:bg-slate-100 hover:text-xactscore-text'

/** Contest / hub tabs use rounded-xl but the same frosted selected look */
export const segmentBase =
  'inline-flex min-h-11 items-center justify-center gap-1 rounded-xl border py-2.5 text-[10px] font-bold uppercase tracking-wider outline-none transition-all duration-300 active:scale-95 focus-visible:outline-none whitespace-nowrap sm:gap-2 sm:text-xs md:px-4 md:text-sm'

export const segmentActive =
  'border-transparent bg-indigo-100 text-indigo-700 shadow-none backdrop-blur-md dark:border-white/20 dark:bg-white/10 dark:text-orange-200'

export const segmentInactive =
  'border-transparent bg-transparent text-xactscore-muted hover:border-slate-200 hover:bg-slate-100 hover:text-xactscore-text'

/** iOS-style bottom tab bar item (mobile floating nav) */
export const iosTabItem =
  'flex min-h-11 min-w-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-full px-0.5 py-1.5 text-[9px] font-bold uppercase tracking-normal transition-all duration-300 active:scale-90'
