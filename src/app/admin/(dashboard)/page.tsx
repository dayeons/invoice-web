import { Suspense } from "react"

import { InvoiceList } from "@/components/features/admin/invoiceList"
import { InvoiceListSkeleton } from "@/components/features/admin/invoiceListSkeleton"
import { Container } from "@/components/layout/container"
import { getInvoiceUrl } from "@/lib/invoice-url"
import { requireAdmin } from "@/lib/admin/auth"
import { listInvoices } from "@/lib/notion/invoiceList"

// 관리자 홈: 견적서 목록. 제목은 셸에 두고 세션 확인과 노션 조회는 Suspense 안에서 합니다.
export default function AdminHomePage() {
  return (
    <Container>
      <h1 className="mb-6 text-xl font-semibold">견적서 목록</h1>
      <Suspense fallback={<InvoiceListSkeleton />}>
        <AdminInvoiceList />
      </Suspense>
    </Container>
  )
}

async function AdminInvoiceList() {
  // 세션 확인이 먼저입니다. listInvoices는 세션을 읽지 않으므로 이 확인이 유일한 보호입니다.
  await requireAdmin()
  const { items, truncated } = await listInvoices()
  // 공유 링크는 서버에서 만듭니다. 클라이언트에서는 Vercel 배포 URL을 읽을 수 없기 때문입니다.
  const rows = items.map((item) => ({ ...item, shareUrl: getInvoiceUrl(item.id) }))
  return <InvoiceList items={rows} truncated={truncated} />
}
