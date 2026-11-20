# Task 013: Vercel 배포와 운영 준비

> 번호 안내: 이전 MVP 로드맵(`git show HEAD:docs/ROADMAP.md`)의 Task 010에 해당합니다. `tasks/010`은 다크모드 작업이 사용 중이라 013으로 만들었습니다.

## 개요
배포 전 준비(서버 에러 로깅 정리, 운영 문서, 검증 스크립트 정리)를 끝내고, 사용자가 Vercel 배포를 마친 뒤 프리뷰와 운영 URL에서 검증합니다. 작업은 두 단계로 나뉩니다.
- **T18 (이 파일의 "T18 결과")**: 작업 파일 작성, 에러 로깅, README 운영 문서, `check-all`과 CI 결정
- **T19**: 사용자가 Vercel 프로젝트 연결, 환경변수 입력, 도메인 확정, 노션 Formula 도메인 갱신을 마친 뒤 프리뷰, 운영 URL에서 체크리스트 수행

## 관련 파일
- `src/lib/notion/logError.ts` (신규, 서버 전용 로깅 헬퍼)
- `src/lib/notion/invoice.ts` (비-404 오류 경로에서 로깅 후 내용 없는 오류를 던짐)
- `README.md` (환경변수, 노션 DB 설정, 배포 절차, 문제 대응)
- `CLAUDE.md`, `package.json` (`check-all`, 함정 항목)
- `next.config.ts` (T19에서 폰트 파일 포함이 필요하면 `outputFileTracingIncludes`)
- `src/config/site.ts` (사이트 URL 우선순위 참조)

## 수락 기준
- [x] 잘못된 API 키로 조회할 때 서버 로그에 노션 오류 코드와 요청 ID만 남고, 키와 견적서 내용이 없으며 화면에는 원문 오류가 없음
- [x] README에 설치, 환경변수, 노션 DB 설정, 배포 절차가 있음
- [x] `check-all`과 CI 도입 여부가 결정되어 기록됨
- [x] `lint`, `tsc --noEmit`, `build` 통과
- [ ] 운영 URL에서 MVP 성공 기준 5개를 다시 확인 (T19, 사용자 배포 후)

## 구현 단계
- [x] T18: 작업 파일 작성, 로깅 정리, README, `check-all`/CI 결정
- [ ] 사용자: Vercel 프로젝트 연결, 프리뷰/운영 환경변수 입력, 운영 도메인 확정, 노션 `공유 링크` Formula 도메인 갱신
- [ ] T19: 프리뷰에서 체크리스트 수행 → 통과 후 운영 URL에서 다시 수행, 결과 기록

## 결정 기록

### 서버 에러 로깅 (T18, 2026-11-20)
**결정: `logNotionError`로 한 줄만 남기고, 원본 오류 대신 내용 없는 오류를 던진다.**
- 형식: `[notion] getInvoice 실패: code=<코드> status=<HTTP 상태> request_id=<노션 요청 ID>`. 오류 객체의 `message`, `body`는 쓰지 않습니다. "없음/검증 오류"(404로 처리)는 정상 흐름이라 남기지 않습니다.
- 처음에는 원본 오류를 그대로 다시 던졌더니 Next가 그 오류를 헤더(`set-cookie` 포함)와 응답 본문까지 통째로 로그에 찍었습니다. 키와 견적서 내용은 없었지만 "코드와 요청 ID만" 원칙에 어긋나 로깅 뒤 `new Error("노션에서 견적서를 불러오지 못했습니다.")`를 던지도록 바꿨습니다(cause 없음). 화면은 `error.tsx`가 일반 문구만 보여 주고, PDF 경로는 500이며 응답에 원문이 없어 오류 종류에 의존하는 곳이 없습니다.
- 노션 클라이언트가 직접 남기는 `@notionhq/client warn: request fail {code, message, attempt, requestId}` 경고는 그대로 둡니다(재시도 진단용, 키와 견적서 내용 없음. 404 계열에서는 노션 안내 메시지에 조회한 페이지 ID와 Integration 이름이 들어갈 수 있음).
- `"use cache"` 함수 안의 로깅과 오류 캐싱: 설치된 Next 16.4.6 문서(`use-cache.md`, `cacheLife.md`, `08-caching.md`)에는 던진 오류가 캐시되는지에 대한 설명이 없어 실제 동작으로 확인했습니다. 잘못된 키로 같은 견적서를 반복 요청하면 요청마다 `[notion]` 줄이 한 번씩 찍히고 `request_id`도 매번 다릅니다(페이지 2회, PDF 1회, 모두 노션을 새로 호출). 즉 **실패는 캐시되지 않고**, 로깅은 캐시 함수 안에서도 정상적으로 실행됩니다. 노션 장애 중에는 요청마다 노션을 호출하므로 속도 제한과 로그량이 늘 수 있습니다.

### `check-all` (T18, 2026-11-20)
**결정: 스크립트를 추가한다(사용자 선택).** `package.json`의 `"check-all": "npm run lint && tsc --noEmit"`. `build`는 오래 걸려 포함하지 않고 CLAUDE.md 체크리스트에 별도 줄로 둡니다.

### CI와 테스트 러너 (T18, 2026-11-20)
**결정: 도입하지 않는다(사용자 선택).** 현재 규모에서는 Playwright MCP 수동 검증으로 충분하고, 러너와 CI는 노션 API 키 시크릿 관리와 유지 부담이 생깁니다. CLAUDE.md에 결정을 기록했고, 필요해지면 재검토합니다.

## 테스트 체크리스트
(T18에서 할 수 있는 항목은 이 단계에서, 배포 환경이 필요한 항목은 T19에서 프리뷰 → 운영 순서로 Playwright MCP로 수행)

### 정상 케이스
- [x] 정상 키로 로컬 운영 빌드 조회가 그대로 동작함(견적서 200, PDF 200, 본문에 견적서 번호 표시)
- [ ] (T19) 운영 URL에서 노션 `공유 링크`로 견적서 조회, PDF 다운로드, 재다운로드
- [ ] (T19) 운영 화면과 PDF 값이 노션 원본과 일치하고, 메타데이터와 PDF에 표기된 링크가 운영 도메인

### 에러/예외 케이스
- [x] 잘못된 API 키: 서버 로그에 `code=unauthorized status=401 request_id=...`만 남고 가짜 키, 견적서 내용, 헤더 덤프가 로그에 없음(0건). 화면은 "문제가 발생했습니다 / 다시 시도", PDF는 500
- [x] 404 계열(없는 ID, 휴지통, 다른 DB, 형식 오류)에서 `[notion]` 줄이 남지 않음
- [ ] (T19) 운영 URL에서 잘못된 형식 ID, 없는 ID, PDF 경로의 없는 ID가 모두 404

### 경계값/엣지 케이스
- [x] 같은 견적서를 잘못된 키로 반복 요청해도 요청마다 새로 노션을 호출함(실패가 캐시되지 않음)
- [ ] (T19) 프리뷰 배포에서 사이트 URL이 프리뷰 도메인(또는 설정값)으로 만들어짐 (Task 007 연계, `VERCEL_ENV` 규칙)
- [ ] (T19) Vercel 함수에 폰트 파일이 포함되어 PDF 한글이 정상 출력됨(필요하면 `outputFileTracingIncludes`)

### 반응형/보안/품질
- [ ] (T19) 운영 URL에서 375/768/1280px 전체 여정 통과
- [ ] (T19) 응답에 `noindex` 메타 태그가 있고, 화면과 응답 헤더에 API 키나 노션 원문 오류가 노출되지 않음
- [ ] (T19) 운영 URL의 모든 페이지에서 콘솔 에러 없음(의도한 404 요청 제외)

## 테스트 결과

### T18 (2026-11-20, 로컬 운영 빌드 `build` + `start`)
- `npm run lint`, `npx tsc --noEmit`, `npm run build`, `npm run check-all` 통과
- 잘못된 키(`secret_FAKEKEY_...` 형태의 가짜 값을 환경변수로만 주입)로 서버 시작 후 `/invoice/<정상 ID>` 2회, `/invoice/<정상 ID>/pdf` 1회, `/invoice/abc` 요청:
  - 페이지 200(스트리밍된 오류 경계), PDF 500, 형식 오류 404
  - 서버 로그 45줄. 실패 1건당 `@notionhq/client warn`(code, message, attempt, requestId) + `[notion] getInvoice 실패: code=unauthorized status=401 request_id=<UUID>` + `Error: 노션에서 견적서를 불러오지 못했습니다.`(digest만) 순
  - 가짜 키가 포함된 줄 0, 견적서 내용(`테스트상사`, `[TEST]`) 포함 줄 0, `set-cookie`/`headers:` 덤프 줄 0
  - 수정 전(원본 오류를 그대로 던진 첫 구현, 페이지 3회 + PDF 1회 요청): 로그 188줄, 실패마다 오류 객체 덤프(헤더, 응답 본문, `request_id`, `ray_id`)가 출력됨. 가짜 키와 견적서 내용은 그때도 0줄이었음
  - Playwright MCP로 본 화면: "문제가 발생했습니다 / 일시적인 오류일 수 있습니다... / 다시 시도", `API token`, `unauthorized`, 키, `notion`, 요청 ID 노출 없음. 콘솔 에러 1건은 React `#441`(운영 빌드의 표준 서버 오류 메시지, Task 008에 기록된 것과 동일)
  - 응답 HTML에서 `unauthorized`가 12번 검색되나 모두 Next 내부 RSC 페이로드의 `"unauthorized":"$undefined"` 키이고 노션 오류 문구는 아님
- 정상 키로 재시작: `/invoice/<정상 ID>` 200과 본문 `[TEST] 정상`, PDF 200, 없는 ID/휴지통/다른 DB 페이지는 화면 200(404 화면), PDF 없는 ID 404. `[notion]` 로그 줄 0

### 확인하지 못한 것
- Vercel 환경(프리뷰, 운영)에서의 로그 형식과 함수 로그 조회 방법
- `restricted_resource` 같은 다른 노션 오류 코드의 실제 로그(코드는 `error.code`를 그대로 출력하는 구조라 같은 형식이 될 것으로 보이나 직접 재현하지 않음)
- T19 항목 전부(배포 후)

### T19 프리뷰 1차 (2026-11-20, https://invoice-web-two-coral.vercel.app, curl + Playwright MCP)
- 통과: 접근 보호 없이 열림. `/` 200, `/invoice/<정상 ID>` 200(`[TEST] 정상`, 총액 ₩2,490,000, 항목 3개, 링크 복사/PDF 다운로드 버튼), 콘솔 메시지 0건
- 통과: 404 계열. `/invoice/abc` HTTP 404, `/invoice/abc/pdf` 404, 형식은 맞지만 없는 ID의 PDF 404. 없는 ID 페이지는 HTTP 200(404 화면, 설계된 동작)
- 통과: PDF `/invoice/<ID>/pdf` 200, `application/pdf`, 68,709바이트, `Content-Disposition: attachment`, 임베드 폰트 `NotoSansKR-Regular/Bold` (Vercel 함수에 폰트 포함됨, `outputFileTracingIncludes` 불필요). 글자 렌더링은 눈으로 보지 않았고 폰트 임베드만 확인
- 통과: `robots: noindex, nofollow`, canonical이 접속한 프리뷰 URL과 같음
- 통과: 375px, 768px에서 가로 스크롤 없음(scrollWidth = 뷰포트 폭), 1512px에서도 동일
- 미확인: 이 URL이 프리뷰 배포인지 운영 별칭인지(`VERCEL_ENV` 규칙 판정 불가), 노션 `공유 링크` Formula 링크, 운영 도메인, 1280px 정확한 폭, PDF 화면 육안 확인, 오류 원문 비노출 시나리오(잘못된 키는 배포 환경에서 시험하지 않음)

### 사용자 결정: 남은 항목 확인 생략 (2026-11-20)
- 프리뷰 1차에서 확인하지 못한 항목(프리뷰/운영 구분과 `VERCEL_ENV` 규칙, 노션 `공유 링크` Formula 링크, 운영 도메인 재검증, PDF 육안 확인, 1280px 정확한 폭, 배포 환경 오류 시나리오)은 사용자가 "확인 안 해도 괜찮다"고 결정해 수행하지 않습니다. 체크박스는 실제로 확인하지 않았으므로 `[ ]`로 둡니다.
