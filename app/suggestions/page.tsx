import { Lightbulb, Send } from 'lucide-react'
import { createClient } from '../../lib/supabase/server'
import { redirect } from 'next/navigation'
import { createSuggestion } from './actions'
import { getTranslations } from '../../lib/i18n'
import { getServerLocale } from '../../lib/i18n-server'

export default async function SuggestionsPage(props: {
  searchParams: Promise<{ error?: string; success?: string }>
}) {
  const searchParams = await props.searchParams
  const t = getTranslations(getServerLocale())
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) redirect('/login')

  const { data: suggestions } = await supabase
    .from('suggestions')
    .select('id, title, description, status, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12 pt-2">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-gray-900 p-2.5 text-orange-300">
          <Lightbulb className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-gray-900">{t('Suggestions')}</h1>
          <p className="text-sm text-gray-500">{t('Share ideas and help shape the future of ScoreCaster.')}</p>
        </div>
      </div>

      {searchParams?.success && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">{t(searchParams.success)}</div>
      )}
      {searchParams?.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{searchParams.error}</div>
      )}

      <form action={createSuggestion} className="space-y-4 rounded-2xl border border-orange-500/40 bg-orange-500/10 p-6 shadow-lg">
        <h2 className="font-black uppercase tracking-tight text-orange-300">{t('Submit an idea')}</h2>
        <div className="space-y-1.5">
          <label htmlFor="suggestion-title" className="text-sm font-bold text-gray-900">{t('Suggestion title')}</label>
          <input
            id="suggestion-title"
            name="title"
            required
            maxLength={120}
            placeholder={t('What would make ScoreCaster better?')}
            className="w-full rounded-xl border border-orange-500/40 bg-[#242424] px-4 py-3 text-white placeholder:text-gray-500"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="suggestion-description" className="text-sm font-bold text-gray-900">{t('Tell us more')}</label>
          <textarea
            id="suggestion-description"
            name="description"
            required
            maxLength={2000}
            rows={4}
            placeholder={t('Describe your idea or the problem it would solve...')}
            className="w-full rounded-xl border border-orange-500/40 bg-[#242424] px-4 py-3 text-white placeholder:text-gray-500"
          />
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-xs font-black uppercase tracking-wider text-white transition-colors hover:bg-gray-800">
          <Send className="h-4 w-4" /> {t('Submit suggestion')}
        </button>
      </form>

      <section className="space-y-3">
        <h2 className="text-xl font-black uppercase tracking-tight text-gray-900">{t('Community suggestions')}</h2>
        {!suggestions?.length ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-10 text-center text-gray-500">{t('No suggestions yet. Be the first to share an idea!')}</div>
        ) : (
          suggestions.map((suggestion) => (
            <article key={suggestion.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-lg">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h3 className="text-lg font-black text-gray-900">{suggestion.title}</h3>
                <span className="rounded-full bg-orange-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-orange-300">
                  {t(suggestion.status === 'submitted' ? 'Submitted' : suggestion.status)}
                </span>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-600">{suggestion.description}</p>
              <p className="mt-4 text-xs font-bold uppercase tracking-wider text-gray-400">
                {t('Shared')} · {new Date(suggestion.created_at).toLocaleDateString()}
              </p>
            </article>
          ))
        )}
      </section>
    </div>
  )
}
