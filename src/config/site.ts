// 사이트 전역 설정 — 서비스 이름, 설명 등은 이 파일에서만 관리합니다.
export const siteConfig = {
  name: "견적서 뷰어",
  description:
    "노션에 작성한 견적서를 클라이언트가 가입 없이 웹에서 확인하고 PDF로 내려받는 서비스",
  url: "http://localhost:3000",
} as const

export type SiteConfig = typeof siteConfig
