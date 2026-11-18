// 견적서 도메인 타입 — 노션 응답을 화면/PDF에서 쓰기 좋은 형태로 정규화한 결과입니다.

export type InvoiceItem = {
  id: string
  description: string
  quantity: number
  unitPrice: number
  // 노션 수식(금액) 값. 없으면 수량 × 단가로 계산합니다.
  amount: number
}

export type Invoice = {
  id: string
  invoiceNumber: string
  clientName: string
  // ISO 날짜 문자열 (예: 2026-11-18). 값이 없으면 null
  issueDate: string | null
  validUntil: string | null
  status: string | null
  totalAmount: number
  items: InvoiceItem[]
}
