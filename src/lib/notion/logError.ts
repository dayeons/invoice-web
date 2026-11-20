import { isNotionClientError } from "@notionhq/client"

// 서버 전용 모듈입니다. 클라이언트 컴포넌트에서 import하지 마세요.
//
// 노션 호출이 실패했을 때 서버 로그에 남기는 한 줄입니다.
// 남기는 값은 오류 코드(code), HTTP 상태(status), 노션 요청 ID(request_id)뿐입니다.
// 오류 객체의 message, body는 쓰지 않습니다. 노션이 요청에 쓴 값이나 페이지 내용을 담을 수 있고,
// API 키가 들어간 요청 정보와 섞일 위험도 있기 때문입니다. request_id가 있으면 노션 지원팀에
// 문의할 때 해당 요청을 찾을 수 있습니다.
export function logNotionError(error: unknown, context: string) {
  if (!isNotionClientError(error)) {
    // 노션 오류가 아니면(환경변수 누락, 네트워크 오류 등) 이름만 남깁니다.
    const name = error instanceof Error ? error.name : typeof error
    console.error(`[notion] ${context} 실패: 노션 외 오류 (${name})`)
    return
  }

  // status, request_id는 HTTP 응답 오류에만 있고, 요청 시간 초과 같은 오류에는 없습니다.
  const status = "status" in error ? error.status : undefined
  const requestId = "request_id" in error ? error.request_id : undefined

  console.error(
    `[notion] ${context} 실패: code=${error.code} status=${status ?? "-"} request_id=${requestId ?? "-"}`
  )
}
