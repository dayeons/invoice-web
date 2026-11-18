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
  return null
}

export function readDate(props: Properties, name: string): string | null {
  const p: Property | undefined = props[name]
  if (p?.type !== "date") return null
  return p.date?.start ?? null
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
