import { joinContestWithKey } from '../../contests/actions'

export const metadata = {
  robots: { index: false, follow: false },
}

export default async function JoinByKeyPage(props: { params: Promise<{ key: string }> }) {
  const { key } = await props.params
  await joinContestWithKey(key)
}
