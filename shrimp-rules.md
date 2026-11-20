# 개발 가이드라인 (AI Agent 전용)

> 이 문서는 AI Agent가 이 저장소를 수정할 때 따르는 규칙입니다. 일반 개발 지식은 적지 않았습니다.
> 모든 규칙은 2026-11-19 기준 실제 코드와 설정을 확인해 작성했습니다. 코드가 바뀌어 규칙과 어긋나면 7절 표에 따라 이 문서도 함께 고칩니다.

## 1. 프로젝트 개요

- 목적: 노션 DB에 작성한 견적서를 `/invoice/[노션 페이지 ID]` 공개 URL로 조회하고 PDF로 내려받는 MVP
- 별도 DB, 인증, 관리자 화면 없음. 노션이 유일한 저장소
- 데이터 접근은 서버에서만 수행

### 1.1 고정 스택 (`package.json` 기준)

| 영역 | 값 | 비고 |
| --- | --- | --- |
| Next.js | 16.4.6, App Router | `next.config.ts`: `cacheComponents`, `reactCompiler`, `partialPrefetching` 켜짐 |
| React / TS | 19.3.0 / TypeScript 5 (`strict`) | 경로 별칭 `@/*` → `src/*` |
| 스타일 | Tailwind CSS 4.3.3 | `@tailwindcss/turbopack` 룰, 토큰은 `src/app/globals.css` |
| UI | shadcn `base-nova` (`@base-ui/react`) | Radix 아님. `asChild` 없음 |
| 노션 | `@notionhq/client` 5.31.x | `data_source_id` parent까지 처리 |
| 유틸 | date-fns 4(ko), `Intl`, sonner, next-themes, lucide-react | |
| PDF | `@react-pdf/renderer` 4.9.0 | 한글 폰트 `src/assets/fonts/`(OTF), 등록은 `src/lib/pdf/fonts.ts` (ROADMAP Task 006) |

### 1.2 문서 우선순위 (충돌 시 위가 이긴다)

1. 사용자의 현재 지시
2. `CLAUDE.md`, `AGENTS.md`
3. `docs/ROADMAP.md`
4. `docs/PRD.md`
5. `README.md`

- `docs/PRD.md`는 낡았다. **Next.js 15.5.3 표기, `POST` 본문으로 받은 `invoiceData`로 PDF를 만드는 예시, `blocks.children.list` 조회 예시는 따르지 않는다.**
- 코드와 문서가 다르면 코드를 기준으로 삼고, 7절에 따라 문서를 갱신한다.

## 2. 프로젝트 아키텍처

### 2.1 디렉토리 책임

| 경로 | 책임 | 수정 규칙 |
| --- | --- | --- |
| `src/app/layout.tsx` | `<html>`, Geist 폰트, `AppProviders`, 전역 `metadata` | 헤더/푸터/공통 셸 추가 금지 |
| `src/app/page.tsx` | `/` 안내 문구 | 견적서 목록·검색 추가 금지 |
| `src/app/invoice/[id]/page.tsx` | 견적서 조회 페이지 | 서버 컴포넌트 유지. 상호작용만 `"use client"` 분리 |
| `src/app/api/revalidate/route.ts` | 견적서 캐시 즉시 재검증 (`POST`, Bearer `REVALIDATE_SECRET`, 본문 `{id}`) | 토큰은 `crypto.timingSafeEqual`로 비교, 노션 호출 금지, 응답과 로그에 토큰 금지 |
| `src/app/not-found.tsx` | 404 안내 (F011) | `notFound()` 호출 결과가 여기로 온다 |
| `src/app/error.tsx` | 런타임 에러 경계 (`"use client"`) | 노션 원문 오류, API 키를 화면에 출력 금지 |
| `src/lib/notion/client.ts` | 노션 클라이언트 싱글턴, `requireEnv` | **서버 전용** |
| `src/lib/notion/properties.ts` | 노션 컬럼명 상수 `INVOICE_PROPS`, `ITEM_PROPS`와 값 추출 헬퍼 | 컬럼명 문자열은 이 파일에만 둔다 |
| `src/lib/notion/invoice.ts` | `getInvoice`, `invoiceCacheTag` | 4.1절 불변 조건 유지 |
| `src/lib/notion/id.ts` | `NOTION_ID_PATTERN`, `isNotionId`, `normalizeNotionId` | 서버 전용 모듈을 import하지 않는 순수 모듈 (Proxy와 공유) |
| `src/proxy.ts` | `/invoice/:id` ID 형식 오류를 HTTP 404로 처리 | 노션 호출 금지 |
| `src/types/invoice.ts` | `Invoice`, `InvoiceItem` | 화면과 PDF가 공유하는 정규화 타입 |
| `src/lib/format.ts` | `formatDate`, `formatRelative`, `formatNumber`, `formatCurrency` | 날짜/금액 표시는 여기 함수만 사용 |
| `src/lib/utils.ts` | `cn` (`"cn"` 패키지 재export) | |
| `src/config/site.ts` | `siteConfig` (이름, 설명, URL) | 전역 메타데이터의 유일한 위치 |
| `src/components/ui/` | shadcn 생성물 | **수동 수정 금지.** 추가는 `npx shadcn@latest add <name>` |
| `src/components/common/` | 도메인 무관 공통 컴포넌트 | 현재 `statusBadge.tsx`. 필요할 때 파일 생성 |
| `src/components/layout/` | 레이아웃 컴포넌트 (현재 `container.tsx`) | |
| `src/components/features/` | 도메인 컴포넌트 | 견적서 컴포넌트는 `features/invoice/`에 있음 |
| `src/components/providers/` | `appProviders.tsx`, `themeProvider.tsx` | 전역 Context는 `appProviders.tsx`에만 추가 |
| `docs/` | `PRD.md`, `ROADMAP.md` | 7절 연동 규칙 적용 |
| `tasks/` | 작업 파일 (`XXX-description.md`) | `000-sample.md` 템플릿과 `003`~`008` 작업 파일이 있음 |

### 2.2 컴포넌트 import 방향 (고정)

`components/ui` ← `components/common` ← `components/layout` ← `components/features`

- 오른쪽이 왼쪽을 import하는 것만 허용한다.
- ✅ `features/invoice/invoiceHeader.tsx`가 `@/components/ui/badge`를 import
- ❌ `components/ui/*` 또는 `components/layout/*`가 `components/features/*`를 import

## 3. 코드 표준

### 3.1 언어

| 대상 | 언어 |
| --- | --- |
| 코드 주석, 커밋 메시지, 문서, 화면 문구 | 한국어 |
| 변수명, 함수명, 파일명, 타입명 | 영어 |

### 3.2 스타일 (기존 파일과 동일하게)

- 세미콜론 없음, 큰따옴표, 2칸 들여쓰기
- import 순서: 외부 패키지 → 빈 줄 → `@/` 별칭 → 빈 줄 → 상대 경로
- 도메인 타입은 `type`으로 선언 (`interface` 사용 안 함)
- 새 파일의 `cn`은 `@/lib/utils`에서 import한다. `components/ui/*` 생성물이 `"cn"`을 직접 import하는 것은 그대로 둔다.
- 파일명은 components 하위는 camelCase (`appProviders.tsx`, `themeProvider.tsx`), ui/ 는 shadcn 규칙 유지

### 3.3 날짜·금액 표시

- 날짜: `formatDate(value)`. **값이 `null`이면 호출하기 전에 `"-"`로 대체한다.** 잘못된 값이면 `formatDate`는 `RangeError`를 던진다.
- 금액: `formatCurrency(value)`. 실제 출력은 `₩1,500,000`이다.
- `formatRelative`는 내부에서 현재 시각을 읽는다. `Suspense` 또는 `"use cache"` 경계 밖의 서버 컴포넌트에서 호출하지 않는다.
- ❌ `` `${amount.toLocaleString()}원` `` 처럼 직접 포맷
- ✅ `formatCurrency(item.amount)`

## 4. 기능 구현 표준

### 4.1 노션 조회 계층 불변 조건 (`src/lib/notion/invoice.ts`)

`getInvoice(pageId)` 수정 시 아래를 모두 유지한다.

1. 함수 본문 첫 문장 `"use cache"`, 이어서 `cacheLife("minutes")`, `cacheTag(invoiceCacheTag(pageId))`
2. 노션 호출 전에 `NOTION_ID_PATTERN`으로 ID 형식을 검증하고, 실패하면 `null`
3. `isFullPage(page)` 확인과 `page.in_trash` 제외
4. `belongsToInvoiceDatabase(page)`로 지정한 DB 소속 확인. 다른 DB 페이지는 `null`
5. 관계(항목)가 `RELATION_INLINE_LIMIT`(25)개에 도달하면 `pages.properties.retrieve`로 전부 조회
6. 총 금액 컬럼(노션 롤업, 숫자 컬럼도 읽음)이 비면 항목 금액 합계로 대체
7. `invoiceCacheTag` 형식은 `invoice-<하이픈 없는 소문자 32자리>`. 바꾸면 재검증 코드와 함께 바꾼다.

### 4.2 오류 분기

| 상황 | 처리 | 결과 화면 |
| --- | --- | --- |
| ID 형식 오류 | `src/proxy.ts`가 먼저 처리 | `not-found.tsx` (HTTP 404) |
| 휴지통, 다른 DB, `ObjectNotFound`, `ValidationError` | `null` 반환 → 페이지에서 `notFound()` | `not-found.tsx` (404 화면 + noindex, HTTP 200) |
| 인증 오류, 속도 제한, 환경변수 누락, 그 외 | **`throw` 유지** | `error.tsx` |

- ❌ `catch { return null }` 로 모든 오류를 404로 숨기기
- ✅ `isNotFoundError(error)`일 때만 `null`, 나머지는 `throw error`

### 4.3 서버/클라이언트 경계

- `src/lib/notion/*`는 클라이언트 컴포넌트(`"use client"`)에서 import하지 않는다.
- 노션 값(`NOTION_API_KEY`, `NOTION_DATABASE_ID`)에 `NEXT_PUBLIC_` 접두사를 붙이지 않는다.
- 노션 호출은 서버 컴포넌트, `"use cache"` 함수, Route Handler 안에서만 한다.
- 새 노션 호출을 추가할 때 `Promise.all`로 무제한 병렬 호출하지 않는다. 노션 API는 평균 초당 3회 제한이다. (`getInvoice`의 항목 조회는 `fetchItemsInBatches`로 3개씩 묶음 조회한다. SDK는 429를 기본 2회 자동 재시도하므로 실패가 지연으로만 보일 수 있다.)

### 4.4 견적서 페이지 (`src/app/invoice/[id]/page.tsx`)

- 페이지 컴포넌트는 `params`를 직접 `await`하지 않는다. 별도 async 컴포넌트에서 `<Suspense>` 안에서 `await params` 한다. (Cache Components 때문)
- 타입은 전역 헬퍼 `PageProps<"/invoice/[id]">`, `LayoutProps<"/">`를 쓴다. 직접 `{ params: { id: string } }`로 쓰지 않는다.
- `export const metadata`의 `robots: { index: false, follow: false }`를 지운다 ❌ / 유지한다 ✅
- `getInvoice` 결과가 `null`이면 `notFound()`를 호출한다.
- 페이지는 형식을 먼저 `isNotionId`로 검사한 뒤 `normalizeNotionId`(하이픈 제거 + 소문자)로 맞춘 ID로 `getInvoice`를 호출한다. 노션 API는 대문자 ID를 거부한다.
- ID 형식 오류는 `src/proxy.ts`가 HTTP 404로 먼저 처리한다. 형식은 맞지만 없는 ID, 휴지통, 다른 DB는 페이지의 `notFound()`로 404 화면 + noindex(HTTP 200)이다.

### 4.5 PDF 다운로드 (F003, 구현 완료)

- 구현 위치: Route Handler `src/app/invoice/[id]/pdf/route.ts` (`GET`)
- **요청에서 견적서 데이터를 받지 않는다.** ID만 받아 서버에서 `getInvoice(id)`로 다시 조회한다. 없으면 404 응답.
- 한글 폰트를 프로젝트에 포함하고 `Font.register`로 등록한다. (기본 폰트는 한글이 깨진다.)
- 응답 헤더: `Content-Type: application/pdf`, `Content-Disposition: attachment; filename*=UTF-8''<인코딩된 견적서번호>.pdf`
- 다운로드 버튼만 `"use client"` 컴포넌트로 분리하고, 생성 중 비활성화 + 스피너, 실패 시 `sonner` 토스트를 쓴다.
- PDF 라이브러리는 `@react-pdf/renderer`로 한다. Puppeteer는 ROADMAP에서 제외되었다.

### 4.6 사이트 URL (F010, 환경변수화와 `getInvoiceUrl` 구현)

- `siteConfig.url`(`src/config/site.ts`)은 `NEXT_PUBLIC_SITE_URL` → Vercel 환경별 URL(운영 `VERCEL_PROJECT_PRODUCTION_URL`, 프리뷰 `VERCEL_URL`) → `http://localhost:3000` 순으로 정한다. 도메인을 다른 파일에 하드코딩하지 않는다. 이 값만 `NEXT_PUBLIC_` 접두사를 허용한다.
- 견적서 링크는 `getInvoiceUrl(pageId)`(`src/lib/invoice-url.ts`)로만 만든다. 하이픈 없는 32자리 소문자로 정규화하고, 형식이 잘못되면 예외를 던진다. PDF 문서 하단의 링크 표기도 이 함수를 쓴다(연결 완료).

## 5. 프레임워크·라이브러리 사용 표준

### 5.1 Next.js 16 (학습 데이터와 다르다)

Next.js 코드를 쓰기 전에 설치된 문서를 먼저 읽는다. 기준 경로: `node_modules/next/dist/docs/01-app/03-api-reference/`

| 주제 | 파일 |
| --- | --- |
| `"use cache"` | `01-directives/use-cache.md` |
| `cacheLife`, `cacheTag`, `revalidateTag` | `04-functions/cacheLife.md`, `cacheTag.md`, `revalidateTag.md` |
| `notFound()` | `04-functions/not-found.md` |
| `cacheComponents` 설정 | `05-config/01-next-config-js/cacheComponents.md` |
| `partialPrefetching` 설정 | `05-config/01-next-config-js/partialPrefetching.md` |
| Route Handler | `03-file-conventions/route.md` |
| 동적 라우트, `not-found`, `error` | `03-file-conventions/dynamic-routes.md`, `not-found.md`, `error.md` |

- **Cache Components가 켜져 있다.** 서버 컴포넌트에서 `new Date()`, `Date.now()`, `Math.random()`을 바로 쓰면 빌드가 실패한다. `"use cache"` 함수 또는 `<Suspense>` 안에서만 쓴다.
- `AGENTS.md`의 `BEGIN/END` 블록은 `next dev`가 자동으로 다시 쓴다. 지우지 말고 함께 커밋한다.

### 5.2 shadcn / Base UI

- 트리거를 다른 요소로 바꿀 때는 `render` prop을 쓴다.
  - ❌ `<DropdownMenuTrigger asChild><Button /></DropdownMenuTrigger>`
  - ✅ `<DropdownMenuTrigger render={<Button />} />`
- 링크를 버튼처럼 보이게 할 때는 `<Link className={buttonVariants()} />`를 쓴다. ❌ `<Button asChild><Link /></Button>`
- 설치된 컴포넌트: `alert`, `badge`, `button`, `card`, `empty`, `separator`, `skeleton`, `sonner`, `spinner`, `table`, `tooltip`. 새 UI가 필요하면 이 목록을 먼저 확인하고, 없으면 shadcn MCP 또는 `npx shadcn@latest add <name>`으로 추가한다.
- `ui/table.tsx`는 `"use client"` 파일이지만 서버 컴포넌트에서 import해도 된다.

### 5.3 기타

| 대상 | 규칙 |
| --- | --- |
| 전역 Context | `components/providers/appProviders.tsx`에만 추가 (현재: `ThemeProvider`, `TooltipProvider`, `Toaster`) |
| 테마 | `next-themes`, `attribute="class"`. 색은 `globals.css`의 토큰 변수만 사용 (하드코딩 색상 금지) |
| 아이콘 | `lucide-react` |
| 토스트 | `sonner` (`Toaster`는 이미 등록됨. 중복 등록 금지) |
| 숫자/통화 | `Intl` (`format.ts`), 날짜는 `date-fns` + `ko` 로케일 |
| `@notionhq/client`, `@base-ui/react`, `date-fns` 등 Next.js 외 라이브러리 | API가 불확실하면 Context7 MCP로 현재 문서를 조회한다 |
| 브라우저 동작 검증 | Playwright MCP |

## 6. 워크플로우 표준

### 6.1 데이터 흐름

```
GET /invoice/[id]
  → page.tsx : <Suspense> 안에서 await params
  → getInvoice(id)  ["use cache", 서버 재검증 1분(stale 5분, 만료 1시간), tag=invoice-<id>]
      → ID 형식 검증 → pages.retrieve → 휴지통/DB 소속 검사
      → 항목 관계 ID 수집(25개 이상이면 속성 API) → 항목 페이지 조회
      → Invoice 로 정규화 (properties.ts 헬퍼)
  → null  : notFound() → not-found.tsx (404)
  → throw : error.tsx
  → Invoice : 화면 렌더링 (+ PDF Route Handler 가 같은 getInvoice 재사용)
```

### 6.2 작업 절차 (`docs/ROADMAP.md` 기준)

1. 요청에 Task 번호나 기능 ID(F001~F012)가 있으면 `docs/ROADMAP.md`의 해당 Task를 먼저 읽는다.
2. 새 작업은 `tasks/XXX-description.md`로 만든다 (예: `tasks/003-invoice-components.md`). 고수준 명세, 관련 파일, 수락 기준, 구현 단계, **`## 테스트 체크리스트`**, 빈 **`## 테스트 결과`**를 포함한다. 직전 완료 작업 1~2개를 참고한다.
3. 구현 후 반드시 테스트한다. 브라우저 E2E는 Playwright MCP로 한다. (화면 폭 375/768/1280px, 콘솔, 네트워크, 다운로드 이벤트 확인) 결과를 작업 파일의 `## 테스트 결과`에 기록한다.
4. 각 단계가 끝나면 멈추고 사용자의 다음 지시를 기다린다.
5. 체크리스트 전 항목 통과가 기록된 Task만 `docs/ROADMAP.md`에서 ✅로 바꾸고 `See: /tasks/XXX-xxx.md`를 붙인다. 코드를 다 썼어도 테스트 전에는 ✅ 금지.

### 6.3 검증 명령

테스트 러너가 없다. 아래는 보조 검증이며 E2E 테스트를 대신하지 않는다.

| 시점 | 명령 |
| --- | --- |
| 단계마다 | `npm run lint`, `npx tsc --noEmit` |
| Task 완료 시 | `npm run build` |
| 화면 확인 | `npm run dev` (http://localhost:3000) + Playwright MCP |
| 캐시·운영 동작 확인 | `npm run build` 후 `npm run start` |

### 6.4 Git

- 커밋 메시지는 한국어, 형식 `<이모지> <타입>: <설명>` (예: `✨ feat: 노션 견적서 조회 계층 구현`). 명령형, 첫 줄 72자 미만, 한 커밋에 한 목적. 이모지와 타입은 `.claude/commands/git/commit.md`의 표를 따른다.
- `/git:commit` 명령 문서는 커밋에 Claude 서명을 추가하지 않도록 정해 두었다.
- `git add -A`, `git add .`를 쓰지 않는다. 변경한 파일만 이름으로 stage한다. (작업과 무관한 `.mcp.json` 수정과 `shrimp_data/`가 작업 트리에 있다.)

## 7. 핵심 파일 연동 표준 (같이 수정해야 하는 파일)

| 변경 | 반드시 함께 확인·수정 |
| --- | --- |
| 노션 컬럼 추가/이름 변경/타입 변경 | `src/lib/notion/properties.ts`(`INVOICE_PROPS`/`ITEM_PROPS`) + `src/types/invoice.ts` + `src/lib/notion/invoice.ts` + 해당 필드를 표시하는 컴포넌트(PDF 문서 컴포넌트 포함) + `docs/PRD.md` 데이터 모델·DB 구조 예시 |
| `Invoice`/`InvoiceItem` 필드 추가 | `src/types/invoice.ts` → `invoice.ts`의 반환 객체 → `features/invoice/*` 화면 컴포넌트 → PDF 문서 컴포넌트 (화면과 PDF의 정보 구조를 같게 유지) |
| 환경변수 추가/이름 변경 | `.env.example` + `src/lib/notion/client.ts`의 `requireEnv` 이름 유니온 타입 + `CLAUDE.md` 데이터 흐름 절 + `README.md` 시작하기 |
| 새 라우트 추가/삭제 | `CLAUDE.md` 라우팅 절("공개 라우트는 … 뿐") + `README.md` 주요 페이지 표 + `docs/ROADMAP.md` |
| shadcn 컴포넌트 추가 | `CLAUDE.md`·`docs/ROADMAP.md`의 설치된 컴포넌트 설명 |
| `siteConfig` 변경 | `src/app/layout.tsx`의 `metadata`(`metadataBase`, `title`, `description`) 영향 확인 |
| 구현 상태 변경 (새 기능 완료) | `docs/ROADMAP.md` "현재 구현 상태" 표 + `CLAUDE.md` 데이터 흐름 절 + `README.md` "개발 상태", "기술 스택"의 예정 항목 |
| 의존성·버전 변경 | `package.json`/`package-lock.json` + `docs/ROADMAP.md` 기술 스택 표 + 이 문서 1.1절 |
| 훅·MCP 설정 변경 | `.claude/settings.json` / `.mcp.json`. 이 문서 5절의 도구 설명과 어긋나면 갱신 |

**이미 낡은 문장 (해당 작업을 할 때 같이 고친다)**
- 현재 알려진 낡은 문장은 없다. (Task 005 완료 시 `CLAUDE.md`, `README.md`의 노션 검증 문구를 갱신했다.)

## 8. AI 의사결정 표준

### 8.1 판단 순서

1. 요청이 어느 기능 ID(F001~F012)와 Task에 속하는지 확인 → `docs/ROADMAP.md`의 범위, 완료 기준, 테스트 체크리스트를 따른다.
2. Next.js API를 쓴다 → 5.1절 설치 문서를 먼저 읽는다.
3. UI가 필요하다 → `src/components/ui`에 있는지 확인 → 없으면 shadcn으로 추가 → 도메인 컴포넌트는 `features/`, 도메인 무관이면 `common/`.
4. 노션 데이터가 필요하다 → 새 호출을 만들지 말고 `getInvoice`를 재사용한다. 필드가 부족하면 7절의 "필드 추가" 순서로 확장한다.
5. 서버 컴포넌트에 시간·난수가 필요하다 → `"use cache"` 또는 `<Suspense>` 경계 안으로 옮긴다.

### 8.2 사용자에게 확인하고 진행하는 경우 (임의 결정 금지)

| 상황 | 이유 |
| --- | --- |
| `formatCurrency` 표기 변경 | 실제 출력은 `₩1,500,000`인데 ROADMAP 테스트 예시는 `1,500,000원`이다. 둘 중 무엇이 의도인지 모른다. |
| `.mcp.json` 커밋 | `.mcp.json`은 로컬 절대경로를 포함한다. (`shrimp_data/`와 `.env.example` 예외는 `.gitignore`에 반영되어 있다.) |
| ROADMAP에 없는 의존성 추가 | 계획된 것은 `@react-pdf/renderer`뿐이다. |
| MVP 범위 밖 기능 (관리자 대시보드, 상태 변경, 이메일 발송, 로그인, 다국어, 템플릿, 버전 관리, 만료 처리) | PRD 3절·ROADMAP "범위 밖"에 제외로 명시되어 있다. |
| 노션 `상태` 값으로 접근 제어나 상태 변경 | MVP에서는 배지 표시만 한다. |

## 9. 금지 사항

### 보안·비밀

- `.env`, `.env.local`, `.env.*`를 읽거나 출력하지 않는다. (실제 키가 들어 있을 수 있다.)
- API 키, 슬랙 웹훅 URL을 추적되는 파일, 로그, 화면 출력에 쓰지 않는다. 웹훅은 `.claude/settings.local.json`의 `env.SLACK_WEBHOOK_URL`에서만 읽는다 (`.claude/hooks/slack-notify.sh`).
- ❌ `NEXT_PUBLIC_NOTION_API_KEY` / ✅ `NOTION_API_KEY`
- 노션 SDK 오류 원문을 사용자 화면에 노출하지 않는다.
- 클라이언트가 보낸 금액·항목으로 PDF를 만들지 않는다. (4.5절)

### 구조

- 공통 셸(헤더/푸터), 인증, 대시보드, 관리자 화면을 만들지 않는다.
- `components/ui/*`를 직접 편집하지 않는다.
- 역방향 import를 만들지 않는다. (2.2절)
- 노션 컬럼명 문자열을 `properties.ts` 밖에 쓰지 않는다.
  - ❌ `readText(properties, "견적서 번호")`
  - ✅ `readText(properties, INVOICE_PROPS.number)`
- 새 전역 Provider를 `layout.tsx`에 직접 감싸지 않는다. `appProviders.tsx`에 추가한다.
- 도메인·사이트 이름을 `siteConfig` 밖에 하드코딩하지 않는다.

### Cache Components

- ❌ 서버 컴포넌트 최상위에서 `const now = new Date()`
- ✅ `"use cache"` 함수나 `<Suspense>` 안에서 사용
- `getInvoice`의 `"use cache"` / `cacheLife` / `cacheTag`를 제거하지 않는다.

### 워크플로우

- 테스트 없이 ROADMAP Task를 ✅로 바꾸지 않는다.
- `lint`와 `tsc --noEmit`를 통과하지 않은 채 단계를 끝내지 않는다.
- `next-env.d.ts`, `*.tsbuildinfo`, `.env*`를 커밋하지 않는다.
- `AGENTS.md`의 `BEGIN/END` 블록을 삭제하지 않는다.
- `docs/PRD.md`의 코드 예시를 그대로 복사해 구현하지 않는다.
