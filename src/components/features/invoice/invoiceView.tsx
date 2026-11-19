import type { Invoice } from "@/types/invoice";

import { DownloadPdfButton } from "./downloadPdfButton";
import { InvoiceHeader } from "./invoiceHeader";
import { InvoiceItemsTable } from "./invoiceItemsTable";
import { InvoiceMeta } from "./invoiceMeta";
import { InvoiceSummary } from "./invoiceSummary";

// 견적서 본문 조합 — invoice props만으로 렌더링합니다.
export function InvoiceView({ invoice }: { invoice: Invoice }) {
  return (
    <article className="space-y-8">
      <InvoiceHeader invoice={invoice} />
      <InvoiceMeta invoice={invoice} />
      <InvoiceItemsTable invoice={invoice} />
      <InvoiceSummary invoice={invoice} />
      <div className="flex justify-end print:hidden">
        <DownloadPdfButton />
      </div>
    </article>
  );
}
