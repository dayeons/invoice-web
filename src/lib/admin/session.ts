// 관리자 세션 서명/검증 (순수 모듈)
// Proxy(src/proxy.ts)와 서버 코드(auth.ts, actions.ts)가 함께 쓰므로 next/headers 같은
// 서버 렌더 전용 모듈을 import하지 않습니다. (src/lib/notion/id.ts와 같은 규칙)
import { createHash, createHmac, timingSafeEqual } from "node:crypto"

export const ADMIN_COOKIE_NAME = "admin_session"

// 세션 유지 시간: 8시간
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8

// 토큰 형식: <만료 시각(밀리초)>.<HMAC-SHA256 서명(base64url)>
const TOKEN_PATTERN = /^(\d{1,15})\.([A-Za-z0-9_-]{43})$/

export type AdminConfig = {
  password: string
  secret: string
}

// 두 환경변수가 모두 있어야 관리자 기능이 열립니다. 하나라도 비어 있으면 null(닫힘).
// 값은 화면과 로그에 싣지 않습니다.
export function getAdminConfig(): AdminConfig | null {
  const password = process.env.ADMIN_PASSWORD
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!password || !secret) return null
  return { password, secret }
}

function sign(secret: string, expiresAt: number) {
  return createHmac("sha256", secret)
    .update(`admin-session.v1.${expiresAt}`)
    .digest("base64url")
}

// 만료 시각을 서명에 포함한 세션 토큰을 만듭니다.
export function createSessionToken(secret: string, now: number = Date.now()) {
  const expiresAt = now + ADMIN_SESSION_MAX_AGE_SECONDS * 1000
  return `${expiresAt}.${sign(secret, expiresAt)}`
}

// 서명과 만료만 검사합니다. (낙관적 검사 — 노션이나 DB는 호출하지 않음)
// 위조, 변조, 만료, 형식 오류는 모두 false입니다.
export function verifySessionToken(
  token: string | undefined,
  secret: string,
  now: number = Date.now()
) {
  if (!token) return false
  const match = TOKEN_PATTERN.exec(token)
  if (!match) return false

  const expiresAt = Number(match[1])
  const received = Buffer.from(match[2])
  const expected = Buffer.from(sign(secret, expiresAt))
  // 서명 길이는 형식 검사로 같지만, timingSafeEqual 예외를 피하려고 한 번 더 확인합니다.
  if (received.length !== expected.length) return false
  if (!timingSafeEqual(received, expected)) return false

  return expiresAt > now
}

// 비밀번호를 SHA-256 다이제스트끼리 비교합니다. 다이제스트는 길이가 항상 같아
// 입력 길이가 비교 시간이나 예외로 드러나지 않습니다.
export function verifyPassword(input: string, expected: string) {
  const a = createHash("sha256").update(input).digest()
  const b = createHash("sha256").update(expected).digest()
  return timingSafeEqual(a, b)
}
