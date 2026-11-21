# Task 015: 노션 견적서 목록 조회 계층 구현

## 개요
관리자 목록에 필요한 필드만 노션 DB 쿼리로 가져오는 `listInvoices()`를 만듭니다. 견적 항목(Relation)은 조회하지 않고 상세는 기존 `getInvoice`에 맡깁니다. 노션 SDK 5.x에는 `databases.query`가 없으므로 `databases.retrieve`의 `data_sources`로 데이터 소스 ID를 얻어 `dataSources.query`로 행을 조회합니다. 최종 목록 화면은 Task 016 범위이며 이 Task에서는 만들지 않습니다(검증용 임시 출력은 완료 전에 삭제).

## 관련 파일
- `src/types/invoice.ts`: `InvoiceListItem`, `InvoiceListResult` 추가(먼저 확정)
- `src/lib/notion/invoiceList.ts` (신규, 서버 전용): `getDataSourceId()`, `listInvoices()`, `INVOICE_LIST_CACHE_TAG`
- `src/lib/notion/properties.ts`, `client.ts`, `logError.ts` (재사용, 수정 없음)
- `src/app/api/revalidate/route.ts`: 목록 태그도 만료(세미콜론 스타일 유지, 응답 계약 불변)
- `CLAUDE.md` 데이터 흐름 절, `README.md` 재검증 설명, `shrimp-rules.md` 4.1절과 8.1절
- 임시: 검증용 출력(완료 전 삭제, 커밋 금지)

## 수락 기준
- [x] 데이터 소스: `databases.retrieve`로 `data_sources`를 얻어 정확히 1개일 때만 사용, 아니면 오류. 데이터 소스 ID는 별도 `"use cache"`로 길게 캐시
- [x] 조회: `dataSources.query`를 `page_size: 100`과 `start_cursor`로 순차 반복(동시 요청 없음). 정렬은 발행일 내림차순, 같으면 생성 시각 내림차순. 상한 1,000건 초과 시 멈추고 `truncated: true`
- [x] `isFullPage`인 결과만 사용하고 `in_trash` 행 제외. 견적 항목 개별 조회 0회
- [ ] 총 금액이 비었거나 롤업이 `incomplete`면 `null` (미확인: 기존 행에 null 사례가 없어 노션 쓰기가 필요함. 사용자 결정(2026-11-21)으로 확인 생략, 실제로 확인하지 않았으므로 체크하지 않음)
- [x] 캐시: `"use cache"` + `cacheLife("minutes")` + `cacheTag(INVOICE_LIST_CACHE_TAG = "invoice-list")`. 함수 안에서 `cookies()`를 읽지 않음, 키와 태그에 비밀 값 없음
- [x] 오류: `object_not_found` 포함 모든 노션 오류는 `logNotionError(error, "listInvoices")`로 한 줄 기록 후 내용 없는 새 `Error`를 던짐(빈 목록으로 숨기지 않음)
- [x] `/api/revalidate`는 같은 요청에서 `revalidateTag(INVOICE_LIST_CACHE_TAG, { expire: 0 })`도 호출하고 응답 계약은 그대로
- [x] 노션 컬럼명은 `INVOICE_PROPS`로만 참조, 노션 쓰기 없음
- [x] 문서 갱신 완료, `npm run check-all`, `npm run build` 통과, 임시 코드 삭제

## 구현 단계
- [x] 1. 문서와 SDK 타입(`dataSources.query`, `databases.retrieve`) 확인, `InvoiceListItem` 타입 정의
- [x] 2. 데이터 소스 ID 조회와 캐시
- [x] 3. 페이지네이션 쿼리, 매핑, 상한 처리
- [x] 4. 캐시 태그, 오류 로깅, `/api/revalidate` 목록 태그 추가
- [x] 5. 검증용 화면 연결(Task 014 완료 후이므로 `/admin` 자리표시자에 임시 출력, 완료 전 삭제)
- [x] 6. 문서 갱신, `npm run check-all`, `npm run build`
- [ ] 7. Playwright MCP로 테스트 체크리스트 수행, 결과 기록 (미확인 2건은 사용자 결정(2026-11-21)으로 확인 생략, 나머지는 수행 완료)

## 테스트 체크리스트
노션 데이터 쓰기는 하지 않으며 기존 `[TEST]` 행을 읽기만 합니다. 값 수정이 필요한 시나리오는 "미확인(사용자 승인 필요)"로 기록합니다.

### 정상 케이스
- [x] 표시 건수 = 휴지통이 아닌 견적서 수
- [x] `[TEST]` ①~⑨의 번호, 클라이언트명, 날짜, 상태, 총액이 상세 페이지 값과 일치(⑤ 항목 30개는 롤업 ₩4,650,000)
- [x] 정렬: 발행일 내림차순, 같으면 생성 시각 내림차순

### 에러/예외 케이스
- [x] 잘못된 `NOTION_API_KEY` → 오류 화면, 서버 로그는 `[notion] listInvoices 실패: code=unauthorized ...` 한 줄, 키와 응답 본문 미노출
- [x] `NOTION_DATABASE_ID`를 형식만 맞는 임의 값으로 → 빈 목록이 아니라 오류 화면

### 경계값/엣지 케이스
- [x] ⑩ 휴지통 행 미표시, ⑥ 빈 날짜, ⑦ 특수문자/긴 값, ⑧ 큰 금액, ⑨ 시각 포함 날짜(`TZ=UTC`로 띄워도 같은 날)
- [x] 페이지 크기 상수를 임시로 3으로 낮춰도 건수와 순서 동일(확인 후 원복)
- [x] 서버 로그 `retrying request` 0회(임시 로그, 확인 후 원복)
- [ ] 값 수정 후 반영 확인은 노션 쓰기가 필요하므로 미확인(사용자 결정(2026-11-21)으로 확인 생략, 실제로 확인하지 않았으므로 체크하지 않음)

### 캐시
- [x] 재접속은 캐시 적중(응답 시간으로 확인)
- [x] `/api/revalidate` 호출 직후 목록이 새로 조회됨, 응답 계약(401/503/400/200) 그대로
- [x] 상세 캐시 재검증 회귀 없음

### 정리
- [x] 임시 검증 코드 삭제 확인, 임시 상수 원복 확인

## 테스트 결과

### 변경 사항 요약
- `src/types/invoice.ts`: `InvoiceListItem`, `InvoiceListResult`
- `src/lib/notion/invoiceList.ts`: `getDataSourceId()`(`"use cache"`, `cacheLife("days")`, 데이터 소스가 정확히 1개일 때만), `listInvoices()`(`"use cache"` + `cacheLife("minutes")` + `cacheTag("invoice-list")`, `dataSources.query` 100건씩 순차, 발행일 내림차순 → 생성 시각 내림차순, 상한 1,000건)
- `src/app/api/revalidate/route.ts`: `revalidateTag(INVOICE_LIST_CACHE_TAG, { expire: 0 })` 추가, 응답 계약 불변
- 문서: `CLAUDE.md` 데이터 흐름, `README.md` 재검증, `shrimp-rules.md` 4.1절, 8.1절

### 구현 중 발견해 고친 문제
- `"use cache"` 함수(`getDataSourceId`)에서 던진 노션 오류는 경계를 지나면 일반 `Error`로 바뀌어 상위 `catch`의 `logNotionError`가 `code=unauthorized` 대신 "노션 외 오류 (Error)"를 찍었음(메시지로 표식을 붙이는 시도도 경계를 넘지 못함). `getDataSourceId` 안에서 코드와 요청 ID를 기록하고 `listInvoices`는 그 호출을 `try` 밖에 두어 한 줄만 남도록 구조를 바꿈

### 2026-11-21 검증 (`npm run build` 후 `next start -p 3100`, 임시 출력으로 확인)
정상
- 표시 건수 11 = 휴지통이 아닌 견적서 수(`[TEST]` 9건 + `INV-2026-001`, `INV-2026-002`). `truncated=false`
- 11건 모두 상세 페이지(`/invoice/<id>`) 본문에서 견적서 번호, 클라이언트명, 상태, 총액(`₩` 형식), 발행일이 일치. ⑤ 항목30개는 ₩4,650,000. ⑥ 빈필드는 발행일/유효기간 `-`
- 정렬: 발행일 내림차순(2026-12-02 → 2026-11-12 → 2026-11-01), 같은 날짜는 노션 생성 시각 내림차순, 빈 날짜 행이 맨 뒤

에러
- 잘못된 `NOTION_API_KEY` → 오류 화면("문제가 발생했습니다", "다시 시도"), 로그는 `[notion] listInvoices 실패: code=unauthorized status=401 request_id=…` 한 줄뿐, 키와 응답 본문이 화면/로그에 없음
- 형식만 맞는 임의 `NOTION_DATABASE_ID` → 빈 목록이 아니라 같은 오류 화면, 로그 `code=object_not_found status=404 request_id=…` 한 줄

엣지
- ⑦ 긴 특수문자 값, ⑧ ₩1,200,000,000, ⑨ 시각 포함 날짜(`TZ=UTC` 서버와 기본 시간대 서버의 11행이 완전히 동일)
- 페이지 크기를 3으로 낮춰(임시) 쿼리 4회로 가져와도 11건, 순서가 기본 결과와 동일. SDK INFO 로그(임시)로 데이터베이스 조회 1회 + 쿼리 4회가 순차 실행됨을 확인했고 "retrying request" 0회
- 상한을 7로 낮춰(임시) `count=7 truncated=true`, 앞 7건이 기본 결과와 동일
- 위 임시 상수와 로그 설정은 모두 원복(`QUERY_PAGE_SIZE = 100`, `MAX_INVOICES = 1000`, `client.ts` 변경 없음)

캐시
- 같은 세션으로 `/admin` 재요청: 첫 요청 이후 7~15ms(적중), `/api/revalidate` 직후 492ms(재조회), 이후 12ms
- `/api/revalidate` 응답 계약 그대로: 토큰 없음 401, ID 형식 오류 400, 정상 200. 상세 페이지도 재검증 직후 한 번 다시 조회되고(4.7초) 다음 요청은 12ms(캐시 적중)

정리
- 임시 출력(`tempInvoiceList.tsx`와 `page.tsx` 연결)은 삭제함(`grep TEMP` 결과 없음). 별도 임시 검증 경로를 만들지 않아 확인할 404 경로 없음

### 미확인: 사용자 결정(2026-11-21)으로 확인 생략
두 항목 모두 노션 쓰기가 필요하며, 사용자가 "생략"으로 결정해 수행하지 않았습니다. 체크박스는 거짓 통과가 되지 않도록 `[ ]`로 둡니다.
- 총 금액이 비어 있거나 롤업이 `incomplete`인 행이 `null`로 매핑되는지: 기존 `[TEST] 총금액빈` 행은 노션 롤업이 값을 계산해 1,100,000으로 나오므로 `null` 사례가 없음. 재현하려면 항목 연결을 끊거나 새 행을 만드는 노션 쓰기가 필요함. 코드상 `readNumber`가 숫자가 아닌 롤업/빈 값에 `null`을 돌려주는 것만 확인함
- 노션에서 값을 수정한 뒤 `/api/revalidate` 직후 목록에 반영되는지: 노션 쓰기가 필요해 하지 못함(재검증 직후 재조회가 일어나는 것은 응답 시간으로 확인)
- Task 018 보완(2026-11-21): 운영 빌드의 목록에서도 `[TEST] 총금액빈`은 ₩1,100,000으로 표시됨(`null` 사례 없음). 확인 생략 결정은 그대로 유지하며 체크박스도 `[ ]`로 둠
