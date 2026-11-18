import { Suspense } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { Container } from "@/components/layout/container"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/lib/format"
import { getInvoice } from "@/lib/notion/invoice"

// 고유 링크 페이지이므로 검색 엔진 색인을 막습니다.
export const metadata: Metadata = {
  title: "견적서",
  robots: { index: false, follow: false },
}

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
  )
}

async function InvoiceContent({
  params,
}: {
  params: PageProps<"/invoice/[id]">["params"]
}) {
  const { id } = await params

  // 노션 조회(F001). 없거나 접근할 수 없는 견적서는 404(F011)로 처리합니다.
  const invoice = await getInvoice(id)
  if (!invoice) notFound()

  // TODO: 견적서 본문 렌더링(F002)과 PDF 다운로드 버튼(F003)으로 교체합니다.
  // 아래는 노션 연동 확인용 임시 출력입니다.
  return (
    <dl className="space-y-1 text-sm">
      <div>견적서 번호: {invoice.invoiceNumber}</div>
      <div>클라이언트: {invoice.clientName}</div>
      <div>항목 수: {invoice.items.length}개</div>
      <div>총 금액: {formatCurrency(invoice.totalAmount)}</div>
    </dl>
  )
}

function InvoiceSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-48 w-full" />
    </div>
  )
}
