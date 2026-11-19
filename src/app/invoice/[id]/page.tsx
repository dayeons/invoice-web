import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { InvoiceSkeleton } from "@/components/features/invoice/invoiceSkeleton";
import { InvoiceView } from "@/components/features/invoice/invoiceView";
import { getMockInvoice } from "@/lib/mock/invoice";
import { getInvoice } from "@/lib/notion/invoice";

// 고유 링크 페이지이므로 검색 엔진 색인을 막습니다.
export const metadata: Metadata = {
  title: "견적서",
  robots: { index: false, follow: false },
};

// 견적서 조회 페이지 (F002, F003, F011, F012)
// 동적 params는 런타임 데이터이므로 Suspense 경계 안에서 읽습니다.
export default function InvoicePage({ params }: PageProps<"/invoice/[id]">) {
  return (
    <main className="py-8 sm:py-12">
      <Container className="max-w-3xl">
        <Suspense fallback={<InvoiceSkeleton />}>
          <InvoiceContent params={params} />
        </Suspense>
      </Container>
    </main>
  );
}

async function InvoiceContent({
  params,
}: {
  params: PageProps<"/invoice/[id]">["params"];
}) {
  const { id } = await params;

  // 개발 환경 전용 확인 경로(임시): /invoice/demo, demo-empty, demo-many, demo-blank
  // Task 005에서 노션 연동 검증 후 제거합니다.
  const mockInvoice = getMockInvoice(id);
  if (mockInvoice) return <InvoiceView invoice={mockInvoice} />;

  // 노션 조회(F001). 없거나 접근할 수 없는 견적서는 404(F011)로 처리합니다.
  const invoice = await getInvoice(id);
  if (!invoice) notFound();

  // PDF 다운로드 버튼 골격은 InvoiceView에 포함되어 있으며, 실제 동작은 Task 006에서 연결합니다.
  return <InvoiceView invoice={invoice} />;
}
