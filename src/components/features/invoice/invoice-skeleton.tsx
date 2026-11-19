import { Skeleton } from "@/components/ui/skeleton";

// 실제 레이아웃(헤더, 메타, 표, 합계)과 같은 형태의 로딩 화면
export function InvoiceSkeleton() {
  return (
    <div className="space-y-8" aria-hidden>
      <div className="space-y-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-9 w-2/3" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </div>
      <Skeleton className="h-48 w-full" />
      <Skeleton className="ml-auto h-16 w-full max-w-xs" />
    </div>
  );
}
