import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/format";
import type { Invoice } from "@/types/invoice";

export function InvoiceSummary({ invoice }: { invoice: Invoice }) {
  const subtotal = invoice.items.reduce((sum, item) => sum + item.amount, 0);

  return (
    <section aria-label="합계" className="ml-auto w-full max-w-xs space-y-2">
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">소계</dt>
          <dd>{formatCurrency(subtotal)}</dd>
        </div>
        <Separator />
        <div className="flex justify-between gap-4 text-base font-bold">
          <dt>총액</dt>
          <dd>{formatCurrency(invoice.totalAmount)}</dd>
        </div>
      </dl>
    </section>
  );
}
