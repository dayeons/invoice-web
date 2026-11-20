# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

**노션 견적서 뷰어**: 노션에 작성한 견적서를 클라이언트가 가입 없이 웹에서 보고 PDF로 받는 MVP입니다.

상세 요구사항은 @/docs/PRD.md 참조

## 명령어

```bash
npm install          # 의존성 설치 (package-lock.json 기준)
npm run dev          # 개발 서버 (http://localhost:3000)
npm run build        # 프로덕션 빌드
npm run start        # 빌드 결과 실행
npm run lint         # ESLint (eslint.config.mjs, next core-web-vitals + typescript)
npx tsc --noEmit     # 타입 체크
npm run check-all    # lint + tsc --noEmit (build는 오래 걸려 포함하지 않음)
```

- 테스트 러너와 CI는 도입하지 않기로 했습니다(2026-11-20 결정). 단일 테스트 실행 방법도 없으므로, 검증은 `check-all` + `build`와 Playwright MCP를 통한 화면 확인으로 합니다.
- shadcn 컴포넌트 추가: `npx shadcn@latest add <name>` (`components.json`, style `base-nova`, 아이콘 lucide). 현재 설치된 컴포넌트는 `src/components/ui`에 있는 것뿐이므로 필요 시 추가합니다..

## 아키텍처 (큰 그림)

### 라우팅 (`src/app`)
- 공개 라우트는 `/`(안내 문구), `/invoice/[id]`(견적서 조회, 노션 페이지 ID), `/invoice/[id]/pdf`(PDF 다운로드 Route Handler, GET), `/api/revalidate`(견적서 캐시 즉시 재검증, POST, Bearer 토큰), `not-found.tsx`(404, F011)뿐입니다. 인증/대시보드/관리자 화면은 MVP 범위가 아닙니다.
- 루트 `app/layout.tsx`는 `<html>`, 폰트, `AppProviders`만 담당합니다. 헤더/푸터 같은 공통 셸은 없습니다.
- `/invoice/[id]`는 동적 params가 런타임 데이터이므로 `<Suspense>` 경계 안에서 `await params` 합니다.
- Proxy(`src/proxy.ts`, matcher `/invoice/:id`)가 ID 형식 오류만 존재하지 않는 경로로 rewrite해 HTTP 404 + `not-found.tsx`로 응답합니다(노션 호출 없음, 형식 검사는 `src/lib/notion/id.ts` 공유). 형식은 맞지만 없는 ID, 휴지통, 다른 DB는 페이지의 `notFound()`로 404 화면 + noindex(HTTP 200)입니다.
- 사이트 이름, URL 등 전역 메타데이터는 `src/config/site.ts`에만 둡니다.

### 컴포넌트 레이어 (import 방향 고정)
- `components/ui` (shadcn 생성물) ← `components/common` ← `components/layout` ← `components/features`
- 상위 레이어가 하위 레이어를 import하는 것만 허용됩니다. 역방향 import는 만들지 마세요. (`common`, `features`는 필요할 때 생성)
- `components/providers/appProviders.tsx`가 전역 Context의 유일한 진입점입니다. 새 전역 프로바이더는 여기에 추가합니다.
- 페이지는 서버 컴포넌트로 두고, 상호작용이 필요한 부분(PDF 다운로드 버튼 등)만 `"use client"` 컴포넌트로 분리합니다.

### 데이터 흐름
- 별도 DB 없이 노션이 유일한 저장소입니다. 노션 조회 계층(F001)은 `src/lib/notion/`의 `getInvoice`이며 실제 노션 DB로 검증했습니다(ROADMAP Task 005, 항목 3개씩 묶음 조회, 총 금액은 노션 롤업 값, 비어 있으면 항목 합계로 대체). PDF 생성(F003)은 `/invoice/[id]/pdf` Route Handler가 ID만 받아 `getInvoice`로 다시 조회해 `@react-pdf/renderer`로 만들며(형식 오류는 Proxy를 거치지 않으므로 핸들러가 직접 404, 이모지는 PDF 텍스트에서만 제거), `DownloadPdfButton`이 이를 내려받습니다. 조회는 `"use cache"`/`<Suspense>` 경계 안에서 합니다.
- 환경변수는 `NOTION_API_KEY`, `NOTION_DATABASE_ID` (서버 전용, `.env.example` 참고). 선택 값 `REVALIDATE_SECRET`(서버 전용)은 `/api/revalidate`의 Bearer 토큰이며 비어 있으면 그 엔드포인트는 503으로 닫힙니다. 선택 값 `NEXT_PUBLIC_SITE_URL`(사이트 URL, 이 값에만 `NEXT_PUBLIC_` 허용)은 `siteConfig.url`이 `NEXT_PUBLIC_SITE_URL` → Vercel 배포 URL → `http://localhost:3000` 순으로 읽고, 공유 링크는 `getInvoiceUrl`(`src/lib/invoice-url.ts`)로 만듭니다.

## 이 저장소 특유의 함정

- **Base UI 기반 shadcn**: Radix의 `asChild`가 없습니다. 트리거를 다른 요소로 바꿀 때는 `render` prop을 씁니다 (`<DropdownMenuTrigger render={<Button />}>`). 링크를 버튼처럼 보이게 할 때는 `<Link className={buttonVariants()} />`를 씁니다.
- **Cache Components 활성화** (`next.config.ts`의 `cacheComponents: true`): 서버 컴포넌트에서 `new Date()`, `Math.random()` 같은 비결정 값을 바로 쓰면 빌드가 실패합니다. `"use cache"` 또는 `<Suspense>` 경계를 씁니다.
- **`next-env.d.ts`, `*.tsbuildinfo`는 gitignore 대상**이지만 로컬에 생성되어 있습니다. 커밋하지 않습니다.
- 같은 폴더에서 `next dev`를 두 개 띄울 수 없습니다(이미 실행 중이면 기존 서버 주소를 안내하고 종료). 운영 모드 확인(`next start`)이 "production build not found"로 실패하면 `npm run build`를 다시 실행하세요.
- **서버 로그에는 노션 오류 코드와 요청 ID만 남깁니다.** `getInvoice`는 비-404 오류를 `logNotionError`(`src/lib/notion/logError.ts`)로 한 줄 기록한 뒤 내용 없는 새 `Error`를 던집니다(원본 오류를 던지면 Next가 헤더와 본문까지 로그에 찍음). 새 노션 호출을 추가할 때도 오류 객체 전체를 로그에 넘기지 마세요.
- `.playwright-mcp/`(Playwright MCP 출력, gitignore 대상)는 ESLint 검사에서 제외되어 있습니다.
- `AGENTS.md`의 `BEGIN/END` 블록은 `next dev`가 자동으로 다시 씁니다. 지우지 말고 함께 커밋합니다.

## ✅ 작업 완료 체크리스트

```bash
npm run check-all   # 모든 검사 통과 확인
npm run build       # 빌드 성공 확인
```