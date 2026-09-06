export default function SiteFooter() {
  return (
    <footer className="mt-auto flex flex-col items-center gap-3 px-3 py-8 text-center">
      <div className="flex items-center gap-5">
        <a
          href="https://instagram.com/cristiansfariac"
          target="_blank"
          rel="noreferrer"
          aria-label="Instagram"
          className="text-zinc-400 transition-colors hover:text-zinc-100"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-none stroke-current" strokeWidth="1.75">
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="0.75" className="fill-current stroke-none" />
          </svg>
        </a>
        <a
          href="https://youtube.com/@SyntiX-Dj"
          target="_blank"
          rel="noreferrer"
          aria-label="YouTube"
          className="text-zinc-400 transition-colors hover:text-zinc-100"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-none stroke-current" strokeWidth="1.75">
            <rect x="3" y="6" width="18" height="12" rx="3" />
            <path d="m10 9 5 3-5 3z" className="fill-current stroke-none" />
          </svg>
        </a>
      </div>
      <p className="max-w-xl text-xs font-medium tracking-wide text-orange-100/70">
        Built with 10% skill, 90% Googling, and love from Sfariac Cristian.
      </p>
      <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.2em] text-orange-300/70">
        <span aria-hidden="true">©</span>
        <span>XactScore</span>
      </p>
    </footer>
  )
}
