// 사이트 전역 설정 — 서비스 이름, 설명, URL 등은 이 파일에서만 관리합니다.

const LOCAL_SITE_URL = "http://localhost:3000"

type SiteUrlEnv = {
  NEXT_PUBLIC_SITE_URL?: string
  VERCEL_ENV?: string
  VERCEL_PROJECT_PRODUCTION_URL?: string
  VERCEL_URL?: string
}

// 공백을 지우고, 프로토콜이 없으면 https://를 붙이고, 끝의 /를 모두 제거합니다.
// 빈 값은 undefined로 돌려 다음 우선순위로 넘어가게 합니다.
// (Vercel 시스템 환경변수는 https:// 없이 도메인만 들어 있습니다.)
function normalizeSiteUrl(value: string | undefined) {
  const trimmed = value?.trim()
  if (!trimmed) return undefined

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`
  return withProtocol.replace(/\/+$/, "")
}

// 사이트 URL 우선순위
// 1. NEXT_PUBLIC_SITE_URL: 사용자가 직접 정한 값(커스텀 도메인 등)이 항상 이깁니다.
// 2. Vercel 배포 URL
//    - 운영 배포(VERCEL_ENV=production): VERCEL_PROJECT_PRODUCTION_URL(고정 운영 도메인)
//    - 프리뷰 배포: VERCEL_URL(해당 배포의 고유 URL). 프리뷰에서 만든 링크가 운영 도메인을 가리키면
//      프리뷰 검증이 되지 않으므로 프리뷰는 자기 URL을 씁니다.
//    - 환경 구분이 없으면 VERCEL_PROJECT_PRODUCTION_URL, 그다음 VERCEL_URL
// 3. http://localhost:3000
// 테스트에서 값을 바꿔 넣을 수 있도록 env를 인자로 받는 순수 함수로 둡니다.
export function resolveSiteUrl(env: SiteUrlEnv) {
  const vercelUrl =
    env.VERCEL_ENV === "preview"
      ? (normalizeSiteUrl(env.VERCEL_URL) ??
        normalizeSiteUrl(env.VERCEL_PROJECT_PRODUCTION_URL))
      : (normalizeSiteUrl(env.VERCEL_PROJECT_PRODUCTION_URL) ??
        normalizeSiteUrl(env.VERCEL_URL))

  return (
    normalizeSiteUrl(env.NEXT_PUBLIC_SITE_URL) ?? vercelUrl ?? LOCAL_SITE_URL
  )
}

// NEXT_PUBLIC_ 접두사는 이 사이트 URL 값에만 허용합니다. (노션 값에는 붙이지 않습니다.)
// NEXT_PUBLIC_SITE_URL은 정적 참조여야 빌드 시 인라인되므로 process.env를 통째로 넘기지 않고 하나씩 읽습니다.
// VERCEL_* 값은 서버에서만 읽을 수 있으므로, 이 파일의 url은 서버 코드에서 쓰고
// 클라이언트에는 필요한 링크를 서버에서 만들어 props로 넘깁니다.
export const siteConfig = {
  name: "견적서 뷰어",
  description:
    "노션에 작성한 견적서를 클라이언트가 가입 없이 웹에서 확인하고 PDF로 내려받는 서비스",
  url: resolveSiteUrl({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    VERCEL_ENV: process.env.VERCEL_ENV,
    VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
    VERCEL_URL: process.env.VERCEL_URL,
  }),
} as const

export type SiteConfig = typeof siteConfig
