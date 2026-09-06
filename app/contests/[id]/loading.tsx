import { Skeleton } from '@/components/ui/skeleton'

export default function ContestLoading() {
  return (
    <div className="mx-auto w-full space-y-3 pb-12 pt-1 sm:space-y-6 sm:pt-4">
      <Skeleton className="h-10 w-full rounded-full md:hidden" />
      <Skeleton className="hidden h-32 w-full rounded-xl md:block" />
      <Skeleton className="h-12 w-full rounded-xl" />
      <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  )
}
