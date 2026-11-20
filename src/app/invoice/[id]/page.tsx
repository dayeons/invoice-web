import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ThemeToggle } from "@/components/common/themeToggle";
import { Container } from "@/components/layout/container";
import { InvoiceSkeleton } from "@/components/features/invoice/invoiceSkeleton";
import { InvoiceView } from "@/components/features/invoice/invoiceView";
import { getInvoiceUrl } from "@/lib/invoice-url";
import { isNotionId, normalizeNotionId } from "@/lib/notion/id";
import { getInvoice } from "@/lib/notion/invoice";

// 고유 링크 페이지이므로 검색 엔진 색인을 막습니다.
// canonical은 ID만으로 만든 공유 URL(하이픈 없는 소문자)입니다. 노션을 호출하지 않으며,
// params는 런타임 데이터라 이 메타데이터는 페이지의 동적 영역(Suspense 안 params)과 함께 요청 시점에 스트리밍됩니다.
export async function generateMetadata({
  params,
}: PageProps<"/invoice/[id]">): Promise<Metadata> {
  const { id } = await params;

  return {
    title: "견적서",
    robots: { index: false, follow: false },
    // 형식 오류는 proxy가 먼저 404로 처리하지만, 여기서 던지면 404 대신 에러 페이지가 되므로 건너뜁니다.
    ...(isNotionId(id) && { alternates: { canonical: getInvoiceUrl(id) } }),
  };
}

// 견적서 조회 페이지 (F002, F003, F011, F012)
// 동적 params는 런타임 데이터이므로 Suspense 경계 안에서 읽습니다.
export default function InvoicePage({ params }: PageProps<"/invoice/[id]">) {
  return (
    <main className="py-8 sm:py-12">
      <Container className="max-w-3xl">
        <div className="mb-6 flex justify-end print:hidden">
          <ThemeToggle />
        </div>
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

  // 노션 조회(F001). 없거나 접근할 수 없는 견적서는 404(F011)로 처리합니다.
  // ID 형식 오류는 src/proxy.ts에서 먼저 HTTP 404로 걸러지며, 여기에 오는 경우(형식은 맞지만 없는 ID,
  // 휴지통, 다른 DB)는 스트리밍이 시작된 뒤라 404 화면 + noindex(HTTP 200)가 됩니다.
  // 형식을 먼저 검사한 뒤 하이픈 없는 소문자 ID로 맞춰 조회합니다. (노션은 대문자 ID를 받아들이지 않음)
  if (!isNotionId(id)) notFound();
  const invoice = await getInvoice(normalizeNotionId(id));
  if (!invoice) notFound();

  // PDF 다운로드와 링크 복사 버튼은 InvoiceView에 포함되어 있습니다.
  // 공유 링크는 서버에서 완성해 넘깁니다. (클라이언트에서는 Vercel 배포 URL을 읽을 수 없음)
  return (
    <InvoiceView invoice={invoice} shareUrl={getInvoiceUrl(invoice.id)} />
  );
}
