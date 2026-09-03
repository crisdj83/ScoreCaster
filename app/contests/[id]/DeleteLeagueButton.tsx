'use client'

export default function DeleteLeagueButton({ action, contestId }: { action: (formData: FormData) => void; contestId: string }) {
  return (
    <form action={action} onSubmit={(event) => {
      if (!window.confirm('Delete this league permanently? All members, predictions, and settings will be removed.')) {
        event.preventDefault()
      }
    }}>
      <input type="hidden" name="contest_id" value={contestId} />
      <button type="submit" className="rounded-xl border border-red-200 bg-red-50 px-6 py-3 text-xs font-black uppercase tracking-wider text-red-700 transition-colors hover:bg-red-100">
        Delete League
      </button>
    </form>
  )
}
