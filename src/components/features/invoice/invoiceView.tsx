import { CopyLinkButton } from "@/components/common/copyLinkButton";
import type { Invoice } from "@/types/invoice";

import { DownloadPdfButton } from "./downloadPdfButton";
import { InvoiceHeader } from "./invoiceHeader";
import { InvoiceItemsTable } from "./invoiceItemsTable";
import { InvoiceMeta } from "./invoiceMeta";
import { InvoiceSummary } from "./invoiceSummary";

// 견적서 본문 조합 — invoice props만으로 렌더링합니다.
// shareUrl은 서버에서 만든 공유 링크이며, 없으면 링크 복사 버튼을 그리지 않습니다.
export function InvoiceView({
  invoice,
  shareUrl,
}: {
  invoice: Invoice;
  shareUrl?: string;
}) {
  return (
    <article className="space-y-8">
      <InvoiceHeader invoice={invoice} />
      <InvoiceMeta invoice={invoice} />
      <InvoiceItemsTable invoice={invoice} />
      <InvoiceSummary invoice={invoice} />
      <div className="flex flex-wrap justify-end gap-2 print:hidden">
        {shareUrl && <CopyLinkButton url={shareUrl} />}
        <DownloadPdfButton invoiceId={invoice.id} />
      </div>
    </article>
  );
}
