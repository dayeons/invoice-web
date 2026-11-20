import { renderToBuffer } from "@react-pdf/renderer";

import { InvoicePdfDocument } from "@/components/features/invoice/invoicePdfDocument";
import { isNotionId, normalizeNotionId } from "@/lib/notion/id";
import { getInvoice } from "@/lib/notion/invoice";

// 견적서 PDF 다운로드 (F003)
// 요청에서 견적서 데이터를 받지 않습니다. 쿼리 문자열과 본문은 읽지 않고, ID만으로 서버에서 다시 조회합니다.
// src/proxy.ts의 matcher는 /invoice/:id 한 단계만 대상이라 이 경로는 proxy를 거치지 않으므로 형식 검사를 여기서 합니다.

function notFound() {
  return new Response("견적서를 찾을 수 없습니다.", {
    status: 404,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

// 경로 구분자, 따옴표, 제어문자(CRLF 포함)를 제거해 헤더 주입과 경로 문제를 막습니다.
function toSafeName(value: string) {
  return value.replace(/[\\/:*?"<>|\u0000-\u001f\u007f]/g, "").trim();
}

// Content-Disposition 헤더 값을 만듭니다.
// filename= 은 ASCII만 허용되므로(비ASCII가 있으면 헤더 생성이 TypeError) 대체 이름을 따로 두고,
// 한글 이름은 filename*=UTF-8'' 로 전달합니다.
function buildContentDisposition(invoiceNumber: string, id: string) {
  const fallback = `invoice-${id.slice(0, 8)}`;
  const name = toSafeName(invoiceNumber) || fallback;
  const asciiName = name.replace(/[^\x20-\x7e]/g, "").replace(/%/g, "").trim() || fallback;
  // RFC 5987: encodeURIComponent가 남기는 ' ( ) * 도 인코딩합니다.
  const encoded = encodeURIComponent(name).replace(
    /['()*]/g,
    char => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  return `attachment; filename="${asciiName}.pdf"; filename*=UTF-8''${encoded}.pdf`;
}

export async function GET(
  _request: Request,
  ctx: RouteContext<"/invoice/[id]/pdf">,
) {
  const { id } = await ctx.params;

  // 형식 오류는 노션을 호출하지 않고 404로 처리합니다.
  if (!isNotionId(id)) return notFound();

  // 없는 ID, 휴지통, 다른 DB는 getInvoice가 null을 돌려줍니다.
  // 인증/속도 제한 같은 오류는 잡지 않고 던져 500이 되며, 응답에 노션 원문 오류를 싣지 않습니다.
  const normalizedId = normalizeNotionId(id);
  const invoice = await getInvoice(normalizedId);
  if (!invoice) return notFound();

  // InvoicePdfDocument는 훅이 없는 함수라 직접 호출해 Document 요소를 그대로 넘깁니다(renderToBuffer 타입 요구).
  const buffer = await renderToBuffer(InvoicePdfDocument({ invoice }));

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": buildContentDisposition(
        invoice.invoiceNumber,
        normalizedId,
      ),
      // 1분 단위로 재검증되는 값을 CDN이나 브라우저가 오래 붙잡지 않게 합니다.
      "Cache-Control": "private, no-store",
    },
  });
}
