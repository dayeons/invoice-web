import { isFullDatabase, isFullPage } from "@notionhq/client"
import { cacheLife, cacheTag } from "next/cache"

import type { InvoiceListItem, InvoiceListResult } from "@/types/invoice"

import { getDatabaseId, getNotionClient } from "./client"
import { logNotionError } from "./logError"
import {
  INVOICE_PROPS,
  readDate,
  readNumber,
  readSelect,
  readText,
} from "./properties"

// 서버 전용 모듈입니다. 클라이언트 컴포넌트에서 import하지 마세요.

// 목록 캐시 태그. 바꾸면 재검증 코드(/api/revalidate, 목록 새로고침)와 함께 바꿉니다.
export const INVOICE_LIST_CACHE_TAG = "invoice-list"

// 한 번의 쿼리로 가져오는 행 수 (노션 최대값)
const QUERY_PAGE_SIZE = 100

// 목록에 담는 최대 건수. 넘으면 truncated로 표시합니다.
const MAX_INVOICES = 1000

const LIST_ERROR_MESSAGE = "노션에서 견적서 목록을 불러오지 못했습니다."

// NOTION_DATABASE_ID(database_id)에서 행 조회용 데이터 소스 ID를 얻습니다.
// SDK 5.x에는 databases.query가 없어 dataSources.query를 써야 합니다.
// 데이터 소스가 정확히 1개일 때만 사용하고, 아니면 임의로 고르지 않고 오류로 처리합니다.
// 거의 바뀌지 않으므로 길게 캐시합니다. (오류는 캐시되지 않음)
//
// "use cache" 경계를 지나면 오류가 일반 Error로 바뀌어 노션 오류 코드를 읽을 수 없으므로,
// 이 함수의 실패는 여기서 코드와 요청 ID를 기록하고 내용 없는 오류를 던집니다.
// 호출하는 쪽은 이 오류를 다시 기록하지 않습니다.
async function getDataSourceId(): Promise<string> {
  "use cache"
  cacheLife("days")

  try {
    const database = await getNotionClient().databases.retrieve({
      database_id: getDatabaseId(),
    })
    if (!isFullDatabase(database)) {
      throw new Error("데이터베이스 정보를 전부 받지 못했습니다.")
    }
    if (database.data_sources.length !== 1) {
      throw new Error(
        `데이터 소스가 ${database.data_sources.length}개입니다. 1개인 데이터베이스만 지원합니다.`
      )
    }
    return database.data_sources[0].id
  } catch (error) {
    logNotionError(error, "listInvoices")
    throw new Error(LIST_ERROR_MESSAGE)
  }
}

// 견적서 목록을 조회합니다. 견적 항목(Relation)은 조회하지 않습니다. (관리자 목록, Task 015)
// 호출하는 쪽이 세션을 먼저 확인해야 합니다. 이 함수 안에서는 cookies()를 읽지 않습니다.
// 서버에서 1분 단위로 재검증하고(cacheLife("minutes")), 태그 invoice-list로 즉시 만료할 수 있습니다.
export async function listInvoices(): Promise<InvoiceListResult> {
  "use cache"
  cacheLife("minutes")
  cacheTag(INVOICE_LIST_CACHE_TAG)

  // 데이터 소스 조회 실패는 getDataSourceId 안에서 이미 기록했으므로 다시 기록하지 않습니다.
  const dataSourceId = await getDataSourceId()

  try {
    const notion = getNotionClient()

    const items: InvoiceListItem[] = []
    let truncated = false
    let cursor: string | undefined

    // 노션 속도 제한(평균 초당 3회)을 고려해 한 번에 하나씩 순차 조회합니다.
    while (true) {
      const res = await notion.dataSources.query({
        data_source_id: dataSourceId,
        page_size: QUERY_PAGE_SIZE,
        start_cursor: cursor,
        sorts: [
          { property: INVOICE_PROPS.issueDate, direction: "descending" },
          { timestamp: "created_time", direction: "descending" },
        ],
      })

      for (const page of res.results) {
        if (!isFullPage(page) || page.in_trash) continue
        const { properties } = page
        items.push({
          id: page.id,
          invoiceNumber: readText(properties, INVOICE_PROPS.number),
          clientName: readText(properties, INVOICE_PROPS.clientName),
          issueDate: readDate(properties, INVOICE_PROPS.issueDate),
          validUntil: readDate(properties, INVOICE_PROPS.validUntil),
          status: readSelect(properties, INVOICE_PROPS.status),
          totalAmount: readNumber(properties, INVOICE_PROPS.totalAmount),
        })
      }

      if (items.length > MAX_INVOICES) {
        items.length = MAX_INVOICES
        truncated = true
        break
      }
      if (!res.has_more || !res.next_cursor) break
      cursor = res.next_cursor
    }

    return { items, truncated }
  } catch (error) {
    // object_not_found는 DB ID나 Integration 공유 설정 오류이므로 빈 목록으로 숨기지 않습니다.
    // getInvoice와 같은 이유로 오류 객체 대신 내용 없는 새 오류를 던집니다.
    logNotionError(error, "listInvoices")
    throw new Error(LIST_ERROR_MESSAGE)
  }
}
