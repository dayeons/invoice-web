import { StatusBadge } from "@/components/common/statusBadge";
import type { Invoice } from "@/types/invoice";

export function InvoiceHeader({ invoice }: { invoice: Invoice }) {
  return (
    <header className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-muted-foreground text-sm break-all">
          {invoice.invoiceNumber}
        </p>
        <StatusBadge status={invoice.status} />
      </div>
      <h1 className="text-2xl font-bold break-words sm:text-3xl">
        {invoice.clientName}
      </h1>
    </header>
  );
}
