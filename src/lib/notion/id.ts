// 노션 페이지 ID 형식 검사 (순수 모듈)
// Proxy(src/proxy.ts)와 서버 조회 계층(invoice.ts)이 함께 쓰므로 서버 전용 모듈을 import하지 않습니다.

// 노션 페이지 ID: 하이픈 없는 32자리 hex 또는 UUID 형식
export const NOTION_ID_PATTERN = /^[0-9a-f]{32}$|^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i

export function isNotionId(value: string) {
  return NOTION_ID_PATTERN.test(value)
}

// 하이픈을 없애고 소문자로 통일합니다. (예: 41D6A564-A299-... → 41d6a564a299...)
// 노션 API는 대문자 ID를 받아들이지 않으므로 조회 전에 이 형태로 맞추고, 캐시 키도 하나로 합칩니다.
export function normalizeNotionId(value: string) {
  return value.replaceAll("-", "").toLowerCase()
}
