import type { Invoice } from "@/types/invoice";

import { DownloadPdfButton } from "./download-pdf-button";
import { InvoiceHeader } from "./invoice-header";
import { InvoiceItemsTable } from "./invoice-items-table";
import { InvoiceMeta } from "./invoice-meta";
import { InvoiceSummary } from "./invoice-summary";

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
