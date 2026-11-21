import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { connection } from "next/server"

import { ADMIN_COOKIE_NAME, getAdminConfig, verifySessionToken } from "./session"

// 서버 전용 모듈입니다. 클라이언트 컴포넌트에서 import하지 마세요.
// 쿠키를 읽으므로 Cache Components에서는 <Suspense> 안(요청 시점)에서만 호출합니다.
// "use cache" 함수 안에서는 호출하지 않습니다.

// 유효한 관리자 세션이 있는지 확인합니다. (리다이렉트하지 않음)
export async function isAdminSession() {
  // cookies()를 환경변수보다 먼저 읽습니다. 그래야 이 함수가 요청 시점 작업이 되어,
  // 환경변수 값이 빌드 시점에 프리렌더 결과로 굳지 않습니다.
  const token = (await cookies()).get(ADMIN_COOKIE_NAME)?.value
  // 만료 검사가 Date.now()를 쓰므로 요청 시점에만 실행되게 합니다.
  // (없으면 서버의 프리렌더 단계에서 "unstable value Date.now()" 오류가 로그에 남고, 첫 이동 때 오류 화면이 뜰 수 있음)
  await connection()
  const config = getAdminConfig()
  if (!config) return false
  return verifySessionToken(token, config.secret)
}

// 페이지와 Server Action이 시작할 때 부르는 세션 재확인입니다.
// Proxy 검사는 낙관적이므로 이 함수를 지우지 마세요. 실패하면 로그인 화면으로 보냅니다.
export async function requireAdmin() {
  if (!(await isAdminSession())) {
    redirect("/admin/login")
  }
}
