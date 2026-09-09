import { Skeleton } from '@/components/ui/skeleton'

export default function PredictionsLoading() {
  return (
    <div className="mx-auto max-w-xl space-y-3">
      <Skeleton className="h-11 w-full rounded-xl" />
      <Skeleton className="h-8 w-full rounded-lg" />
      <div className="space-y-1.5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
