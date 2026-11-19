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
npx tsc --noEmit     # 타입 체크 (npm 스크립트는 없음)
```

- 테스트 러너가 설정되어 있지 않습니다. 단일 테스트 실행 방법도 없으므로, 검증은 `lint` + `tsc --noEmit` + `build`와 `dev` 서버에서의 화면 확인으로 합니다.
- shadcn 컴포넌트 추가: `npx shadcn@latest add <name>` (`components.json`, style `base-nova`, 아이콘 lucide). 현재 설치된 컴포넌트는 `src/components/ui`에 있는 것뿐이므로 필요 시 추가합니다..

## 아키텍처 (큰 그림)

### 라우팅 (`src/app`)
- 공개 라우트는 `/`(안내 문구), `/invoice/[id]`(견적서 조회, 노션 페이지 ID), `not-found.tsx`(404, F011)뿐입니다. 인증/대시보드/관리자 화면은 MVP 범위가 아닙니다.
- 루트 `app/layout.tsx`는 `<html>`, 폰트, `AppProviders`만 담당합니다. 헤더/푸터 같은 공통 셸은 없습니다.
- `/invoice/[id]`는 동적 params가 런타임 데이터이므로 `<Suspense>` 경계 안에서 `await params` 합니다.
- 사이트 이름, URL 등 전역 메타데이터는 `src/config/site.ts`에만 둡니다.

### 컴포넌트 레이어 (import 방향 고정)
- `components/ui` (shadcn 생성물) ← `components/common` ← `components/layout` ← `components/features`
- 상위 레이어가 하위 레이어를 import하는 것만 허용됩니다. 역방향 import는 만들지 마세요. (`common`, `features`는 필요할 때 생성)
- `components/providers/app-providers.tsx`가 전역 Context의 유일한 진입점입니다. 새 전역 프로바이더는 여기에 추가합니다.
- 페이지는 서버 컴포넌트로 두고, 상호작용이 필요한 부분(PDF 다운로드 버튼 등)만 `"use client"` 컴포넌트로 분리합니다.

### 데이터 흐름
- 별도 DB 없이 노션이 유일한 저장소입니다. 노션 조회 계층(F001)은 `src/lib/notion/`의 `getInvoice`로 코드가 작성되어 있으나 실제 노션 DB로 검증하기 전입니다(ROADMAP Task 005). PDF 생성(F003)은 아직 구현 전이며 `DownloadPdfButton`은 동작 없는 골격입니다. 조회는 `"use cache"`/`<Suspense>` 경계 안에서 합니다.
- 환경변수는 `NOTION_API_KEY`, `NOTION_DATABASE_ID` (서버 전용, `.env.example` 참고).

## 이 저장소 특유의 함정

- **Base UI 기반 shadcn**: Radix의 `asChild`가 없습니다. 트리거를 다른 요소로 바꿀 때는 `render` prop을 씁니다 (`<DropdownMenuTrigger render={<Button />}>`). 링크를 버튼처럼 보이게 할 때는 `<Link className={buttonVariants()} />`를 씁니다.
- **Cache Components 활성화** (`next.config.ts`의 `cacheComponents: true`): 서버 컴포넌트에서 `new Date()`, `Math.random()` 같은 비결정 값을 바로 쓰면 빌드가 실패합니다. `"use cache"` 또는 `<Suspense>` 경계를 씁니다.
- **`next-env.d.ts`, `*.tsbuildinfo`는 gitignore 대상**이지만 로컬에 생성되어 있습니다. 커밋하지 않습니다.
- `AGENTS.md`의 `BEGIN/END` 블록은 `next dev`가 자동으로 다시 씁니다. 지우지 말고 함께 커밋합니다.
