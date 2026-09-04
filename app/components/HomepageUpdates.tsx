'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Newspaper, Pencil, Send, Trash2 } from 'lucide-react'
import { useTranslations } from './LocaleProvider'
import { createNewsPost, deleteNewsPost, updateNewsPost } from '../news/actions'

type Update = {
  id: string
  title: string
  body: string
  created_at: string
}

export default function HomepageUpdates({ updates, isOwner }: { updates: Update[]; isOwner: boolean }) {
  const t = useTranslations()
  const searchParams = useSearchParams()
  const [isWriting, setIsWriting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const updateSaved = searchParams.get('success') === 'Update saved.'

  useEffect(() => {
    if (updateSaved) {
      setIsWriting(false)
      setEditingId(null)
    }
  }, [updateSaved])

  return (
    <section className="overflow-hidden rounded-2xl border border-blue-900/80 bg-gradient-to-tr from-orange-600 via-[#242424] to-[#0d0d0d] shadow-lg shadow-black/30">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes updates-scroll {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        .updates-marquee {
          animation: updates-scroll 28s linear infinite;
        }
        .updates-marquee:hover {
          animation-play-state: paused;
        }
      ` }} />
      <div className="flex items-center justify-between gap-3 border-b border-orange-500/30 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-orange-500 p-2 text-black">
            <Newspaper className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight text-white">{t('Website Updates')}</h2>
            <p className="text-xs uppercase tracking-[0.2em] text-orange-300">{t('From the ScoreCaster owner')}</p>
          </div>
        </div>
        {isOwner && (
          <button
            type="button"
            onClick={() => setIsWriting(value => !value)}
            className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-orange-100 backdrop-blur-sm transition hover:border-white/40 hover:bg-white/20"
          >
            {isWriting ? t('Close') : t('Write update')}
          </button>
        )}
      </div>
      {isOwner && isWriting && (
        <form action={createNewsPost} className="space-y-3 border-b border-orange-500/30 bg-orange-500/10 p-4 sm:p-5">
          <input
            name="title"
            required
            placeholder={t('Headline')}
            className="w-full rounded-xl border border-orange-500/40 bg-[#242424] px-4 py-3 text-sm text-white placeholder:text-gray-500"
          />
          <textarea
            name="body"
            required
            rows={4}
            placeholder={t('Share an update with the league...')}
            className="w-full rounded-xl border border-orange-500/40 bg-[#242424] px-4 py-3 text-sm text-white placeholder:text-gray-500"
          />
          <input type="hidden" name="redirect_to" value="/" />
          <button className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-xs font-black uppercase tracking-wider text-black transition hover:bg-orange-300">
            <Send className="h-4 w-4" />
            {t('Publish')}
          </button>
        </form>
      )}
      {updates.length ? (
        <div className="h-64 overflow-hidden">
          <div className="updates-marquee flex flex-col gap-3 p-4 sm:p-5">
            {updates.map(update => (
              <article key={update.id} className="rounded-xl border border-orange-500/25 bg-[#242424] p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-orange-300">
                  {new Date(update.created_at).toLocaleDateString()}
                </p>
                {isOwner && editingId === update.id ? (
                  <form action={updateNewsPost} className="mt-3 space-y-2">
                    <input type="hidden" name="post_id" value={update.id} />
                    <input type="hidden" name="redirect_to" value="/" />
                    <input name="title" required defaultValue={update.title} className="w-full rounded-lg border border-orange-500/40 bg-[#151515] px-3 py-2 text-sm text-white" />
                    <textarea name="body" required rows={4} defaultValue={update.body} className="w-full rounded-lg border border-orange-500/40 bg-[#151515] px-3 py-2 text-sm text-white" />
                    <div className="flex gap-2">
                      <button className="rounded-lg bg-orange-500 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-black">{t('Save')}</button>
                      <button type="button" onClick={() => setEditingId(null)} className="rounded-lg border border-gray-600 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-gray-300">{t('Cancel')}</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="mt-1 text-lg font-black text-white">{update.title}</h3>
                      {isOwner && (
                        <div className="flex shrink-0 gap-2">
                          <button type="button" onClick={() => setEditingId(update.id)} aria-label={t('Edit update')} className="text-orange-300 hover:text-orange-100">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <form action={deleteNewsPost}>
                            <input type="hidden" name="post_id" value={update.id} />
                            <input type="hidden" name="redirect_to" value="/" />
                            <button aria-label={t('Delete update')} className="text-red-400 hover:text-red-300">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </form>
                        </div>
                      )}
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-300">{update.body}</p>
                  </>
                )}
              </article>
            ))}
          </div>
        </div>
      ) : (
        <p className="p-8 text-center text-sm text-gray-400">{t('No website updates yet.')}</p>
      )}
    </section>
  )
}
