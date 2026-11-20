import { siteConfig } from "@/config/site"
import { isNotionId, normalizeNotionId } from "@/lib/notion/id"

// 견적서 공유 URL을 만듭니다. (F010)
// 순수 함수이며 노션이나 서버 전용 모듈을 쓰지 않으므로 서버/클라이언트 어디서나 호출할 수 있습니다.
// 클라이언트에서 쓸 때 siteConfig.url은 NEXT_PUBLIC_SITE_URL만 반영하므로(Vercel 값은 서버 전용),
// 서버에서 만든 baseUrl을 두 번째 인자로 넘기거나 완성된 링크를 props로 전달합니다.
//
// 입력 규칙
// - 하이픈 포함(UUID)/미포함, 대문자/소문자를 모두 받아 하이픈 없는 32자리 소문자로 정규화합니다.
// - 형식이 잘못되면 Error를 던집니다. 잘못된 링크를 조용히 만들어 내보내는 것보다 호출부 버그를
//   바로 드러내는 편이 안전하기 때문입니다. 메시지에는 입력값을 넣지 않습니다.
// - baseUrl 끝의 /는 모두 제거해 //invoice가 생기지 않게 합니다.
export function getInvoiceUrl(pageId: string, baseUrl: string = siteConfig.url) {
  if (!isNotionId(pageId)) {
    throw new Error("견적서 URL을 만들 수 없습니다: 노션 페이지 ID 형식이 올바르지 않습니다.")
  }

  return `${baseUrl.replace(/\/+$/, "")}/invoice/${normalizeNotionId(pageId)}`
}
