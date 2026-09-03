import { redirect } from 'next/navigation'

export default async function ContestBasePage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  // Automatically redirect to the predictions tab
  redirect(`/contests/${params.id}/predictions`)
}