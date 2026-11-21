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
| `/admin` | 관리자 화면 (비밀번호 로그인 필요, 견적서 목록과 새로고침 버튼 제공). 로그인은 `/admin/login`, noindex |
| `/api/revalidate` | 견적서 캐시 즉시 재검증 (POST, `Authorization: Bearer <REVALIDATE_SECRET>`, 본문 `{"id": "<노션 페이지 ID>"}`) |
| 404 | 존재하지 않는 견적서 접근 시 안내 (`not-found`) |
| `/` | 고유 링크로 접근하라는 안내 문구 |

## 핵심 기능

- F001 노션 데이터베이스 연동 (실제 노션 DB로 검증 완료)
- F002 견적서 조회
- F003 PDF 다운로드 (`@react-pdf/renderer`, Noto Sans KR, PDF 텍스트에서만 이모지 제거)
- F011 견적서 유효성 검증 (404 처리)
- F012 반응형 레이아웃
- 다크모드 토글(라이트/다크/시스템, `next-themes`)과 견적서 공유 링크 복사 버튼
- F020 관리자 견적서 목록(`/admin`): 비밀번호 로그인, 표(768px 이상)와 카드, 새로고침
- F021 목록 링크 복사: 행마다 클라이언트용 공유 링크를 복사
- F022 관리자 다크모드: 로그인, 목록, 오류, 로딩, 토스트까지 라이트/다크/시스템 지원

## 관리자 사용법

1. `.env.local`(운영은 Vercel 환경변수)에 `ADMIN_PASSWORD`와 `ADMIN_SESSION_SECRET`을 넣습니다. 둘 중 하나라도 비어 있으면 `/admin/login`에 "관리자 기능이 설정되지 않았습니다."만 보이고 로그인할 수 없습니다. 값 생성 예: `openssl rand -base64 32`
2. `/admin`에 접속해 비밀번호로 로그인합니다(세션 8시간, 로그아웃 버튼 제공). 공개 페이지에는 관리자 링크가 없으니 주소를 직접 입력합니다.
3. 목록에서 견적서 번호, 클라이언트명, 발행일, 유효기간, 상태, 총 금액을 확인하고, 행의 "링크 복사"로 클라이언트에게 보낼 링크를 복사합니다. "견적서 열기"는 새 탭에서 클라이언트가 보는 화면을 엽니다.
4. 목록은 노션에서 1분마다 다시 읽습니다. 노션을 고친 직후에는 "새로고침"을 눌러 바로 반영합니다.
5. 헤더의 토글로 라이트/다크/시스템 테마를 바꿉니다. 선택은 공개 페이지와 공유됩니다.

관리자 화면은 조회와 링크 복사만 하며 노션에 쓰지 않습니다. 비밀번호 하나를 공유하는 1인용이고 로그인 시도 횟수 제한이 없으므로, 긴 무작위 비밀번호와 HTTPS 운영을 전제로 합니다.

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
npm run check-all            # ESLint + 타입 체크(tsc --noEmit)
npm run build                # 프로덕션 빌드
npm run start                # 빌드 결과 실행 (build를 먼저 해야 함)
npm run lint                 # ESLint
```

> 운영 모드는 `npm run build`를 먼저 해야 `npm run start`가 동작합니다.

## 환경변수

`.env.example`을 복사해 `.env.local`을 만듭니다. 실제 값은 저장소에 올리지 않습니다.

| 이름 | 필수 | 범위 | 설명 |
|---|---|---|---|
| `NOTION_API_KEY` | 필수 | 서버 전용 | 노션 Integration의 내부 통합 토큰. `NEXT_PUBLIC_`을 붙이지 않습니다. |
| `NOTION_DATABASE_ID` | 필수 | 서버 전용 | 견적서(Invoices) 데이터베이스 ID |
| `NEXT_PUBLIC_SITE_URL` | 선택 | 서버/브라우저 | 견적서 공유 링크의 기준 도메인. 없으면 Vercel 배포 URL, 그다음 `http://localhost:3000`. 이 값만 `NEXT_PUBLIC_`을 허용하며 **빌드 시점에 반영되므로 바꾼 뒤에는 다시 빌드**합니다. |
| `ADMIN_PASSWORD` | 선택 | 서버 전용 | `/admin` 로그인 비밀번호. `ADMIN_SESSION_SECRET`과 함께 있어야 관리자 기능이 열리고, 하나라도 비어 있으면 로그인이 닫힙니다. 시도 횟수 제한이 없으니 긴 무작위 값을 씁니다. |
| `ADMIN_SESSION_SECRET` | 선택 | 서버 전용 | 관리자 세션 쿠키 서명 비밀키(HMAC-SHA256). 비밀번호와 다른 무작위 값을 쓰며, 바꾸면 모든 세션이 로그아웃됩니다. |
| `REVALIDATE_SECRET` | 선택 | 서버 전용 | `/api/revalidate` 호출용 Bearer 토큰. 비어 있으면 그 엔드포인트는 503으로 닫힙니다. 충분히 긴 무작위 문자열을 씁니다(예: `openssl rand -base64 32`). |

## 노션 데이터베이스 설정

1. [노션 Integration](https://www.notion.so/profile/integrations)을 만들고 내부 통합 토큰을 `NOTION_API_KEY`에 넣습니다.
2. 견적서(Invoices)와 항목(Items) 두 데이터베이스를 그 Integration에 공유합니다(데이터베이스 메뉴의 연결 추가).
3. 컬럼 이름은 아래와 **정확히 일치**해야 합니다(다르면 `src/lib/notion/properties.ts`의 매핑을 같이 고칩니다).

| Invoices DB | 타입 | | Items DB | 타입 |
|---|---|---|---|---|
| 견적서 번호 | Title | | 항목명 | Title |
| 클라이언트명 | Text | | 수량 | Number |
| 발행일 | Date | | 단가 | Number |
| 유효기간 | Date | | 금액 | Formula (수량 × 단가) |
| 상태 | Select (대기/승인/거절) | | | |
| 총 금액 | Number 또는 Rollup (비어 있으면 항목 합계로 대신함) | | | |
| 항목 | Relation → Items | | | |

- `NOTION_DATABASE_ID`는 Invoices DB의 ID입니다. 다른 DB의 페이지 ID로는 견적서가 조회되지 않습니다(404).
- 휴지통에 있는 견적서, 없는 ID, 접근 권한이 없는 페이지도 404입니다.

## 견적서 작성자 가이드 (공유 링크 만들기)

1. **노션에서 견적서 작성**: Invoices DB에 견적서 행을 만들고 Items DB에 항목(수량, 단가)을 연결합니다. 두 DB는 노션 Integration에 공유되어 있어야 합니다.
2. **공유 링크 만들기**: 링크는 `<사이트 URL>/invoice/<노션 페이지 ID>` 형식입니다(ID는 하이픈 유무, 대소문자 무관). 노션 Invoices DB에 Formula 속성 `공유 링크`를 추가하면 행마다 링크가 자동으로 만들어집니다.
   ```
   "https://<도메인>/invoice/" + replaceAll(id(), "-", "")
   ```
   `<도메인>`은 `NEXT_PUBLIC_SITE_URL`과 같은 도메인으로 바꿉니다. 운영 도메인이 바뀌면 Formula도 함께 고칩니다.
3. **클라이언트에게 전달**: 만든 링크를 보냅니다. 클라이언트는 로그인 없이 견적서를 보고 PDF를 내려받을 수 있습니다.

- 서버가 만드는 링크(페이지 canonical, PDF 하단 링크)는 `NEXT_PUBLIC_SITE_URL`을 기준으로 합니다.
- `NEXT_PUBLIC_SITE_URL`은 빌드 시점에 코드에 반영되므로, 값을 바꾼 뒤에는 다시 빌드해야 합니다.

## 배포 (Vercel)

> 아래는 Vercel 배포를 위한 절차입니다. 배포 URL(`vercel.app` 기본 주소)에서 견적서 조회, PDF, 링크 복사, 다크모드를 확인했습니다(Task 013). 프리뷰와 운영을 구분하는 규칙, 운영 도메인, 관리자 화면의 배포 환경 확인은 하지 않았습니다.

1. 저장소를 Vercel 프로젝트로 가져옵니다(Next.js 자동 감지).
2. 프로젝트 환경변수에 `NOTION_API_KEY`, `NOTION_DATABASE_ID`를 프리뷰와 운영 모두에 넣습니다. 즉시 재검증을 쓰려면 `REVALIDATE_SECRET`을, 관리자 화면을 쓰려면 `ADMIN_PASSWORD`와 `ADMIN_SESSION_SECRET`도 넣습니다.
3. 커스텀 도메인을 쓴다면 `NEXT_PUBLIC_SITE_URL`에 그 도메인(`https://...`)을 넣고 **다시 배포**합니다. 없으면 운영은 Vercel 운영 도메인, 프리뷰는 해당 배포의 URL로 링크가 만들어집니다.
4. 운영 도메인이 정해지면 노션 `공유 링크` Formula의 도메인을 같은 값으로 고칩니다.
5. 배포 뒤 노션 `공유 링크`로 견적서 조회, PDF 다운로드가 되는지 확인합니다.

### 노션 수정 내용을 바로 반영하기

견적서는 서버에서 1분마다 노션에서 다시 읽습니다. 수정 후 1분 안에 이전 값이 보일 수 있고, 바로 반영하려면 재검증을 호출합니다.

```bash
curl -X POST https://<도메인>/api/revalidate \
  -H "Authorization: Bearer <REVALIDATE_SECRET 값>" \
  -H "Content-Type: application/json" \
  -d '{"id": "<노션 페이지 ID>"}'
```

응답: 성공 200, 토큰 없음/불일치 401, ID 형식 오류나 본문 오류 400, `REVALIDATE_SECRET` 미설정 503. 존재하지 않는 ID도 200으로 응답합니다(캐시 태그만 만료시킴). 같은 요청에서 관리자 견적서 목록 캐시(태그 `invoice-list`)도 함께 만료되며, 응답 형식은 그대로입니다.

### 문제가 생겼을 때

- 화면에 "문제가 발생했습니다"가 나오면 서버 로그에서 `[notion]`으로 시작하는 줄을 찾습니다. 형식은 `[notion] getInvoice 실패: code=<오류 코드> status=<HTTP 상태> request_id=<노션 요청 ID>`이며 견적서 내용과 API 키는 남기지 않습니다. 예) `code=unauthorized`(status 401)는 API 키가 잘못되었거나 만료된 경우입니다.
- 견적서가 없거나 접근할 수 없는 경우(404)는 `[notion]` 줄을 남기지 않습니다. 다만 Integration에 공유되지 않은 페이지도 노션이 `object_not_found`로 응답해 404처럼 보이므로, 분명히 있는 견적서가 404라면 Integration 공유 상태를 확인하세요. 이때는 노션 클라이언트가 남기는 `@notionhq/client warn: request fail` 경고(오류 코드, 노션 안내 메시지, 요청 ID)에서 원인을 볼 수 있습니다.
- `request_id`는 노션 지원팀에 문의할 때 해당 요청을 찾는 데 씁니다.

## 개발 상태

- 완료: 스타터 예제 제거, 기본 라우트(`/`, `/invoice/[id]`, 404) 골격, 견적서 본문 UI와 반응형 레이아웃(F002, F012, 더미 데이터로 검증)
- 노션 조회(F001)와 견적서 유효성 검증(F011): 실제 노션 DB로 검증 완료 (`/invoice/<형식 오류>`는 HTTP 404, 없거나 접근할 수 없는 견적서는 404 화면)
- PDF 다운로드(F003): Playwright MCP로 검증 완료 (Task 006)
- 통합 테스트(Task 008): 운영 모드에서 전체 여정, 데이터 정합성, 에러, 엣지, 캐시 검증 완료
- 다크모드 토글(Task 010), 링크 복사(Task 011), 캐시/재검증/접근성(Task 009, Lighthouse 접근성 100): 완료
- 관리자 접근 보호(Task 014), 노션 목록 조회(Task 015), 관리자 목록 화면(Task 016), 목록 링크 복사(Task 017), 다크모드 점검과 운영 빌드 통합 테스트(Task 018): 완료
- 공유 URL(F010): 배포 URL에서 canonical이 접속 URL과 같음을 확인. 노션 `공유 링크` Formula 링크 열기와 프리뷰/운영의 Vercel URL 규칙은 사용자 결정으로 확인 생략 (Task 007)
- Vercel 배포 검증: 배포 URL에서 1, 2차 확인 완료. 프리뷰/운영 구분, 운영 도메인, 배포 환경 오류 시나리오는 사용자 결정으로 확인 생략 (Task 013)
- 확인 생략(사용자 결정): 노션 값을 고친 뒤 "새로고침" 반영(Task 016), 목록 총 금액이 비었을 때 "-" 표시와 값 수정 후 반영(Task 015)

## 문서

- [PRD](./docs/PRD.md) - 상세 요구사항
- [CLAUDE.md](./CLAUDE.md) - 개발 가이드
