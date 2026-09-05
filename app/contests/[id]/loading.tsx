import { Skeleton } from '@/components/ui/skeleton'

export default function ContestLoading() {
  return (
    <div className="mx-auto w-full space-y-6 pb-12 pt-4">
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-14 w-full rounded-xl" />
      <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  )
}
