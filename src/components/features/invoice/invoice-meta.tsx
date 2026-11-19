import { formatDate } from "@/lib/format";
import type { Invoice } from "@/types/invoice";

// 날짜가 없으면 "-"로 표시합니다.
function displayDate(value: string | null) {
  return value ? formatDate(value) : "-";
}

export function InvoiceMeta({ invoice }: { invoice: Invoice }) {
  return (
    <dl className="grid grid-cols-2 gap-4 text-sm">
      <div className="space-y-1">
        <dt className="text-muted-foreground">발행일</dt>
        <dd className="font-medium">{displayDate(invoice.issueDate)}</dd>
      </div>
      <div className="space-y-1">
        <dt className="text-muted-foreground">유효기간</dt>
        <dd className="font-medium">{displayDate(invoice.validUntil)}</dd>
      </div>
    </dl>
  );
}
