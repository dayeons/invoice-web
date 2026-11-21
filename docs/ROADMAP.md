# 노션 견적서 뷰어 고도화 로드맵 (관리자 목록)

완료된 MVP 위에 관리자 전용 견적서 목록, 목록에서 클라이언트 링크 복사, 관리자 화면 다크모드를 더하는 로드맵입니다.

## 개요

노션 견적서 뷰어는 견적서를 발행하는 프리랜서/소규모 기업(관리자)과 견적서를 받는 클라이언트를 위한 서비스입니다. MVP(노션 조회, 견적서 페이지, PDF, 404, 반응형, 견적서 페이지의 다크모드 토글과 링크 복사)는 완료되었고, 이번 고도화는 관리자가 노션을 열지 않고도 견적서를 훑어보고 보낼 링크를 바로 복사하게 하는 것이 목표입니다.

- **관리자 견적서 목록**: `/admin`에 비밀번호로 들어가 노션 DB의 견적서를 표(모바일은 카드)로 확인
- **목록에서 링크 복사**: 행마다 기존 `CopyLinkButton`과 `getInvoiceUrl`로 클라이언트용 링크 복사
- **관리자 다크모드**: 이미 전역에 있는 테마 시스템을 관리자 화면까지 확장(헤더 토글, 새 화면 다크 점검)

| 요구사항 (사용자 원문) | 담당 Task |
| --- | --- |
| 1. 관리자 레이아웃으로 견적서 목록을 볼 수 있다 | 014(접근 보호, 레이아웃), 015(목록 조회 계층), 016(목록 화면) |
| 2. 견적서 목록에서 클라이언트에게 보낼 링크를 복사할 수 있다 | 017 |
| 3. 다크모드 기능 추가 | 014(헤더 토글), 016·017(화면별 라이트/다크 확인), 018(관리자 전체 점검, 승인/거절 배지) |

> 이전 로드맵(v4.0, Phase 5까지)은 `docs/roadmaps/ROADMAP_v1.md`로 옮겼습니다. `tasks/`의 마지막 번호가 013이므로 새 Task는 014부터 씁니다. 관리자 화면은 `docs/PRD.md`, `CLAUDE.md`, `shrimp-rules.md`에서 "MVP 범위 밖/금지"였으므로 범위 편입에 맞춰 Task 014, 015, 018에서 이 문서들을 함께 고칩니다.

## 개발 워크플로우

1. **작업 계획**: 코드베이스를 확인하고 `docs/ROADMAP.md`에 새 Task를 반영. 우선순위 작업은 마지막 완료 Task 다음에 둠
2. **작업 생성**: `/tasks/XXX-description.md` 작성 (`tasks/000-sample.md` 형식: 개요, 관련 파일, 수락 기준, 구현 단계, 테스트 체크리스트, 테스트 결과). 테스트 체크리스트에는 정상/에러/엣지/반응형과 라이트/다크 시나리오를 기대 결과와 함께 나열. 새 파일의 체크박스는 비우고 "테스트 결과"는 빈 섹션으로 둠. 형식 예시는 직전 완료 작업(`011`, `012`) 참조
3. **작업 구현**: 작업 파일을 따름. Next.js 코드는 작성 전에 `node_modules/next/dist/docs/`의 관련 문서를 확인. 단계마다 `npm run check-all`(lint + `tsc --noEmit`), 완료 시 `npm run build` 통과. 구현 후 Playwright MCP로 테스트 체크리스트 전 항목을 수행(테스트 없이 완료 처리 금지)하고, 실패하면 고친 뒤 재테스트해 결과를 작업 파일에 기록. 각 Task 완료 후 다음 지시를 기다림
4. **로드맵 업데이트**: 테스트 체크리스트 전 항목 통과가 작업 파일에 기록된 Task만 ✅ 표시하고 `See: /tasks/XXX-xxx.md`를 추가(`/docs:update-roadmap`). 사용자 결정으로 확인을 생략한 항목은 사유를 함께 적음

**공통 테스트 규칙** (테스트 러너와 CI를 도입하지 않는다는 2026-11-20 결정 유지)

- 검증 수단은 `npm run check-all`, `npm run build`, Playwright MCP 화면 확인뿐입니다. HTTP 상태, 쿠키 속성, 캐시 같은 운영 동작은 `npm run build` 후 `npm run start`에서 확인합니다.
- 기본 조합은 375/768/1280px × 라이트/다크이며, 가로 넘침은 `document.documentElement.scrollWidth`로 확인합니다.
- 오류 시나리오(잘못된 노션 키, 관리자 환경변수 누락)는 명령줄 환경변수로 서버를 띄워 만들고 `.env*` 파일은 수정하지 않습니다.
- 클립보드를 읽기 전에 `clipboard-read`, `clipboard-write` 권한을 부여합니다(Task 012에서 권한 없이 `readText`를 호출해 120초 멈춤).
- 노션 테스트 데이터는 Task 005의 `[TEST]` 행을 재사용합니다. 행 추가/수정은 사용자 승인 후 `[TEST]` 행에만 합니다.
- 서버 로그의 노션 오류는 `[notion] <context> 실패: code=… status=… request_id=…` 한 줄이어야 하고, 비밀번호, 세션 쿠키 값, 견적서 내용이 로그에 없어야 합니다.

## 현재 구현 상태 (코드 확인 결과, 2026-11-21)

| 영역 | 상태 | 위치 |
| --- | --- | --- |
| 견적서 조회(F002), 노션 연동(F001), 404(F011), 반응형(F012) | 완료. `getInvoice`는 `pages.retrieve` + 항목 3개씩 묶음 조회, `"use cache"` + `cacheLife("minutes")` + 태그 `invoice-<id>` | `src/app/invoice/[id]/page.tsx`, `src/lib/notion/invoice.ts`, `src/components/features/invoice/` |
| PDF 다운로드(F003) | 완료 | `src/app/invoice/[id]/pdf/route.ts`, `src/lib/pdf/` |
| 공유 URL(F010) | 완료. `getInvoiceUrl`은 서버/클라이언트 공용 순수 함수, `siteConfig.url`의 Vercel 값은 서버에서만 읽힘 | `src/lib/invoice-url.ts`, `src/config/site.ts` |
| 캐시 재검증 | 완료. `POST /api/revalidate`(Bearer, 미설정 시 503), 본문 `{id}`로 `invoice-<id>` 태그와 `invoice-list` 태그를 만료(Task 015) | `src/app/api/revalidate/route.ts` |
| Proxy | 완료(Task 014). matcher `/invoice/:id`(ID 형식 오류만 404로 rewrite)와 `/admin/:path*`(세션 쿠키 서명/만료 낙관적 검사) | `src/proxy.ts` |
| 다크모드 기반 | 완료. `ThemeProvider`(class, 기본 system)가 `AppProviders`를 통해 전 라우트에 적용, `.dark` 토큰, sonner `Toaster`도 테마를 따름. `ThemeToggle`(common)은 견적서 페이지와 관리자 헤더에 배치. 관리자 화면(로그인, 목록 표/카드, 오류, 토스트)은 운영 빌드에서 라이트/다크/시스템을 확인했고 공개 페이지와 테마가 공유됨(Task 018) | `src/components/providers/`, `src/app/globals.css`, `src/components/common/themeToggle.tsx` |
| 링크 복사 | 완료(견적서 페이지 Task 011, 관리자 목록 행 Task 017). `CopyLinkButton`은 `common`에 있고 선택 props `size`, `subject`(접근성 이름 "링크 복사: <대상>"), `errorMessage`를 받으며 기본값은 견적서 페이지 동작. 목록은 서버에서 행마다 `getInvoiceUrl`로 만든 링크를 전달 | `src/components/common/copyLinkButton.tsx`, `src/components/features/admin/invoiceList.tsx` |
| 상태 배지 | 완료. 대기 secondary, 승인 default, 거절 destructive, 그 외 outline, 값이 없으면 숨김 | `src/components/common/statusBadge.tsx` |
| 노션 목록 조회 | 완료(Task 015, 총 금액 `null` 매핑과 값 수정 반영은 사용자 결정으로 확인 생략). `listInvoices()`는 `databases.retrieve`(데이터 소스 1개) + `dataSources.query` 100건씩 순차, `"use cache"` + `cacheLife("minutes")` + 태그 `invoice-list`, `/api/revalidate`가 목록 태그도 만료 | `src/lib/notion/invoiceList.ts` |
| 관리자 접근 보호, 레이아웃 셸 | 완료(Task 014). `ADMIN_PASSWORD` + HMAC 서명 세션 쿠키(`ADMIN_SESSION_SECRET`), `/admin/login`, 헤더(`AdminHeader`, `ThemeToggle`, 로그아웃). Proxy는 세션 없는 Server Action 요청을 통과시켜 Action의 `requireAdmin()`이 재확인(Task 016) | `src/lib/admin/`, `src/app/admin/`, `src/components/layout/adminHeader.tsx`, `src/components/features/admin/` |
| 관리자 견적서 목록 화면 | 완료(Task 016, 노션 값 수정 후 "새로고침" 반영은 사용자 결정으로 확인 생략, 검증 결과는 `tasks/016-admin-invoice-list.md`). `/admin`에 표(768px 이상)/카드, `<Suspense>` 안 `requireAdmin()` → `listInvoices()`, `refreshInvoiceList`(세션 재확인 → `updateTag`), `(dashboard)/error.tsx`. 링크 복사 버튼은 Task 017 | `src/app/admin/(dashboard)/`, `src/components/features/admin/invoiceList.tsx` |
| shadcn 컴포넌트 | alert, badge, button, card, empty, input, label, separator, skeleton, sonner, spinner, table, tooltip | `src/components/ui/` |
| 노션 SDK | `@notionhq/client` 5.31.1, 기본 API 버전 `2025-09-03`. `databases`에는 retrieve/update/create만 있고(`databases.query` 없음) 행 조회는 `dataSources.query({ data_source_id, start_cursor, page_size, sorts })`. `iteratePaginatedAPI` 헬퍼 제공, 429는 기본 2회 자동 재시도 | `node_modules/@notionhq/client` |
| 검증 도구 | `npm run check-all`(lint + `tsc --noEmit`) 있음, 테스트 러너/CI 없음 | `package.json` |

**판단 근거**

- 다크모드(요구사항 3): 테마 시스템이 루트 `AppProviders`에 있어 `/admin`에도 자동 적용되고, shadcn 컴포넌트는 토큰 기반입니다(Task 010에서 하드코딩 색상 없음 확인). 남은 일은 관리자 헤더에 토글 배치, 새 화면(로그인 폼, 목록 표/카드, 행 버튼)의 다크 확인, v1 위험 요소였던 승인/거절 배지의 실데이터 확인이라 별도 구현 Task를 두지 않았습니다.
- 링크 복사(요구사항 2): 복사 로직(클립보드 → `execCommand` 폴백 → 에러 토스트, 2초 "복사됨", 타이머 정리)은 행마다 독립 인스턴스로 그대로 쓸 수 있습니다. 바꿀 것은 공유 위치(`common`), 행용 크기, 행별 접근성 이름, 목록에 맞는 실패 문구뿐입니다.

## 결정 필요 사항 (권장안으로 로드맵을 작성함)

1. **관리자 접근 보호 방식** - 권장: 환경변수 비밀번호(`ADMIN_PASSWORD`) + HMAC 서명 세션 쿠키(`ADMIN_SESSION_SECRET`, `node:crypto`, 새 의존성 없음) + Proxy에서 `/admin` 낙관적 검사 + 페이지와 Server Action에서 재확인
   - 권장안의 한계: 비밀번호 하나를 공유해 사용자 구분과 감사 기록이 없고, 로그인 시도 제한이 없어 무차별 대입에 약하며(긴 무작위 비밀번호와 실패 지연으로 완화), 특정 세션만 끊을 수 없음(비밀키 교체 = 전원 로그아웃)
   - 대안 A, Proxy에서 HTTP Basic 인증: 가장 짧지만 로그아웃이 없고 브라우저가 자격 증명을 계속 보냄
   - 대안 B, Vercel 배포 보호: 코드 변경은 없지만 플랜/설정에 의존하고, 공개 견적서 링크는 열어 둔 채 경로 단위로 적용할 수 있는지 확인이 필요함
   - 대안 C, OAuth(Auth.js 등): 가장 안전하지만 의존성과 설정이 커서 1인 관리자 규모에는 과함
2. **목록 캐시와 재검증** - 권장: 목록을 `"use cache"` + `cacheLife("minutes")` + 태그 `invoice-list`로 캐시하고, 관리자 화면의 "새로고침" 버튼(Server Action + `updateTag`)과 기존 `POST /api/revalidate`(같은 호출에서 목록 태그도 만료, 응답 계약은 그대로)로 즉시 반영
   - 대안: 캐시 없이 접속마다 노션 조회(항상 최신이지만 접속마다 호출이 생기고 노션 지연이 화면에 그대로 드러남)
3. **승인/거절 테스트 데이터** - 결정(2026-11-21): 행을 추가하지 않고 계산 색상 확인으로 갈음. 실제로는 DB에 승인/거절 행이 이미 있어 실데이터로 확인(Task 018). 처음 권장안: Task 018에서 목록에 승인/거절 상태가 없으면 `[TEST] 승인`, `[TEST] 거절` 행 2건을 추가(기존 행 수정 금지, 확인 후 휴지통). Task 008 기록에는 ②의 PDF 상태가 "승인"으로 적혀 있으므로 먼저 목록으로 실제 값을 확인
   - 대안: 행을 추가하지 않고 Task 012처럼 계산 색상 확인으로 갈음

## 의존성과 병렬 작업

```
Task 014 (접근 보호 + 레이아웃) ─┐
                                 ├─> Task 016 (목록 화면) ─> Task 017 (링크 복사) ─> Task 018 (다크 점검, 통합, 문서)
Task 015 (목록 조회 계층) ───────┘
```

- 014와 015는 서로 독립이라 동시에 진행할 수 있습니다(015는 `src/lib/notion/`와 타입만 다룸).
- 016은 015의 타입(`InvoiceListItem`)이 정해지면 더미 데이터로 UI를 먼저 만들 수 있고, 실제 연결과 테스트는 014, 015 완료 후에 합니다.
- 017은 016의 행 레이아웃 위에 버튼을 얹으므로 016 다음, 018은 모든 Task 완료 후입니다.

## 개발 단계

### Phase 6: 관리자 기반 구축 ✅

- **Task 014: 관리자 접근 보호와 관리자 레이아웃 셸 구축** ✅ - See: `/tasks/014-admin-auth.md`
  - 목표: `/admin` 이하를 비밀번호로 보호하고, 로그인 화면과 헤더(제목, `ThemeToggle`, 로그아웃)가 있는 관리자 레이아웃 골격을 만든다. 목록 자리는 비워 둔다.
  - 의존: 없음 (Task 015와 병렬)
  - 관련 파일
    - `src/proxy.ts`: matcher를 `['/invoice/:id', '/admin/:path*']`로 넓히고 경로별로 분기(`/admin/:path*`는 `/admin` 자체도 포함). 기존 견적서 ID 검사는 그대로
    - `src/lib/admin/session.ts` (신규): 세션 서명/검증 모듈. Proxy와 서버가 함께 쓰므로 `next/headers` 같은 서버 렌더 전용 모듈을 import하지 않음(`src/lib/notion/id.ts`와 같은 규칙)
    - `src/lib/admin/auth.ts` (신규, 서버 전용): `requireAdmin()`이 `cookies()`로 세션을 확인하고 실패 시 `/admin/login`으로 `redirect`
    - `src/app/admin/actions.ts` (신규, `"use server"`): `login`, `logout`
    - `src/app/admin/layout.tsx` (신규): 관리자 공통 메타데이터(`robots: { index: false, follow: false }`)만 담당
    - `src/app/admin/login/page.tsx`, `src/app/admin/(dashboard)/layout.tsx`, `src/app/admin/(dashboard)/page.tsx` (신규): Route Group으로 로그인 화면을 헤더 밖에 둠
    - `src/components/layout/adminHeader.tsx` (신규): 우측 영역은 slot(props)으로 받아 `layout → features` 역방향 import를 만들지 않음
    - `src/components/features/admin/loginForm.tsx`(`"use client"`, `useActionState`), `logoutButton.tsx` (신규)
    - `src/components/ui/input.tsx`, `label.tsx`: `npx shadcn@latest add input label`로 추가(Base UI 기반이라 `asChild` 없음, `ui/*` 직접 편집 금지)
    - `.env.example`, `CLAUDE.md`, `shrimp-rules.md`, `README.md`
  - 참고 문서(`node_modules/next/dist/docs/01-app/`): `03-api-reference/03-file-conventions/proxy.md`, `02-guides/authentication.md`(Proxy 낙관적 검사, DAL, 레이아웃 인증 주의), `02-guides/authentication-with-cache-components.md`, `03-api-reference/04-functions/cookies.md`, `03-api-reference/03-file-conventions/route-groups.md`, `layout.md`
  - 수락 기준 요약
    - 비로그인 `/admin` 접근은 `/admin/login`으로 리다이렉트, 로그인 성공 시 `/admin`, 로그인 상태의 `/admin/login`은 `/admin`으로
    - 세션 쿠키는 `httpOnly`, `sameSite=lax`, 운영 `secure`, `path=/admin`이며 만료 시각을 포함해 서명. 위조/만료 쿠키는 비로그인으로 처리
    - 비밀번호는 SHA-256 다이제스트끼리 `timingSafeEqual`로 비교(길이 노출 없음). 실패 시 고정 지연(약 1초)과 일반 문구 "비밀번호가 올바르지 않습니다"
    - `ADMIN_PASSWORD` 또는 `ADMIN_SESSION_SECRET`이 비어 있으면 관리자 기능은 닫힘(로그인 항상 실패 + "관리자 기능이 설정되지 않았습니다" 안내, 설정 값 미노출). `/api/revalidate`의 503 규칙과 같은 방향
    - Proxy만으로 보호하지 않음: 페이지는 `<Suspense>` 안에서 `requireAdmin()`, 모든 Server Action은 시작할 때 세션 재확인, 레이아웃에서는 인증 검사를 하지 않음(Next 문서: 레이아웃은 내비게이션 때 다시 렌더링되지 않고, matcher 변경 시 Server Action 보호가 조용히 빠질 수 있음)
    - 루트 `src/app/layout.tsx`는 그대로(`<html>`, 폰트, `AppProviders`만). 관리자 레이아웃은 중첩 레이아웃이라 루트 레이아웃이 여러 개가 되지 않으며, 기존 공개 라우트는 옮기지 않음
    - 공개 동작 불변: `/invoice/abc` HTTP 404, `/invoice/<id>`와 PDF, `/api/revalidate`는 로그인 없이 동작
    - `/admin`, `/admin/login`에 noindex, 공개 페이지(`/`)에 관리자 링크 없음, 헤더에 `ThemeToggle` 배치
    - 새 의존성 없음(`shrimp-rules.md` 8.2: ROADMAP에 없는 의존성은 사용자 확인 대상)
    - 문서 갱신: `CLAUDE.md` 라우팅 절("공개 라우트는 … 뿐입니다", "인증/대시보드/관리자 화면은 MVP 범위가 아닙니다", Proxy matcher 설명)과 환경변수 설명, `shrimp-rules.md`의 관리자/인증/공통 셸 금지 문구(1절, 8.2절, 9절), `.env.example`, `README.md` 환경변수 표
  - 구현 단계
    - [x] 1. Next.js 문서 확인, 작업 파일 작성
    - [x] 2. `npx shadcn@latest add input label`
    - [x] 3. `session.ts`(서명, 검증, 만료) 구현
    - [x] 4. Proxy 분기 추가(기존 견적서 ID 검사 유지)
    - [x] 5. `login`/`logout` Server Action과 `requireAdmin()` 구현
    - [x] 6. 관리자 레이아웃, 헤더, 로그인 화면, 목록 자리표시자 구현
    - [x] 7. 문서 갱신, `npm run check-all`, `npm run build`
    - [x] 8. Playwright MCP로 테스트 체크리스트 수행, 결과 기록
  - Playwright MCP 테스트
    - 정상: 비로그인 `/admin` → 로그인 화면, 올바른 비밀번호 → `/admin`과 헤더 표시, 쿠키 속성(`HttpOnly`, `SameSite=Lax`, `Path=/admin`, 운영 빌드의 `Secure`) 확인, 로그아웃 → 쿠키 삭제 후 `/admin` 재접근 시 로그인 화면
    - 에러: 틀린 비밀번호 → 일반 문구, 쿠키 없음. 쿠키 값 한 글자 변조, 만료 시각을 과거로 조작 → 로그인 화면. 관리자 환경변수 없이 서버 시작 → 로그인 불가 안내, 화면과 로그에 설정 값 없음
    - 엣지: 로그인 상태에서 `/admin/login` → `/admin`, 빈 비밀번호, 매우 긴 입력(1,000자), 공개 라우트 회귀(`/invoice/abc` 404, `[TEST] 정상` 열람, PDF 200, `/api/revalidate` 토큰 없음 401)
    - 반응형/테마: 375/768/1280px에서 로그인 폼과 헤더가 잘리지 않음, 헤더 토글이 라이트 → 다크 → 시스템으로 순환, 다크에서 입력란 경계와 오류 문구가 보임, noindex 메타 확인, 콘솔 에러 0

- **Task 015: 노션 견적서 목록 조회 계층 구현** ✅ (노션 쓰기가 필요한 2건은 사용자 결정(2026-11-21)으로 확인 생략: 총 금액 `null` 매핑, 값 수정 후 반영) - See: `/tasks/015-invoice-list.md`
  - 목표: 관리자 목록에 필요한 필드만 노션 DB 쿼리로 가져오는 `listInvoices()`를 만든다. 견적 항목(Relation)은 조회하지 않고 상세는 기존 `getInvoice`에 맡긴다.
  - 의존: 없음 (Task 014와 병렬)
  - 관련 파일
    - `src/lib/notion/invoiceList.ts` (신규): `listInvoices()`, `INVOICE_LIST_CACHE_TAG`. 서버 전용(클라이언트 import 금지)
    - `src/types/invoice.ts`: `InvoiceListItem`(id, 견적서 번호, 클라이언트명, 발행일, 유효기간, 상태, `totalAmount: number | null`)과 반환 타입 `{ items, truncated }` 추가
    - `src/lib/notion/properties.ts`, `client.ts`, `logError.ts` 재사용(노션 컬럼명은 `INVOICE_PROPS`로만 참조, 정렬 속성도 `INVOICE_PROPS.issueDate`)
    - `src/lib/notion/invoice.ts`: 견적서 기본 필드 매핑을 공통 함수로 뽑을 때만 수정(동작 변화 없음, 상세 회귀 확인)
    - `src/app/api/revalidate/route.ts`(결정 2), `CLAUDE.md` 데이터 흐름 절, `README.md` 재검증 설명, `shrimp-rules.md` 4.1절과 8.1절("새 호출을 만들지 말고 `getInvoice` 재사용")
  - 참고 문서: `03-api-reference/01-directives/use-cache.md`(제약, 서버리스 런타임 캐시), `03-api-reference/04-functions/cacheTag.md`, `cacheLife.md`, `revalidateTag.md`, `updateTag.md`
  - 수락 기준 요약
    - 데이터 소스: `NOTION_DATABASE_ID`는 database_id(Task 005)이므로 `databases.retrieve`로 `data_sources`를 얻어 쿼리. 데이터 소스가 1개가 아니면 임의로 고르지 않고 오류로 처리. 데이터 소스 ID는 별도 `"use cache"`로 길게 캐시
    - 조회: `dataSources.query`를 `page_size: 100`과 `start_cursor`로 순차 반복(동시 요청 없음). 정렬은 발행일 내림차순, 같으면 생성 시각 내림차순. 상한(예: 1,000건 = 쿼리 10회)을 넘으면 멈추고 `truncated: true`
    - 결과에서 전체 페이지 객체(`isFullPage`)만 쓰고 휴지통 행은 제외. 견적 항목 개별 조회 0회
    - 매핑은 `readText`/`readDate`/`readSelect`/`readNumber` 재사용. 총 금액이 비었거나 롤업이 `incomplete`면 `null`(목록에서는 항목 합계로 대신할 수 없음)
    - 캐시: `"use cache"` + `cacheLife("minutes")` + `cacheTag(INVOICE_LIST_CACHE_TAG)`. 함수 안에서 `cookies()`를 읽지 않고 세션 확인은 호출하는 쪽(Task 016)이 함. 캐시 키와 태그에 비밀 값 없음
    - 오류: 노션 오류는 `object_not_found`를 포함해 모두 `logNotionError(error, "listInvoices")`로 한 줄 기록하고 내용 없는 새 `Error`를 던짐. 목록에서 `object_not_found`는 DB ID나 Integration 공유 설정 오류이므로 빈 목록으로 숨기지 않음
    - `/api/revalidate`는 같은 요청에서 `revalidateTag(INVOICE_LIST_CACHE_TAG, { expire: 0 })`도 호출하고 응답 계약(상태 코드, 본문)은 그대로
    - 문서 갱신: `CLAUDE.md` 데이터 흐름 절(목록 조회 계층, 캐시 태그), `README.md` 재검증 설명, `shrimp-rules.md` 4.1절과 8.1절
  - 구현 단계
    - [x] 1. 문서와 SDK 타입(`dataSources.query`, `iteratePaginatedAPI`) 확인, `InvoiceListItem` 타입 정의(Task 016이 더미 데이터로 착수할 수 있게 먼저 확정)
    - [x] 2. 데이터 소스 ID 조회와 캐시
    - [x] 3. 페이지네이션 쿼리, 매핑, 상한 처리
    - [x] 4. 캐시 태그, 오류 로깅, `/api/revalidate` 목록 태그 추가
    - [x] 5. 검증용 화면 연결: Task 014가 끝났으면 `/admin` 자리표시자에 임시 출력, 아니면 임시 검증 페이지(완료 전 삭제, 커밋하지 않음)
    - [x] 6. 문서 갱신, `npm run check-all`, `npm run build`
    - [ ] 7. Playwright MCP로 테스트 체크리스트 수행, 결과 기록
  - Playwright MCP 테스트
    - 정상: 표시 건수 = 휴지통이 아닌 견적서 수, `[TEST]` ①~⑨의 번호·클라이언트명·날짜·상태·총액이 상세 페이지 값과 일치(⑤ 항목 30개는 롤업 ₩4,650,000), 정렬 순서 확인
    - 에러: 잘못된 `NOTION_API_KEY` → 오류 화면, 로그는 `[notion] listInvoices 실패: code=unauthorized ...` 한 줄이고 키와 응답 본문 미노출. `NOTION_DATABASE_ID`를 형식만 맞는 임의 값으로 → 빈 목록이 아니라 오류 화면
    - 엣지: ⑩ 휴지통 미표시, ⑥ 빈 날짜, ⑦ 특수문자/긴 값, ⑧ 큰 금액, ⑨ 시각 포함 날짜(`TZ=UTC`로 띄워도 같은 날). 페이지 크기 상수를 임시로 3으로 낮춰 여러 페이지를 조회해도 건수와 순서가 같음(확인 후 원복). 서버 로그 `retrying request` 0회(임시 INFO 로그, 확인 후 원복)
    - 캐시: 재접속은 캐시 적중(응답 시간으로 확인), `/api/revalidate` 호출 직후 목록이 새로 조회됨, 상세 캐시 재검증(Task 009 시나리오) 회귀 없음
    - 정리: 임시 검증 페이지를 만들었다면 삭제되어 해당 경로가 404

### Phase 7: 관리자 목록 화면과 통합 ✅

- **Task 016: 관리자 견적서 목록 화면 구현** ✅ (노션 쓰기가 필요한 1건은 사용자 결정(2026-11-21)으로 확인 생략: 노션 값 수정 후 "새로고침" 반영) - See: `/tasks/016-admin-invoice-list.md`
  - 목표: `/admin`에서 견적서 목록을 표(768px 이상)와 카드(768px 미만)로 보여 주고 빈 상태, 노션 오류, 로딩 상태를 갖춘다.
  - 의존: Task 014(레이아웃, `requireAdmin`), Task 015(`listInvoices`, 타입)
  - 관련 파일
    - `src/app/admin/(dashboard)/page.tsx`: 제목은 셸에 두고, 건수와 목록은 `<Suspense>` 안에서 `requireAdmin()` → `listInvoices()` 순으로 조회
    - `src/app/admin/(dashboard)/error.tsx` (신규): 노션 오류 상태. 기존 `src/app/error.tsx`처럼 `retry` 사용, 헤더(토글, 로그아웃)는 유지됨
    - `src/app/admin/actions.ts`: `refreshInvoiceList`(세션 재확인 → `updateTag(INVOICE_LIST_CACHE_TAG)`) 추가
    - `src/components/features/admin/invoiceList.tsx`(카드 `md:hidden` + 표 `hidden md:block`, `invoiceItemsTable.tsx`와 같은 패턴), `invoiceListSkeleton.tsx`, `refreshListButton.tsx` (신규)
    - 재사용: `StatusBadge`, `formatDate`, `formatCurrency`, `Table`, `Empty`, `Skeleton`, `Container`
  - 수락 기준 요약
    - 열: 견적서 번호, 클라이언트명, 발행일, 유효기간, 상태(`StatusBadge`), 총 금액(우측 정렬), 작업(견적서 열기, 링크 복사는 Task 017)
    - "총 N건" 표시, `truncated`면 "최근 N건만 표시" 안내. 빈 값은 "-"로 표시하고 총 금액 `null`과 ₩0을 구분
    - 빈 상태: `Empty`로 "등록된 견적서가 없습니다"와 노션에서 추가하라는 안내
    - 노션 오류: 원문과 키 미노출, "다시 시도"로 복구
    - 견적서 열기는 `/invoice/<id>`를 새 탭(`rel="noopener"`)으로. 행이 많을 때 프리페치 요청이 과하면 `prefetch={false}`
    - "새로고침"은 세션을 다시 확인하고 목록 태그만 만료
    - 세션과 노션 읽기는 `<Suspense>` 안(Cache Components), `npm run build` 성공
    - 긴 값과 특수문자는 원문 그대로(HTML 해석 없음) 줄바꿈되고 옆 칸을 침범하지 않음
  - 구현 단계
    - [x] 1. 더미 `InvoiceListItem[]`로 표/카드/빈 상태/스켈레톤 UI 구현
    - [x] 2. 실제 `listInvoices()` 연결, 오류 경계, 새로고침 Server Action
    - [x] 3. `npm run check-all`, `npm run build`
    - [x] 4. Playwright MCP로 테스트 체크리스트 수행, 결과 기록 (미확인 1건은 사용자 결정으로 생략)
  - Playwright MCP 테스트
    - 정상: 로그인 → 목록 표시, 행 값이 노션과 상세 페이지 값과 일치, "열기" → 새 탭에서 같은 견적서, 노션 값 수정 후 "새로고침" → 바로 반영
    - 에러: 잘못된 노션 키 → 헤더가 남은 오류 화면과 "다시 시도", 세션 쿠키를 지운 뒤 "새로고침" → 로그인 화면(Server Action 재확인)
    - 엣지: 빈 목록(임시로 결과를 비우는 필터 상수로 재현 후 원복) → 빈 상태, 총 금액 `null`/₩0, 상태 없음/알 수 없는 상태, 긴 클라이언트명, 큰 금액, `truncated` 안내(상한 상수를 임시로 낮춰 확인 후 원복)
    - 반응형/테마: 375px 카드(가로 넘침 없음), 768/1280px 표, 라이트/다크에서 표 경계·행 hover·배지·스켈레톤 구분, 콘솔 에러 0

- **Task 017: 견적서 목록에서 클라이언트 링크 복사** ✅ - See: `/tasks/017-admin-copy-link.md`
  - 목표: 목록 행마다 클라이언트에게 보낼 공유 링크를 복사한다. 기존 `CopyLinkButton`과 `getInvoiceUrl`을 재사용하고 필요한 변경만 한다.
  - 의존: Task 016
  - 관련 파일
    - `src/components/features/invoice/copyLinkButton.tsx` → `src/components/common/copyLinkButton.tsx`로 이동(견적서와 관리자 두 기능이 공유하므로 `StatusBadge`, `ThemeToggle`과 같은 위치. `common`은 `ui`만 import)
    - `src/components/features/invoice/invoiceView.tsx`: import 경로만 수정
    - `src/components/features/admin/invoiceList.tsx`(버튼 배치), `src/app/admin/(dashboard)/page.tsx`(행마다 서버에서 `getInvoiceUrl(item.id)` 계산)
  - 수락 기준 요약
    - 선택 props 추가, 기본값은 현재와 동일: `size`(목록은 `"sm"`), 접근성 이름(보이는 글자를 포함해 "링크 복사: <견적서 번호>"), 실패 문구(목록용 "링크를 복사하지 못했습니다. 견적서를 열어 주소창에서 복사해 주세요.")
    - 링크는 서버에서 만든 값만 props로 전달(클라이언트에서 `siteConfig.url`로 만들지 않음, Vercel 값은 서버 전용)
    - 행별 복사 값 = `<사이트 URL>/invoice/<32자리 소문자 ID>` = 해당 견적서 페이지의 canonical
    - 토스트와 "복사됨" 상태는 클릭한 행에만 나타나고 다른 행에는 영향 없음
    - 견적서 페이지의 버튼 모양, 문구, 동작 회귀 없음
  - 구현 단계
    - [x] 1. 컴포넌트 이동과 선택 props 추가, `invoiceView` import 수정
    - [x] 2. 목록 표/카드에 버튼 배치, 서버에서 링크 계산
    - [x] 3. `npm run check-all`, `npm run build`
    - [x] 4. Playwright MCP로 테스트 체크리스트 수행(견적서 페이지 회귀 포함), 결과 기록
  - Playwright MCP 테스트
    - 정상: 세 행에서 각각 복사 → 실제 클립보드 값이 그 행의 링크와 일치, 성공 토스트, 2초 뒤 "링크 복사"로 복원. 복사한 링크를 로그인하지 않은 새 브라우저 컨텍스트에서 열면 같은 견적서
    - 에러: `writeText` 거부 → `execCommand` 폴백, 둘 다 실패 → 목록용 에러 토스트, 화면 유지
    - 엣지: 두 행을 연달아 클릭해도 상태가 행마다 따로, 같은 행 연속 클릭 시 타이머가 겹치지 않음, `NEXT_PUBLIC_SITE_URL=https://example.test`로 시작 → 복사 값에 도메인 반영, 접근성 트리에서 행마다 버튼 이름이 다름
    - 회귀: 견적서 페이지 링크 복사(Task 011 핵심 시나리오), PDF 버튼과 같은 줄, 인쇄 시 숨김
    - 반응형/테마: 375px 카드 안에서 버튼이 잘리지 않음, 768/1280px 표의 작업 열, 라이트/다크에서 버튼과 토스트가 보임

- **Task 018: 관리자 다크모드 점검, 통합 테스트와 문서 정리** ✅ (빈 상태, 스켈레톤, 상태 없음 배지는 Task 016 기록으로 갈음해 재수행하지 않음. 승인/거절은 사용자 결정으로 계산 색상 확인을 택했으나 실데이터가 있어 실제 값으로 확인) - See: `/tasks/018-admin-integration-test.md`
  - 목표: 운영 빌드에서 관리자 여정 전체와 다크모드를 통합 검증하고, 범위가 바뀐 문서를 정리한다. 새 기능은 만들지 않는다.
  - 의존: Task 014~017
  - 관련 파일: `tasks/014`~`017` 작업 파일(미확인 항목 보완 기록), `docs/PRD.md`, `README.md`, `CLAUDE.md`, `shrimp-rules.md`, `docs/ROADMAP.md`
  - 수락 기준 요약
    - `npm run check-all`, `npm run build` 통과. 운영 빌드에서 로그인 → 목록 → 링크 복사 → (비로그인 컨텍스트) 링크 열기 → PDF → 로그아웃 여정 통과
    - 다크모드: 로그인/목록(표, 카드)/빈 상태/오류/스켈레톤/토스트를 라이트·다크·시스템에서 확인, 관리자와 공개 페이지를 오가도 테마 유지, 하이드레이션 경고 없음
    - 승인/거절 배지를 실제 데이터로 라이트/다크에서 확인(결정 3)하고 v1 위험 요소 해소를 기록
    - 보안 회귀: 비로그인과 위조 쿠키는 `/admin` 차단, 로그아웃 후 뒤로 가기 동작 확인(새로고침이나 버튼 조작 시 로그인 화면), 서버 로그에 비밀번호·쿠키 값·견적서 내용 없음
    - 문서: `docs/PRD.md`(메뉴 구조에 관리자 목록 추가, "MVP 이후 기능"의 관리자 대시보드 중 목록만 편입했다고 표시, 새 기능 ID 부여 예: F020 관리자 견적서 목록, F021 목록 링크 복사, F022 관리자 다크모드), `README.md`(주요 페이지, 관리자 사용법, 환경변수, "개발 상태"와 "배포"의 낡은 Task 007/013 문구), `CLAUDE.md`·`shrimp-rules.md` 최종 대조, 이 문서의 "현재 구현 상태" 갱신
  - 구현 단계
    - [x] 1. `npm run check-all`, `npm run build`, 운영 서버 시작
    - [x] 2. 운영 빌드에서 Playwright MCP로 관리자 여정과 다크모드 조합 수행
    - [x] 3. 승인/거절 데이터 확인(실데이터가 이미 있어 행 추가 없음)
    - [x] 4. 014~017 작업 파일의 미확인 항목 보완 기록
    - [x] 5. 문서 정리와 ROADMAP 갱신
  - Playwright MCP 테스트
    - 정상: 375/768/1280px × 라이트/다크 6조합에서 관리자 여정 전체, 복사 링크와 상세 canonical 일치, 새로고침 후 테마 유지
    - 에러: 잘못된 노션 키에서 목록 오류 화면(다크 포함), 관리자 환경변수 누락 시 로그인 불가
    - 엣지: 대기/승인/거절/상태 없음이 한 화면에서 구분됨, 항목 30개·큰 금액·특수문자 행, 로그아웃 후 뒤로 가기
    - 품질: 운영 빌드 콘솔 경고/에러 0(의도한 404 제외), `/admin` 계열 noindex, 공개 라우트 회귀 없음

## 이전 완료 작업 (요약)

자세한 내용은 `docs/roadmaps/ROADMAP_v1.md`(v4.0)와 각 작업 파일에 있습니다. MVP 첫 로드맵은 `git show 8f3d9c3:docs/ROADMAP.md`로 볼 수 있습니다.

| Task | 내용 | 작업 파일 |
| --- | --- | --- |
| 003 ✅ | 견적서 표시 컴포넌트와 더미 데이터 | `/tasks/003-invoice-components.md` |
| 004 ✅ | 견적서 조회 페이지 UI와 반응형 (F002, F012) | `/tasks/004-invoice-page-ui.md` |
| 005 ✅ | 노션 연동 계층 실데이터 검증과 페이지 연결 (F001, F011) | `/tasks/005-notion-integration.md` |
| 006 ✅ | PDF 생성과 다운로드 (F003) | `/tasks/006-invoice-pdf.md` |
| 007 ✅ | 견적서 공유 URL 생성 체계 (F010, 일부 확인은 사용자 결정으로 생략) | `/tasks/007-share-url.md` |
| 008 ✅ | 핵심 기능 통합 테스트 | `/tasks/008-integration-test.md` |
| 009 ✅ | 캐시 전략, 성능, 접근성 개선 (`/api/revalidate` 도입) | `/tasks/009-cache-perf-a11y.md` |
| 010 ✅ | 다크모드 토글과 다크 스타일 점검 (Phase 5) | `/tasks/010-dark-mode.md` |
| 011 ✅ | 견적서 링크 복사 버튼 (Phase 5) | `/tasks/011-copy-link.md` |
| 012 ✅ | 다크모드와 링크 복사 통합 테스트 (Phase 5) | `/tasks/012-integration-test.md` |
| 013 ✅ | Vercel 배포와 운영 준비 (일부 확인은 사용자 결정으로 생략) | `/tasks/013-deploy.md` |

## 위험 요소

- **관리자 인증**: 환경변수 비밀번호 방식은 공유 비밀번호, 시도 제한 없음, 개별 세션 폐기 불가라는 한계가 있습니다. 긴 무작위 값(`openssl rand -base64 32`)과 HTTPS 운영을 전제로 합니다. Proxy matcher를 바꾸거나 Server Action을 옮기면 보호가 조용히 빠질 수 있으므로(Next 문서 경고) 페이지와 Server Action의 재확인을 지우지 않습니다.
- **노션 속도 제한(평균 초당 3회)**: 목록 1회는 쿼리 ceil(N/100)회(+ 데이터 소스 조회, 캐시됨)입니다. 순차 호출, 1분 캐시, SDK의 429 자동 재시도(기본 2회)로 대응하고, 견적서가 수천 건이 되면 상한과 페이지 나눔을 다시 봅니다.
- **서버리스 캐시**: Next 문서상 기본 메모리 `use cache`는 서버리스에서 요청 사이에 유지되지 않을 수 있습니다. Task 009 측정은 로컬 `next start` 기준이라 Vercel에서는 목록과 상세의 노션 호출이 측정보다 많을 수 있습니다. 배포 후 응답 시간으로 확인하고 필요하면 `use cache: remote`를 검토합니다.
- **목록과 상세 값 차이**: 총 금액이 비었거나 롤업이 `incomplete`면 목록은 "-", 상세는 항목 합계를 보여 줍니다. 목록과 상세 캐시가 따로라 1분 안에서는 서로 다른 시점 값일 수 있습니다(`/api/revalidate`는 둘 다 만료).
- **데이터 소스**: 노션 DB에 데이터 소스가 여러 개면 목록이 오류로 닫힙니다(의도된 동작). 그런 DB를 쓰게 되면 데이터 소스 ID 설정 추가를 검토합니다.
- **기록 불일치(해소, Task 018)**: 승인/거절 테스트 데이터 유무가 Task 008(② PDF 상태 "승인")과 Task 012("데이터 없음") 기록에서 엇갈렸으나, 2026-11-21 현재 DB에 대기 5, 승인 3, 거절 2건이 있어 Task 012의 "데이터 없음"이 현재와 맞지 않습니다. 승인/거절 배지는 라이트/다크에서 구분됩니다.
- **상태 속성 타입**: PRD와 README는 `Select`로 적었지만 Task 005 기록상 실제 노션 속성은 `status` 타입일 수 있습니다(기본값 `대기` 자동 입력). `readSelect`가 둘 다 처리해 표시는 문제없지만, 나중에 상태 필터를 넣으면 필터 문법이 다릅니다.
- **로그아웃 후 브라우저 캐시(확인 결과, Task 018)**: 뒤로 가기 후 화면에는 로그인 화면만 보이고 이전 목록 DOM은 `display: none`으로 숨겨져 남을 뿐이며 새로고침하면 사라집니다. 인증된 `/admin` 응답은 `Cache-Control: no-store`입니다. 캐시 헤더는 조정하지 않았습니다.
- **`NEXT_PUBLIC_SITE_URL` 빌드 시점 반영**: 값을 바꾸면 다시 빌드해야 목록의 복사 링크에 반영됩니다(운영 빌드에서 확인). 배포 환경변수를 바꾼 뒤에는 재배포가 필요합니다.

## 보류 항목 (이번 범위 밖)

| 항목 | 보류 사유 |
| --- | --- |
| 목록 검색/필터/정렬 변경 (v1 원안 015) | 요구사항에 없음. 견적서가 많아져 찾기 어려워지면 재평가 |
| 견적서 상태 변경(승인/거절 처리) | 노션 쓰기와 변경 기록이 필요함. PRD 제외 항목이며 `shrimp-rules.md` 8.2의 사용자 확인 대상 |
| 링크 공유(메신저, 메일), 조회수 통계 (v1 원안 018) | 요구가 생길 때 재평가 |
| 이메일 자동 발송, 만료 알림 | PRD "향후 개선 방향"의 자동화 단계 |
| 다중 관리자, 계정/OAuth 로그인, 감사 로그 | 1인 관리자 규모에 과함(결정 1의 대안 C) |
| 대시보드 통계(상태별 건수, 합계) | 목록이 먼저. 필요하면 목록 데이터로 계산 가능 |
| 목록 페이지 나눔 UI | 상한 안에서 전체 표시로 충분. 상한에 닿으면 재검토 |
| 노션 웹훅 기반 자동 재검증 | "새로고침" 버튼과 `/api/revalidate`로 충분 |
| Safari/Firefox 확인 | v1과 같이 Chromium(Playwright)만 사용 |

---

**문서 버전**: v5.1
**최종 업데이트**: 2026-11-21
**진행 상황**: Phase 6~7 완료 (5/5 Tasks, Task 014~018). Task 014~018 모두 ✅. 사용자 결정으로 확인을 생략한 항목: Task 015의 노션 쓰기가 필요한 2건(총 금액 `null` 매핑, 값 수정 후 반영), Task 016의 노션 값 수정 후 "새로고침" 반영 1건. Task 018은 빈 상태, 스켈레톤, 상태 없음 배지를 Task 016 기록으로 갈음했고 이 세 화면의 시스템 모드는 확인하지 않음. Phase 5까지 완료(v4.0, `docs/roadmaps/ROADMAP_v1.md`)
