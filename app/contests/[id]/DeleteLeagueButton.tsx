'use client'

import { useState } from 'react'
import { useTranslations } from '../../components/LocaleProvider'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'

export default function DeleteLeagueButton({
  action,
  contestId,
}: {
  action: (formData: FormData) => void | Promise<void>
  contestId: string
}) {
  const t = useTranslations()
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button type="button" variant="destructive" className="uppercase tracking-wider" onClick={() => setOpen(true)}>
        {t('Delete League')}
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={t('Delete League')}
        description={t(
          'Delete this league permanently? All members, predictions, and settings will be removed.'
        )}
        confirmLabel={t('Delete League')}
        cancelLabel={t('Cancel')}
        destructive
        onConfirm={async () => {
          const formData = new FormData()
          formData.set('contest_id', contestId)
          await action(formData)
        }}
      />
    </>
  )
}
