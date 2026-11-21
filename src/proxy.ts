import { NextResponse, type NextRequest } from "next/server"

import {
  ADMIN_COOKIE_NAME,
  getAdminConfig,
  verifySessionToken,
} from "@/lib/admin/session"
import { isNotionId } from "@/lib/notion/id"

// 존재하지 않는 경로. 여기로 rewrite하면 매칭되는 라우트가 없어 루트 not-found.tsx가 HTTP 404로 렌더링됩니다.
const NOT_FOUND_PATH = "/invoice-not-found"

const ADMIN_LOGIN_PATH = "/admin/login"

// /invoice/[id] 요청에서 ID 형식만 검사합니다. (F011)
// 페이지 안의 notFound()는 Cache Components 셸 스트리밍 이후라 HTTP 200이 되므로,
// 형식 오류만큼은 렌더링 전에 걸러 HTTP 404를 돌려줍니다. 노션 API는 호출하지 않습니다.
// 형식은 맞지만 없는 ID, 휴지통, 다른 DB 페이지는 그대로 통과시켜 페이지의 getInvoice가 판단합니다.
function handleInvoice(request: NextRequest) {
  const segment = request.nextUrl.pathname.split("/")[2] ?? ""

  if (!isNotionId(segment)) {
    return NextResponse.rewrite(new URL(NOT_FOUND_PATH, request.url))
  }

  return NextResponse.next()
}

// /admin 이하의 낙관적 검사입니다. 쿠키의 서명과 만료만 확인하고 노션은 호출하지 않습니다.
// 이 검사만으로 보호가 끝나지 않습니다. 페이지의 requireAdmin()과 Server Action의 재확인을 지우지 마세요.
function handleAdmin(request: NextRequest) {
  const { pathname } = request.nextUrl
  const config = getAdminConfig()
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value
  const authenticated = !!config && verifySessionToken(token, config.secret)

  if (pathname === ADMIN_LOGIN_PATH) {
    // 로그인 상태에서 로그인 화면을 열면 /admin으로 보냅니다.
    // GET만 대상으로 해, 로그인 Server Action(POST)은 가로채지 않습니다.
    if (authenticated && request.method === "GET") {
      return NextResponse.redirect(new URL("/admin", request.url))
    }
    return NextResponse.next()
  }

  // Server Action 요청(POST + next-action 헤더)은 로그인 화면으로 redirect하면 클라이언트가
  // "예상치 못한 응답" 오류로 처리합니다. 세션이 없어도 통과시키면 각 Action의 requireAdmin()이
  // 세션을 다시 확인하고 올바른 redirect를 돌려줍니다. (Action은 모두 시작할 때 세션을 재확인함)
  if (!authenticated && request.headers.has("next-action")) {
    return NextResponse.next()
  }

  if (!authenticated) {
    return NextResponse.redirect(new URL(ADMIN_LOGIN_PATH, request.url))
  }

  return NextResponse.next()
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return handleAdmin(request)
  }

  return handleInvoice(request)
}

export const config = {
  // /invoice/<id> 한 단계만 매칭합니다. (/invoice/<id>/pdf 같은 하위 경로는 대상 아님)
  // /admin/:path*는 /admin 자체와 그 하위 경로를 모두 포함합니다.
  matcher: ["/invoice/:id", "/admin/:path*"],
}
