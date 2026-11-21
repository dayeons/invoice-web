import { timingSafeEqual } from "node:crypto";

import { revalidateTag } from "next/cache";

import { isNotionId } from "@/lib/notion/id";
import { invoiceCacheTag } from "@/lib/notion/invoice";
import { INVOICE_LIST_CACHE_TAG } from "@/lib/notion/invoiceList";

// 견적서 캐시 즉시 재검증 (Task 009 T14)
// 노션 값을 고친 직후 화면과 PDF에 바로 반영하고 싶을 때 서버나 자동화가 호출합니다.
// POST 외 메서드는 Next.js가 405로 응답합니다. 노션은 호출하지 않고 캐시 태그만 만료시킵니다.
// 요청: POST /api/revalidate, 헤더 Authorization: Bearer <REVALIDATE_SECRET>, 본문 {"id": "<노션 페이지 ID>"}

function json(body: Record<string, unknown>, status: number) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

// 길이가 다르면 timingSafeEqual이 예외를 던지므로 먼저 거부합니다.
function isValidToken(received: string, expected: string) {
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);
  if (receivedBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(receivedBuffer, expectedBuffer);
}

export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  // 토큰이 설정되지 않은 환경에서는 어떤 요청도 받지 않습니다. (설정 값은 응답과 로그에 싣지 않음)
  if (!secret) {
    return json({ error: "재검증이 설정되지 않았습니다." }, 503);
  }

  const authorization = request.headers.get("authorization") ?? "";
  const match = /^Bearer (.+)$/.exec(authorization);
  if (!match || !isValidToken(match[1], secret)) {
    return json({ error: "인증에 실패했습니다." }, 401);
  }

  let id: unknown;
  try {
    const body: unknown = await request.json();
    id = typeof body === "object" && body !== null ? (body as { id?: unknown }).id : undefined;
  } catch {
    return json({ error: "요청 본문이 올바른 JSON이 아닙니다." }, 400);
  }

  // 형식 검사만 하고 노션은 호출하지 않습니다. 하이픈, 대문자 ID는 invoiceCacheTag가 같은 태그로 맞춥니다.
  if (typeof id !== "string" || !isNotionId(id)) {
    return json({ error: "견적서 ID 형식이 올바르지 않습니다." }, 400);
  }

  // 외부 호출에서는 updateTag를 쓸 수 없으므로 { expire: 0 }으로 다음 요청이 바로 새로 조회하게 합니다.
  revalidateTag(invoiceCacheTag(id), { expire: 0 });
  // 관리자 목록 캐시도 같은 요청에서 만료시킵니다. 응답 계약은 그대로입니다.
  revalidateTag(INVOICE_LIST_CACHE_TAG, { expire: 0 });
  return json({ revalidated: true }, 200);
}
