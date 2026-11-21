import { Skeleton } from "@/components/ui/skeleton"

// 목록 로딩 자리표시. 건수 줄과 행 6개를 흉내 냅니다.
export function InvoiceListSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-16 w-full md:h-12" />
        ))}
      </div>
    </div>
  )
}
