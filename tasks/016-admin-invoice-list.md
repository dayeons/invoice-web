# Task 016: 관리자 견적서 목록 화면 구현

## 개요
`/admin`에서 Task 015의 `listInvoices()` 결과를 표(768px 이상)와 카드(768px 미만)로 보여 줍니다. 빈 상태, 노션 오류 상태, 로딩 스켈레톤, "새로고침"(목록 캐시만 즉시 만료)을 갖춥니다. 링크 복사는 Task 017 범위이므로 만들지 않습니다.

## 관련 파일
- `src/app/admin/(dashboard)/page.tsx`: 제목은 셸, 건수와 목록은 `<Suspense>` 안에서 `requireAdmin()` → `listInvoices()` 순 (레이아웃에서 인증 검사 금지)
- `src/app/admin/(dashboard)/error.tsx` (신규, `"use client"`): 노션 오류 상태, `retry` 사용, 헤더 유지
- `src/app/admin/actions.ts`: `refreshInvoiceList` 추가 (`login`/`logout` 동작 불변)
- `src/components/features/admin/invoiceList.tsx`, `invoiceListSkeleton.tsx`, `refreshListButton.tsx` (신규)
- 재사용: `StatusBadge`, `formatDate`, `formatCurrency`, `Table`, `Empty`, `Skeleton`, `Container`, `buttonVariants`
- 문서: `CLAUDE.md`, `README.md`, `shrimp-rules.md`, `docs/ROADMAP.md`(현재 구현 상태 표)

## 수락 기준
- [x] 열: 견적서 번호, 클라이언트명, 발행일, 유효기간, 상태(`StatusBadge`), 총 금액(우측 정렬), 작업(견적서 열기만)
- [x] 날짜가 `null`이면 `formatDate` 호출 전에 "-", 총 금액 `null`은 "-"이고 ₩0과 구분
- [x] "총 N건" 표시, `truncated`면 "최근 N건만 표시" 안내
- [x] 빈 상태: `Empty`로 "등록된 견적서가 없습니다"와 노션에서 추가하라는 안내
- [x] 노션 오류: 헤더가 남은 오류 화면, 원문/키 미노출, "다시 시도"로 복구
- [x] "견적서 열기"는 `/invoice/<id>`를 새 탭(`rel="noopener"`)으로, 프리페치 과다 방지(`prefetch={false}`)
- [x] "새로고침"은 Server Action이 `requireAdmin()`으로 세션을 다시 확인한 뒤 `updateTag(INVOICE_LIST_CACHE_TAG)`만 호출
- [x] 세션과 노션 읽기는 `<Suspense>` 안, `npm run build` 성공
- [x] 긴 값과 특수문자는 원문 그대로 줄바꿈되고 옆 칸을 침범하지 않음
- [x] 새 의존성 없음, `components/ui/*` 미수정, 레이어 import 방향 유지, 노션 쓰기 없음
- [x] 문서 갱신, `npm run check-all`, `npm run build` 통과, 임시 코드 삭제

## 구현 단계
- [x] 1. Next.js 문서 확인, 작업 파일 작성
- [x] 2. `refreshInvoiceList` Server Action
- [x] 3. `invoiceList`, `invoiceListSkeleton`, `refreshListButton` 컴포넌트
- [x] 4. `page.tsx` 연결, `error.tsx`
- [x] 5. 문서 갱신, `npm run check-all`, `npm run build`
- [ ] 6. Playwright MCP로 테스트 체크리스트 수행, 결과 기록 (1건 미확인: 노션 쓰기 필요)

## 테스트 체크리스트
노션 쓰기는 하지 않습니다. 노션 값 수정이 필요한 시나리오는 "미확인(노션 쓰기 필요, 사용자 승인 필요)"로 기록합니다. 운영 동작은 `npm run build` 후 `next start -p 3100`에서 확인합니다.

### 정상 케이스
- [x] 로그인 → 목록 표시, 건수 = 휴지통이 아닌 견적서 수
- [x] 행 값(번호, 클라이언트명, 날짜, 상태, 총액)이 상세 페이지 값과 일치
- [x] "견적서 열기" → 새 탭에서 같은 견적서(`rel` 확인)
- [x] "새로고침" 클릭 → 목록 재조회(응답 시간/요청 확인), 버튼 대기 상태 표시
- [ ] 노션 값 수정 후 "새로고침" → 바로 반영 (미확인: 노션 쓰기가 필요하며 사용자 승인이 없어 하지 않음)

### 에러/예외 케이스
- [x] 잘못된 노션 키 → 헤더가 남은 오류 화면과 "다시 시도", 원문/키 미노출, 서버 로그 한 줄
- [x] 세션 쿠키를 지운 뒤 "새로고침" → 로그인 화면(Server Action 재확인)
- [x] 비로그인 `/admin` → 로그인 화면 (Task 014 회귀)

### 경계값/엣지 케이스
- [x] 빈 목록(임시 필터 상수로 재현 후 원복) → 빈 상태
- [x] 총 금액 `null`은 "-", ₩0은 "₩0"(임시 데이터로 재현 후 원복), 상태 없음/알 수 없는 상태, 날짜 `null`
- [x] 긴 클라이언트명/특수문자(`[TEST]` ⑦), 큰 금액(⑧)이 옆 칸을 침범하지 않음
- [x] `truncated` 안내(상한 상수를 임시로 낮춰 확인 후 원복)
- [x] 로딩 스켈레톤 표시(Suspense fallback)

### 반응형/테마
- [x] 375px 카드, 768/1280px 표, 가로 넘침 없음(`document.documentElement.scrollWidth`)
- [x] 라이트/다크에서 표 경계, 행 hover, 배지, 스켈레톤 구분
- [x] 콘솔 에러 0

### 정리
- [x] 임시 코드/상수 원복 확인, 띄운 서버 종료, 공개 라우트 회귀 없음

## 테스트 결과
### 변경 사항 요약
- 신규: `src/app/admin/(dashboard)/error.tsx`, `src/components/features/admin/invoiceList.tsx`, `invoiceListSkeleton.tsx`, `refreshListButton.tsx`
- 수정: `src/app/admin/(dashboard)/page.tsx`(Suspense 안 `requireAdmin()` → `listInvoices()`), `src/app/admin/actions.ts`(`refreshInvoiceList` 추가, `login`/`logout` 불변)
- 검증 중 발견해 함께 고친 기존 문제 2건(아래 참고): `src/proxy.ts`, `src/lib/admin/auth.ts`
- 문서: `CLAUDE.md`, `README.md`, `shrimp-rules.md`, `docs/ROADMAP.md` 현재 구현 상태 표

### 구현 중 발견해 고친 문제
1. Server Action이 Proxy에서 막힘: 세션 쿠키를 지운 뒤 "새로고침"을 누르면 Proxy(`/admin/:path*`)가 Server Action POST를 `/admin/login`으로 redirect해 클라이언트가 "An unexpected response was received from the server." 오류를 내고 목록 오류 경계가 뜸(Action의 `requireAdmin()`에는 닿지도 못함). `next-action` 헤더가 있는 요청은 세션이 없어도 통과시켜 Action의 재확인이 올바른 redirect를 하게 함. 모든 Action은 시작할 때 세션을 재확인하므로(`login`은 세션 불필요, `logout`은 멱등) 보호는 유지됨. 수정 후 `/admin` 세션 없는 GET은 307, 가짜 Action POST는 400
2. `Date.now()` 프리렌더 오류: `next start` 직후 첫 접근에서 로그에 `Route "/admin": ... unstable value Date.now() while prerendering`가 남고, 로그인 직후 첫 클라이언트 이동에서 오류 경계가 뜨는 경우가 있었음(재시도하면 정상). `verifySessionToken`의 기본 인자 `Date.now()`가 원인. `isAdminSession`에서 `cookies()` 뒤에 `await connection()`을 추가해 해결(서버 시작 직후 로그인 흐름 재현 시 오류 로그 0, 콘솔 에러 0)

### 2026-11-21 검증 (`npm run build` 후 `next start -p 3100`)
`npm run check-all` 통과, `npm run build` 통과(`/admin`은 Partial Prerender). 관리자 비밀번호와 비밀키, 잘못된 노션 키는 명령줄 환경변수로만 전달함.

정상
- 목록 10건(휴지통 제외)이 표시됨. 10행 모두 번호, 날짜, 상태, 총액이 상세 페이지(`/invoice/<id>`) 본문에 그대로 있음. `[TEST] 빈필드`는 발행일/유효기간 "-"
- "견적서 열기": `target=_blank`, `rel=noopener`, `href=/invoice/<id>`, 새 탭 제목과 URL이 해당 견적서, `window.opener === null`
- "새로고침": 클릭 후 약 0.4초 만에 완료(캐시 적중 때는 10ms대라 재조회됨), 처리 중 버튼 비활성과 스피너 표시

에러
- 잘못된 노션 키: 헤더(테마 토글, 로그아웃)가 남은 오류 화면과 "다시 시도". 화면과 서버 로그에 키/응답 본문 없음, 로그는 `[notion] listInvoices 실패: code=unauthorized status=401 request_id=…` 한 줄씩. 키가 잘못된 채로 "다시 시도"하면 같은 오류 화면 유지(retry가 서버 재조회함)
- 세션 쿠키를 지운 뒤 "새로고침": `/admin/login`으로 이동(수정 1 적용 후), 이후 `/admin`도 로그인 화면
- 비로그인 `/admin`은 로그인 화면(307), 틀린 비밀번호 문구 정상, `/invoice/abc`는 404(공개 라우트 회귀 없음)

엣지(임시 코드로 재현 후 원복)
- 빈 목록: "총 0건"과 "등록된 견적서가 없습니다 / 노션 데이터베이스에 견적서를 추가한 뒤 새로고침해 주세요." (라이트/다크 375px)
- 총 금액 `null`은 "-", 0은 "₩0", 상태 없음은 배지 없음, 알 수 없는 상태("검토중")는 윤곽선 배지, 날짜 `null`은 "-"로 표시되고 `RangeError` 없음
- 특수문자/긴 값(`<b>X</b> & "q"` + 공백 없는 150자, 한글 120자): HTML 해석 없이 원문 그대로 보이고 375/768/1280px에서 칸 넘침 0(`scrollWidth > clientWidth`인 셀 0), 가로 넘침 0. ⑦ 실데이터와 ⑧ ₩1,200,000,000도 정상
- `truncated`(7건으로 임시 조작): "총 7건 / 최근 7건만 표시합니다."
- 스켈레톤: 서버 시작 직후 첫 접근에서 확인(건수 줄 + 6행, 다크에서 배경과 구분됨)

반응형/테마
- 375px 카드, 768/1280px 표(라이트/다크 6조합 모두 `scrollWidth === clientWidth`). 라이트 1280 표 경계와 행 hover, 다크 768 표, 다크 오류/스켈레톤 화면을 스크린샷으로 확인. 배지(대기/승인/거절)는 라이트/다크에서 구분됨
- 콘솔: 정상 흐름(수정 후 서버 시작 직후 로그인 → 목록 → 새로고침) 에러/경고 0. 오류 시나리오의 콘솔 에러는 의도한 서버 오류 전달뿐

정리
- 임시 상수 코드(`TEMP016`)는 삭제했고 `grep`으로 남은 것이 없음을 확인. 띄운 서버(3100)는 모두 종료. 3000번 포트의 다른 서버는 건드리지 않음

### 미확인 (사용자 승인 필요)
- 노션에서 값을 수정한 뒤 "새로고침" 직후 목록에 반영되는지: 노션 쓰기가 필요해 하지 않음. 새로고침이 캐시를 만료해 재조회한다는 것은 응답 시간으로만 확인함
- 라이트/다크 × 3폭 전부를 스크린샷으로 눈으로 본 것은 아님(전 조합 가로 넘침과 표/카드 전환은 수치로 확인, 일부 조합은 스크린샷)
