import type { Invoice, InvoiceItem } from "@/types/invoice"

// 개발 환경 확인용 더미 데이터 — Task 005에서 노션 실데이터 연결 후 제거합니다.

function makeItem(
  id: string,
  description: string,
  quantity: number,
  unitPrice: number
): InvoiceItem {
  return { id, description, quantity, unitPrice, amount: quantity * unitPrice }
}

function sumAmount(items: InvoiceItem[]) {
  return items.reduce((sum, item) => sum + item.amount, 0)
}

const normalItems = [
  makeItem("n1", "웹사이트 기획 및 설계", 1, 1_500_000),
  makeItem("n2", "프론트엔드 개발", 2, 2_000_000),
  makeItem("n3", "유지보수 (월)", 3, 300_000),
]

const manyItems = [
  ...Array.from({ length: 32 }, (_, i) =>
    makeItem(`m${i + 1}`, `화면 개발 ${i + 1}`, (i % 3) + 1, 100_000 + i * 5_000)
  ),
  // 특수문자(&, <, 이모지) 이스케이프 확인용
  makeItem("m33", "R&D <기획> 컨설팅 🚀", 1, 500_000),
  // 10억 원 이상 금액 표기·레이아웃 확인용
  makeItem("m34", "대규모 플랫폼 구축 (장기 계약)", 1, 1_200_000_000),
]

const longItems = [
  makeItem(
    "l1",
    "매우긴항목명이띄어쓰기없이계속이어지는경우에도레이아웃이깨지지않는지확인하기위한항목명입니다",
    1,
    1_000_000
  ),
]

export const mockInvoices = {
  normal: {
    id: "mock-normal",
    invoiceNumber: "INV-2026-001",
    clientName: "주식회사 예시컴퍼니",
    issueDate: "2026-11-12",
    validUntil: "2026-12-12",
    status: "대기",
    totalAmount: sumAmount(normalItems),
    items: normalItems,
  },
  empty: {
    id: "mock-empty",
    invoiceNumber: "INV-2026-002",
    clientName: "항목 없는 클라이언트",
    issueDate: "2026-11-12",
    validUntil: "2026-12-12",
    status: "승인",
    totalAmount: 0,
    items: [],
  },
  many: {
    id: "mock-many",
    invoiceNumber: "INV-2026-003",
    clientName: "대량 항목 주식회사",
    issueDate: "2026-11-01",
    validUntil: "2026-11-30",
    status: "거절",
    totalAmount: sumAmount(manyItems),
    items: manyItems,
  },
  blank: {
    id: "mock-blank",
    invoiceNumber: "INV-2026-004",
    clientName:
      "아주아주긴클라이언트이름을가진회사주식회사아주아주긴클라이언트이름을가진회사",
    issueDate: null,
    validUntil: null,
    status: null,
    totalAmount: sumAmount(longItems),
    items: longItems,
  },
} satisfies Record<string, Invoice>

export type MockInvoiceKey = keyof typeof mockInvoices

function isMockInvoiceKey(value: string): value is MockInvoiceKey {
  return Object.hasOwn(mockInvoices, value)
}

// 개발 환경에서만 demo 계열 id(demo, demo-empty, demo-many, demo-blank)를 더미로 해석합니다.
// 운영 빌드에서는 항상 null을 돌려주어 노션 조회로 넘어갑니다.
export function getMockInvoice(id: string): Invoice | null {
  if (process.env.NODE_ENV !== "development") return null
  if (id !== "demo" && !id.startsWith("demo-")) return null

  const key = id === "demo" ? "normal" : id.slice("demo-".length)
  return isMockInvoiceKey(key) ? mockInvoices[key] : null
}
