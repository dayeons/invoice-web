"use server"

import { updateTag } from "next/cache"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { requireAdmin } from "@/lib/admin/auth"
import {
  ADMIN_COOKIE_NAME,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  createSessionToken,
  getAdminConfig,
  verifyPassword,
} from "@/lib/admin/session"
import { INVOICE_LIST_CACHE_TAG } from "@/lib/notion/invoiceList"

export type LoginState = {
  error?: string
}

// 실패 시 고정 지연(무차별 대입 완화). 시도 횟수 제한은 없으므로 긴 무작위 비밀번호를 전제로 합니다.
const FAILURE_DELAY_MS = 1000

// 관리자 로그인. 비밀번호가 맞으면 서명된 세션 쿠키를 발급하고 /admin으로 이동합니다.
// 로그인은 세션이 없는 상태에서 호출하는 유일한 Server Action이라 세션 재확인 대상이 아닙니다.
export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const config = getAdminConfig()
  // 환경변수가 비어 있으면 어떤 입력도 받아들이지 않습니다. (설정 값은 응답에 싣지 않음)
  if (!config) {
    return { error: "관리자 기능이 설정되지 않았습니다." }
  }

  const input = formData.get("password")
  if (typeof input !== "string" || input.length === 0) {
    return { error: "비밀번호를 입력해 주세요." }
  }

  if (!verifyPassword(input, config.password)) {
    await new Promise((resolve) => setTimeout(resolve, FAILURE_DELAY_MS))
    return { error: "비밀번호가 올바르지 않습니다." }
  }

  const cookieStore = await cookies()
  cookieStore.set(ADMIN_COOKIE_NAME, createSessionToken(config.secret), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  })
  redirect("/admin")
}

// 로그아웃. 세션 쿠키를 지우고 로그인 화면으로 이동합니다.
// 지우기만 하는 멱등 동작이고 관리자 데이터를 읽지 않아, 세션이 없어도 같은 결과(쿠키 없음)로 끝납니다.
export async function logout() {
  const cookieStore = await cookies()
  // 발급할 때와 같은 path여야 삭제됩니다.
  cookieStore.delete({ name: ADMIN_COOKIE_NAME, path: "/admin" })
  redirect("/admin/login")
}

// 견적서 목록 새로고침. 목록 캐시 태그만 즉시 만료하며 상세 캐시(invoice-<id>)는 건드리지 않습니다.
// Proxy 검사는 낙관적이므로 시작할 때 세션을 다시 확인합니다. (없으면 로그인 화면으로 이동)
export async function refreshInvoiceList() {
  await requireAdmin()
  updateTag(INVOICE_LIST_CACHE_TAG)
}
