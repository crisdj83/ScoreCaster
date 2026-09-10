// Fixed both imports to go up 4 folders instead of 5!
import { createClient } from '../../../../lib/supabase/server'
import { getPLMatches } from '../../../../lib/football'
import { isMatchInContestSeason, normalizeSeasonLength } from '../../../../lib/contest-season'
import { getActiveMatchday, isOpenForPrediction, isPredictionLocked } from '../../../../lib/scoring'
import PredictionCard, { KickoffGroupHeading } from './PredictionCard'
import SuperLuckyButton from './SuperLuckyButton'
import MatchdayNav from './MatchdayNav'
import { getTranslations } from '../../../../lib/i18n'
import { getServerLocale } from '../../../../lib/i18n-server'
import LiveRefresh from '../../../components/LiveRefresh'

type PlMatch = {
  id: number | string
  utcDate: string
  status?: string
  matchday?: number | null
  homeTeam: { name: string; shortName?: string; tla?: string; crest?: string }
  awayTeam: { name: string; shortName?: string; tla?: string; crest?: string }
}

function kickoffMinuteKey(utcDate: string) {
  const kickoff = new Date(utcDate).getTime()
  if (!Number.isFinite(kickoff)) return 'unknown'
  return String(Math.floor(kickoff / 60_000))
}

function groupFixturesByKickoff(matches: PlMatch[]) {
  const groups: { key: string; minuteKey: string; utcDate: string; matches: PlMatch[] }[] = []
  for (const match of matches) {
    const minuteKey = kickoffMinuteKey(match.utcDate)
    const last = groups[groups.length - 1]
    if (last && last.minuteKey === minuteKey) {
      last.matches.push(match)
      continue
    }
    groups.push({
      key: `${minuteKey}-${groups.length}`,
      minuteKey,
      utcDate: match.utcDate,
      matches: [match],
    })
  }
  return groups
}

export default async function PredictionsPage(props: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ md?: string }>
}) {
  const params = await props.params
  const searchParams = await props.searchParams
  const t = getTranslations(getServerLocale())
  const supabase = await createClient()

  // 1. Get logged in user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: contest } = await supabase
    .from('contests')
    .select('season_length')
    .eq('id', params.id)
    .single()
  const seasonLength = normalizeSeasonLength(contest?.season_length)

  // 2. Fetch the live matches from football-data.org and enforce the contest season.
  let seasonMatches: PlMatch[] = []
  try {
    const data = (await getPLMatches()) as { matches?: PlMatch[] }
    seasonMatches = (data.matches || []).filter((match) => isMatchInContestSeason(match, seasonLength))
  } catch (error) {
    console.error('Predictions fixtures fetch failed:', error)
    seasonMatches = []
  }
  
  // 3. Figure out which matchday is currently active.
  // Ignore stale scheduled records and use the closest genuinely upcoming fixture.
  const now = Date.now()
  const activeMatchday = getActiveMatchday(seasonMatches, now)
  const matchdays = Array.from(
    new Set(
      seasonMatches
        .map((match) => Number(match.matchday))
        .filter((matchday) => Number.isFinite(matchday) && matchday > 0)
    )
  ).sort((a, b) => a - b)
  const requestedMatchday = Number(searchParams.md)
  const selectedMatchday = matchdays.includes(requestedMatchday)
    ? requestedMatchday
    : activeMatchday && matchdays.includes(activeMatchday)
      ? activeMatchday
      : matchdays[matchdays.length - 1] || null

  const matchdayFixtures = selectedMatchday
    ? seasonMatches
        .filter((m) => Number(m.matchday) === selectedMatchday)
        .sort((a, b) => {
          const rank = (match: PlMatch) => {
            const status = String(match.status || '')
            const kickoff = new Date(match.utcDate).getTime()
            const finished =
              ['FINISHED', 'AWARDED'].includes(status) ||
              (Number.isFinite(kickoff) && kickoff <= now - 3 * 60 * 60 * 1000)
            if (finished) return 2
            if (isPredictionLocked(match.utcDate, now)) return 1
            return 0
          }
          const rankDiff = rank(a) - rank(b)
          if (rankDiff !== 0) return rankDiff
          return new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime()
        })
    : []
  const allowedMatchIds = seasonMatches.map((match) => String(match.id))

  // 4. Fetch the user's existing predictions from Supabase for this contest
  const { data: myPredictions } = allowedMatchIds.length
    ? await supabase
      .from('predictions')
      .select('id, contest_id, match_id, user_id, predicted_home_score, predicted_away_score, points, is_exact, is_correct')
      .eq('contest_id', params.id)
      .eq('user_id', user.id)
      .in('match_id', allowedMatchIds)
    : { data: [] }

  const openThisWeek = matchdayFixtures.filter((match) => isOpenForPrediction(match, now))
  const unmadeMatches = openThisWeek.filter(
    (match) =>
      !myPredictions?.some(
        (prediction) =>
          String(prediction.match_id) === String(match.id) &&
          prediction.predicted_home_score !== null &&
          prediction.predicted_home_score !== undefined
      )
  )
  const picksLeft = unmadeMatches.length

  return (
    <>
    <div className="content-panel min-w-0 p-1.5 sm:p-4 dark:border-0 dark:!bg-transparent dark:p-0 dark:shadow-none">
      <LiveRefresh refreshAfter={matchdayFixtures.map((match) => match.utcDate)} />
      {selectedMatchday ? (
        <MatchdayNav
          contestId={params.id}
          matchdays={matchdays}
          selected={selectedMatchday}
          active={activeMatchday}
        />
      ) : (
        <p className="mb-3 text-sm text-zinc-500">{t('Season Ended / No Fixtures')}</p>
      )}
      <div className="space-y-3 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] sm:space-y-4 lg:pb-16">
        {groupFixturesByKickoff(matchdayFixtures).map((group, index) => (
          <section key={group.key} className="space-y-1.5 sm:space-y-2">
            <KickoffGroupHeading
              utcDate={group.utcDate}
              aside={
                index === 0 ? (
                  <>
                    {openThisWeek.length > 0 ? (
                      picksLeft > 0 ? (
                        <span className="shrink-0 rounded-full bg-xactscore-accent px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-xactscore-bg">
                          {picksLeft} {picksLeft === 1 ? t('pick left') : t('picks left')}
                        </span>
                      ) : (
                        <span className="shrink-0 rounded-full border border-slate-200 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:border-white/15">
                          {t('All picks in')}
                        </span>
                      )
                    ) : null}
                    <p className="min-w-0 truncate text-right text-[10px] font-medium leading-none text-slate-500">
                      {t('Picks lock 60 minutes before kickoff.')}
                    </p>
                  </>
                ) : undefined
              }
            />
            {group.matches.map((match) => {
              const existingPrediction = myPredictions?.find(p => String(p.match_id) === String(match.id))
              return (
                <PredictionCard
                  key={match.id}
                  match={match}
                  contestId={params.id}
                  existingPrediction={existingPrediction}
                />
              )
            })}
          </section>
        ))}
      </div>
    </div>
    {picksLeft > 0 ? (
      <SuperLuckyButton
        contestId={params.id}
        matchIds={unmadeMatches.map((match) => String(match.id))}
      />
    ) : null}
    </>
  )
}