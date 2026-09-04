'use client'

import { useTranslations } from '../../components/LocaleProvider'

export default function DeleteLeagueButton({ action, contestId }: { action: (formData: FormData) => void; contestId: string }) {
  const t = useTranslations()
  return (
    <form action={action} onSubmit={(event) => {
      if (!window.confirm(t('Delete this league permanently? All members, predictions, and settings will be removed.'))) {
        event.preventDefault()
      }
    }}>
      <input type="hidden" name="contest_id" value={contestId} />
      <button type="submit" className="rounded-xl border border-red-200 bg-red-50 px-6 py-3 text-xs font-black uppercase tracking-wider text-red-700 transition-colors hover:bg-red-100">
        {t('Delete League')}
      </button>
    </form>
  )
}
