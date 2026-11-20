# 노션 견적서 뷰어

노션 데이터베이스에 작성한 견적서를, 클라이언트가 가입/로그인 없이 공개 URL로 조회하고 PDF로 내려받는 MVP입니다.

## 프로젝트 개요

- **목적**: 노션을 데이터베이스로 활용해 견적서를 관리하고, 클라이언트가 웹에서 조회 및 PDF 다운로드할 수 있게 한다.
- **사용자**: 견적서를 발행하는 프리랜서/소규모 기업, 견적서를 받는 클라이언트.
- **데이터 저장소**: 별도 DB 없이 노션이 유일한 저장소입니다.

## 주요 페이지

| 경로 | 설명 |
|---|---|
| `/invoice/[id]` | 견적서 조회 페이지 (노션 페이지 ID 기반 공개 URL) |
| `/invoice/[id]/pdf` | 견적서 PDF 다운로드 (GET, 서버가 노션에서 다시 조회) |
| 404 | 존재하지 않는 견적서 접근 시 안내 (`not-found`) |
| `/` | 고유 링크로 접근하라는 안내 문구 |

## 핵심 기능

- F001 노션 데이터베이스 연동 (실제 노션 DB로 검증 완료)
- F002 견적서 조회
- F003 PDF 다운로드 (`@react-pdf/renderer`, Noto Sans KR, PDF 텍스트에서만 이모지 제거)
- F011 견적서 유효성 검증 (404 처리)
- F012 반응형 레이아웃

## 기술 스택

- Framework: Next.js 16 (App Router, Cache Components, React Compiler)
- Runtime: React 19
- Language: TypeScript
- Styling: TailwindCSS v4
- UI Components: shadcn/ui (`base-nova`, Base UI 기반), lucide-react
- 유틸: sonner, next-themes, date-fns
- 노션 연동: @notionhq/client
- PDF: @react-pdf/renderer

## 시작하기

```bash
npm install
cp .env.example .env.local   # NOTION_API_KEY, NOTION_DATABASE_ID 입력
npm run dev                  # http://localhost:3000
npm run build                # 프로덕션 빌드
npm run lint                 # ESLint
```

선택 환경변수 `NEXT_PUBLIC_SITE_URL`은 견적서 공유 링크의 기준 도메인입니다. 없으면 Vercel 배포 URL, 그다음 `http://localhost:3000`을 씁니다. (노션 값에는 `NEXT_PUBLIC_`을 붙이지 않습니다.)

## 개발 상태

- 완료: 스타터 예제 제거, 기본 라우트(`/`, `/invoice/[id]`, 404) 골격, 견적서 본문 UI와 반응형 레이아웃(F002, F012, 더미 데이터로 검증)
- 노션 조회(F001)와 견적서 유효성 검증(F011): 실제 노션 DB로 검증 완료 (`/invoice/<형식 오류>`는 HTTP 404, 없거나 접근할 수 없는 견적서는 404 화면)
- PDF 다운로드(F003): Playwright MCP로 검증 완료 (Task 006)

## 문서

- [PRD](./docs/PRD.md) - 상세 요구사항
- [CLAUDE.md](./CLAUDE.md) - 개발 가이드
