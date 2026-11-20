import {
  APIErrorCode,
  isFullPage,
  isNotionClientError,
  type PageObjectResponse,
} from "@notionhq/client"
import { cacheLife, cacheTag } from "next/cache"

import type { Invoice, InvoiceItem } from "@/types/invoice"

import { getDatabaseId, getNotionClient } from "./client"
import { NOTION_ID_PATTERN, normalizeNotionId } from "./id"
import { logNotionError } from "./logError"
import {
  INVOICE_PROPS,
  ITEM_PROPS,
  readDate,
  readNumber,
  readRelationIds,
  readSelect,
  readText,
} from "./properties"

// 페이지 조회 응답에 인라인으로 포함되는 관계 항목의 최대 개수 (이 이상이면 잘렸을 수 있음)
const RELATION_INLINE_LIMIT = 25

// 항목 페이지를 한 번에 동시 조회하는 최대 개수 (노션 API 평균 초당 3회 제한 고려)
const ITEM_FETCH_BATCH_SIZE = 3

export function invoiceCacheTag(pageId: string) {
  return `invoice-${normalizeNotionId(pageId)}`
}

// 페이지가 지정한 견적서 데이터베이스에 속하는지 확인합니다.
// 통합(Integration)에 공유된 다른 페이지가 URL 추측만으로 노출되는 것을 막습니다.
function belongsToInvoiceDatabase(page: PageObjectResponse) {
  const { parent } = page
  if (parent.type !== "database_id" && parent.type !== "data_source_id") return false
  return normalizeNotionId(parent.database_id) === normalizeNotionId(getDatabaseId())
}

// 노션이 "없음/잘못된 ID/접근 불가"로 응답하는 경우 → 404로 처리합니다.
function isNotFoundError(error: unknown) {
  return (
    isNotionClientError(error) &&
    (error.code === APIErrorCode.ObjectNotFound ||
      error.code === APIErrorCode.ValidationError)
  )
}

// 관계(항목) 속성은 페이지 조회 시 최대 25개까지만 내려오므로, 25개에 도달하면 속성 API로 전부 가져옵니다.
async function fetchItemIds(page: PageObjectResponse): Promise<string[]> {
  const prop = page.properties[INVOICE_PROPS.items]
  if (prop?.type !== "relation") return []
  if (prop.relation.length < RELATION_INLINE_LIMIT) return readRelationIds(page.properties, INVOICE_PROPS.items)

  const notion = getNotionClient()
  const ids: string[] = []
  let cursor: string | undefined
  do {
    const res = await notion.pages.properties.retrieve({
      page_id: page.id,
      property_id: prop.id,
      start_cursor: cursor,
    })
    if (res.object !== "list") break
    for (const item of res.results) {
      if (item.type === "relation") ids.push(item.relation.id)
    }
    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined
  } while (cursor)
  return ids
}

async function fetchItem(itemId: string): Promise<InvoiceItem | null> {
  const page = await getNotionClient().pages.retrieve({ page_id: itemId })
  if (!isFullPage(page)) return null

  const quantity = readNumber(page.properties, ITEM_PROPS.quantity) ?? 0
  const unitPrice = readNumber(page.properties, ITEM_PROPS.unitPrice) ?? 0
  return {
    id: page.id,
    description: readText(page.properties, ITEM_PROPS.description),
    quantity,
    unitPrice,
    amount: readNumber(page.properties, ITEM_PROPS.amount) ?? quantity * unitPrice,
  }
}

// 항목 페이지를 ITEM_FETCH_BATCH_SIZE개씩 묶어 순차 조회합니다.
// 묶음 안에서만 병렬로 호출해 항목이 많아도 동시 요청 수가 묶음 크기를 넘지 않습니다. 결과 순서는 itemIds 순서와 같습니다.
async function fetchItemsInBatches(itemIds: string[]): Promise<InvoiceItem[]> {
  const items: InvoiceItem[] = []
  for (let start = 0; start < itemIds.length; start += ITEM_FETCH_BATCH_SIZE) {
    const batch = itemIds.slice(start, start + ITEM_FETCH_BATCH_SIZE)
    const fetched = await Promise.all(batch.map(fetchItem))
    for (const item of fetched) {
      if (item) items.push(item)
    }
  }
  return items
}

// 노션 페이지 ID로 견적서 1건을 조회합니다. 없거나 접근할 수 없으면 null을 돌려줍니다. (F001, F011)
// 노션 API 호출을 줄이기 위해 서버에서 1분 단위로 재검증합니다.
// (cacheLife("minutes"): stale 5분, revalidate 1분, expire 1시간) 필요하면 revalidateTag로 즉시 무효화합니다.
export async function getInvoice(pageId: string): Promise<Invoice | null> {
  "use cache"
  cacheLife("minutes")
  cacheTag(invoiceCacheTag(pageId))

  if (!NOTION_ID_PATTERN.test(pageId)) return null

  const notion = getNotionClient()

  try {
    const page = await notion.pages.retrieve({ page_id: pageId })
    if (!isFullPage(page) || page.in_trash) return null
    if (!belongsToInvoiceDatabase(page)) return null

    const itemIds = await fetchItemIds(page)
    const items = await fetchItemsInBatches(itemIds)

    const { properties } = page
    return {
      id: page.id,
      invoiceNumber: readText(properties, INVOICE_PROPS.number),
      clientName: readText(properties, INVOICE_PROPS.clientName),
      issueDate: readDate(properties, INVOICE_PROPS.issueDate),
      validUntil: readDate(properties, INVOICE_PROPS.validUntil),
      status: readSelect(properties, INVOICE_PROPS.status),
      // 총 금액 컬럼이 비어 있으면 항목 합계로 대신합니다.
      totalAmount:
        readNumber(properties, INVOICE_PROPS.totalAmount) ??
        items.reduce((sum, item) => sum + item.amount, 0),
      items,
    }
  } catch (error) {
    if (isNotFoundError(error)) return null
    // 인증 오류, 속도 제한 등은 404가 아니라 error.tsx로 보냅니다.
    // 서버 로그에는 오류 코드와 요청 ID만 남깁니다(견적서 내용과 API 키는 남기지 않음).
    // 원본 오류를 그대로 던지면 Next가 헤더와 응답 본문까지 통째로 로그에 찍으므로,
    // 내용이 없는 새 오류를 던집니다(cause도 붙이지 않음). 호출하는 쪽은 오류 종류를 구분하지 않습니다.
    logNotionError(error, "getInvoice")
    throw new Error("노션에서 견적서를 불러오지 못했습니다.")
  }
}
