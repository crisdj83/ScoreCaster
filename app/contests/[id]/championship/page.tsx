import { redirect } from 'next/navigation'

export default async function ChampionshipPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  redirect(`/contests/${id}/fixtures`)
}
