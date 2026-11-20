import { NextResponse, type NextRequest } from "next/server"

import { isNotionId } from "@/lib/notion/id"

// 존재하지 않는 경로. 여기로 rewrite하면 매칭되는 라우트가 없어 루트 not-found.tsx가 HTTP 404로 렌더링됩니다.
const NOT_FOUND_PATH = "/invoice-not-found"

// /invoice/[id] 요청에서 ID 형식만 검사합니다. (F011)
// 페이지 안의 notFound()는 Cache Components 셸 스트리밍 이후라 HTTP 200이 되므로,
// 형식 오류만큼은 렌더링 전에 걸러 HTTP 404를 돌려줍니다. 노션 API는 호출하지 않습니다.
// 형식은 맞지만 없는 ID, 휴지통, 다른 DB 페이지는 그대로 통과시켜 페이지의 getInvoice가 판단합니다.
export function proxy(request: NextRequest) {
  const segment = request.nextUrl.pathname.split("/")[2] ?? ""

  if (!isNotionId(segment)) {
    return NextResponse.rewrite(new URL(NOT_FOUND_PATH, request.url))
  }

  return NextResponse.next()
}

export const config = {
  // /invoice/<id> 한 단계만 매칭합니다. (/invoice/<id>/pdf 같은 하위 경로는 대상 아님)
  matcher: "/invoice/:id",
}
