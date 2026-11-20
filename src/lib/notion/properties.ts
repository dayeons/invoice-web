import type { PageObjectResponse } from "@notionhq/client"

// 노션 속성 이름 — 노션 데이터베이스의 컬럼명과 정확히 일치해야 합니다. (PRD 데이터 모델 기준)
// 컬럼명을 바꾸면 여기만 수정하면 됩니다.
export const INVOICE_PROPS = {
  number: "견적서 번호", // Title
  clientName: "클라이언트명", // Text
  issueDate: "발행일", // Date
  validUntil: "유효기간", // Date
  status: "상태", // Select
  totalAmount: "총 금액", // Number
  items: "항목", // Relation → Items
} as const

export const ITEM_PROPS = {
  description: "항목명", // Title
  quantity: "수량", // Number
  unitPrice: "단가", // Number
  amount: "금액", // Formula (수량 × 단가)
} as const

type Properties = PageObjectResponse["properties"]
type Property = Properties[string]

// 속성이 없거나 타입이 다르면 안전한 기본값을 돌려주는 추출 헬퍼들입니다.

function richTextToString(texts: { plain_text: string }[]) {
  return texts.map((t) => t.plain_text).join("")
}

export function readText(props: Properties, name: string): string {
  const p: Property | undefined = props[name]
  if (!p) return ""
  if (p.type === "title") return richTextToString(p.title)
  if (p.type === "rich_text") return richTextToString(p.rich_text)
  return ""
}

export function readNumber(props: Properties, name: string): number | null {
  const p: Property | undefined = props[name]
  if (!p) return null
  if (p.type === "number") return p.number
  // 수식 결과가 숫자인 경우 (금액 등)
  if (p.type === "formula" && p.formula.type === "number") return p.formula.number
  // 롤업(예: 항목 금액 합계)이 숫자인 경우. 참조가 많아 불완전한 롤업(incomplete)은 null로 두어 항목 합계로 대체합니다.
  if (p.type === "rollup" && p.rollup.type === "number") return p.rollup.number
  return null
}

export function readDate(props: Properties, name: string): string | null {
  const p: Property | undefined = props[name]
  if (p?.type !== "date") return null
  const start = p.date?.start
  if (!start) return null
  // 견적서의 날짜는 하루 단위로만 보여 줍니다. 시각/오프셋이 포함된 값(예: 2026-11-12T00:30:00.000+09:00)은
  // 노션 화면에 보이는 날짜(앞 10자리)만 남겨, 서버 시간대(UTC 등)에 따라 날짜가 하루 어긋나는 것을 막습니다.
  return start.match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? start
}

export function readSelect(props: Properties, name: string): string | null {
  const p: Property | undefined = props[name]
  if (p?.type === "select") return p.select?.name ?? null
  if (p?.type === "status") return p.status?.name ?? null
  return null
}

export function readRelationIds(props: Properties, name: string): string[] {
  const p: Property | undefined = props[name]
  if (p?.type !== "relation") return []
  return p.relation.map((r) => r.id)
}
