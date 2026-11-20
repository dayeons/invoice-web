# Task 007: 견적서 공유 URL 생성 체계 구축 (F010)

## 개요
견적서 공유 링크(`<사이트 URL>/invoice/<노션 페이지 ID>`)를 한 곳에서 만들도록 `siteConfig.url`을 환경변수 기반으로 바꾸고, 링크 생성 유틸 `getInvoiceUrl`을 둡니다. 이 파일은 코드 단계(`siteConfig`, `getInvoiceUrl`, 메타데이터 연결, 환경변수 문서)를 다룹니다. 노션 Formula "공유 링크" 가이드, README의 작성자용 절차, PDF 문서 내 링크 표기, 브라우저 시나리오 검증은 이후 단계에서 수행합니다.

### 사이트 URL 우선순위 (`src/config/site.ts`)
1. `NEXT_PUBLIC_SITE_URL`: 직접 지정한 값(커스텀 도메인)이 항상 우선합니다.
2. Vercel 배포 URL (Vercel 시스템 환경변수, 도메인만 들어 있고 `https://`가 없어 보충합니다)
   - `VERCEL_ENV=production`: `VERCEL_PROJECT_PRODUCTION_URL`(고정 운영 도메인. 프리뷰에서도 값이 있어 환경 구분이 필요)
   - `VERCEL_ENV=preview`: `VERCEL_URL`(해당 배포의 고유 URL). 프리뷰 링크가 운영 도메인을 가리키면 프리뷰에서 공유 링크를 검증할 수 없기 때문입니다. (ROADMAP Task 010의 "프리뷰에서 사이트 URL이 프리뷰 도메인으로 생성됨"과 일치)
   - `VERCEL_ENV`가 없으면 `VERCEL_PROJECT_PRODUCTION_URL`, 그다음 `VERCEL_URL`
3. `http://localhost:3000`

정규화: 앞뒤 공백 제거, 빈 값은 미설정으로 취급, 프로토콜(`http://`, `https://`)이 없으면 `https://` 보충, 끝의 `/` 모두 제거. 근거는 Vercel 시스템 환경변수 문서(Context7)입니다.

주의
- `NEXT_PUBLIC_` 접두사는 이 사이트 URL 값에만 씁니다. 노션 값에는 쓰지 않습니다.
- `NEXT_PUBLIC_SITE_URL`은 빌드 시점에 인라인되므로 값을 바꾸면 다시 빌드합니다. `VERCEL_*`는 서버에서만 읽히므로 `siteConfig.url`은 서버 코드에서 씁니다(현재 사용처 `layout.tsx`는 서버 컴포넌트). 클라이언트에서 링크가 필요하면 서버에서 만든 링크를 props로 넘기거나 `getInvoiceUrl`의 `baseUrl` 인자를 씁니다.
- 프리뷰의 `VERCEL_URL`은 Vercel 배포 보호가 켜져 있으면 클라이언트가 열 수 없습니다. 이 경우 `NEXT_PUBLIC_SITE_URL`로 직접 지정합니다.

### `getInvoiceUrl(pageId, baseUrl = siteConfig.url)` 입력 규칙 (`src/lib/invoice-url.ts`)
- 결과: `<baseUrl>/invoice/<하이픈 없는 32자리 소문자 ID>`
- 하이픈 포함(UUID)/미포함, 대문자/소문자 모두 받습니다. 형식 검사와 정규화는 기존 `isNotionId`, `normalizeNotionId`(`src/lib/notion/id.ts`)를 재사용합니다.
- **형식이 잘못된 입력은 `Error`를 던집니다.** 근거: (1) 호출부는 이미 검증된 ID(페이지의 `isNotionId` 통과, `Invoice.id`)를 넘기므로 형식 오류는 호출부 버그이고, (2) 그대로 돌려주면 깨진 링크가 메타데이터나 PDF에 조용히 들어가 클라이언트에게 전달될 수 있어 위험합니다. 오류 메시지에는 입력값을 넣지 않습니다. 사용자 입력에서 오는 경우(예: `params`)는 호출 전에 `isNotionId`로 거릅니다.
- `baseUrl` 끝의 `/`는 모두 제거해 `//invoice`가 생기지 않게 합니다. (`siteConfig.url`은 이미 정규화되어 있고, 직접 넘긴 값도 방어)
- 서버 전용 모듈과 노션을 import하지 않는 순수 함수라 서버/클라이언트 어디서나 호출할 수 있습니다.

### 메타데이터 방식 (`src/app/invoice/[id]/page.tsx`)
- 정적 `metadata`를 `generateMetadata`로 바꿔 `alternates.canonical = getInvoiceUrl(id)`를 추가했습니다. `robots: { index: false, follow: false }`와 `title: "견적서"`는 유지합니다. 노션은 호출하지 않고 ID만 씁니다. canonical은 대문자/하이픈 포함 URL로 들어와도 하이픈 없는 소문자 링크를 가리킵니다.
- `isNotionId(id)`가 거짓이면 canonical만 생략합니다(예외를 던지면 404 대신 에러 페이지가 되므로). 형식 오류는 `src/proxy.ts`가 먼저 404로 처리하며 이 파일은 건드리지 않았습니다.
- Cache Components 제약(설치된 `generate-metadata.md`의 "With Cache Components" 절): `generateMetadata`가 `params`(런타임 데이터)를 읽으면 요청 시점으로 미뤄집니다. 페이지의 다른 부분도 요청 시점으로 미뤄지면(여기서는 `Suspense` 안의 `await params`) 정적 쉘이 만들어지고 메타데이터는 다른 동적 콘텐츠와 함께 스트리밍되어 오류가 아닙니다. 반대로 페이지가 완전히 프리렌더 가능하면 오류가 나며 `use cache` 또는 동적 마커 컴포넌트가 필요합니다. 이 페이지는 전자라고 판단했지만 **`build`는 동시 작업 때문에 실행하지 못해 아직 확인하지 못했습니다.** Task 007 테스트에서 `build`로 확인하고, 오류가 나면 아래 대안을 씁니다.
  - 대안 1: 정적 `export const metadata`로 되돌리고 canonical 없이 `metadataBase`만 환경변수 기반으로 유지
  - 대안 2: 문서의 동적 마커(`Suspense` 안의 `connection()` 컴포넌트)를 페이지에 추가
- 스트리밍 메타데이터는 JS를 실행하지 않는 봇(HTML-limited bots)에게는 `<head>`에 담겨 전달됩니다(문서). 이 페이지는 noindex이므로 색인 측면 영향은 없고, 링크 미리보기(OG)는 별도 메타데이터를 쓰지 않습니다.

## 관련 파일
- `src/config/site.ts` (`resolveSiteUrl`, `siteConfig.url`)
- `src/lib/invoice-url.ts` (`getInvoiceUrl`)
- `src/lib/notion/id.ts` (`isNotionId`, `normalizeNotionId` 재사용, 수정 없음)
- `src/app/invoice/[id]/page.tsx` (`generateMetadata`)
- `src/app/layout.tsx` (`metadataBase: new URL(siteConfig.url)`, 수정 없음), `src/app/page.tsx` (`siteConfig.name`, 수정 없음)
- `.env.example`, `CLAUDE.md`, `README.md` (환경변수 문서)
- `docs/ROADMAP.md`, `shrimp-rules.md` 4.6절 (구현 상태 반영은 최종 단계에서)

## 수락 기준
- `NEXT_PUBLIC_SITE_URL` → Vercel 배포 URL → `http://localhost:3000` 순으로 사이트 URL이 정해지고, 끝 `/` 중복과 `https://` 누락이 보정됨
- `getInvoiceUrl`이 하이픈 포함/미포함, 대소문자 ID를 모두 하이픈 없는 32자리 소문자 링크로 만들고 잘못된 형식은 예외를 던짐
- 견적서 페이지 메타데이터에 공유 링크(canonical)가 들어가고 `noindex`는 유지됨
- 노션에서 복사한 공유 링크로 로그인 없이 견적서가 열림
- `lint`, `tsc --noEmit`, `build` 통과, 아래 테스트 체크리스트 전 항목 통과

## 구현 단계
- [x] 이 작업 파일 작성 (`getInvoiceUrl` 입력 규칙, 환경변수 우선순위, 메타데이터 방식 기록)
- [x] `siteConfig.url` 환경변수 기반 변경 (`resolveSiteUrl`)
- [x] `getInvoiceUrl` 작성 (`isNotionId`, `normalizeNotionId` 재사용)
- [x] 견적서 페이지 `generateMetadata`로 canonical 연결 (`robots` 유지)
- [x] `.env.example`, `CLAUDE.md`, `README.md` 환경변수 문서
- [x] 임시 스크립트로 우선순위, 끝 슬래시, ID 정규화 확인, `lint`, `tsc --noEmit`
- [x] `npm run build`로 `generateMetadata`와 Cache Components 충돌 여부 확인 (2026-11-20 통과, 대안 불필요)
- [x] 노션 Invoices DB Formula "공유 링크" 가이드와 README 작성자용 절차 작성 (README "견적서 작성자 가이드" 절)
- [x] PDF 문서 내 링크 표기에 `getInvoiceUrl` 연결 (Task 006 T6에서 구현, 링크 값 검증은 Task 007 체크리스트에서)
- [ ] Playwright MCP 테스트 수행과 결과 기록, ROADMAP/문서 상태 갱신 (결과 기록 완료, 미충족 2건이 남아 ROADMAP 완료 표시는 보류)

## 테스트 체크리스트
(Playwright MCP로 수행. 환경변수 시나리오는 값을 바꿔 서버를 다시 띄움. 메타데이터 링크는 `link[rel=canonical]`의 `href`로 확인)

### 정상 케이스
- [ ] 노션 Formula로 만든 링크(하이픈 없는 ID)를 새 브라우저 컨텍스트에서 열기 → 로그인 없이 견적서 정상 표시 (Formula 컬럼은 사용자가 추가하는 작업이라 미확인. 같은 형식의 링크는 새 컨텍스트에서 통과, 아래 결과 참조)
- [x] 공유 링크로 연 견적서의 번호와 총액이 노션 원본과 일치하고, 페이지 메타데이터(canonical)가 접속한 URL과 같음 (PDF 내 링크 표기는 PDF 연결 후 확인)
- [x] `NEXT_PUBLIC_SITE_URL` 미설정 → canonical이 `http://localhost:3000/invoice/<ID>`
- [x] `NEXT_PUBLIC_SITE_URL`을 임의 도메인으로 설정 후 재시작 → canonical이 해당 도메인으로 바뀜
- [x] 페이지 메타데이터에 `robots`가 `noindex, nofollow`로 유지됨

### 에러/예외 케이스
- [x] 공유 링크의 ID 일부를 지운 URL 접속 → HTTP 404 + 404 안내 페이지 (`proxy.ts`, canonical 없음)
- [x] 형식은 맞지만 없는 ID → 404 화면 + noindex, 콘솔 에러 0
- [x] `getInvoiceUrl("abc")`처럼 잘못된 ID → 예외 (임시 스크립트로 확인함, 화면에서는 호출되지 않음)
- [ ] 프리뷰/운영: Vercel 배포 URL 대체 규칙은 Task 010의 프리뷰 배포에서 확인

### 경계값/엣지 케이스
- [x] `NEXT_PUBLIC_SITE_URL` 끝에 `/`가 있어도 링크에 `//invoice`가 생기지 않음
- [x] 하이픈 포함 ID와 대문자 ID로 접속해도 canonical은 하이픈 없는 32자리 소문자, 같은 견적서가 열림
- [x] `NEXT_PUBLIC_SITE_URL`에 프로토콜이 없는 값을 넣어도 `https://`가 보충됨
- [x] `build`가 `generateMetadata`의 `params` 사용으로 실패하지 않음 (Cache Components)

### 반응형
- [x] 375px 브라우저에서 공유 링크로 열었을 때 견적서와 PDF 버튼 정상 표시, 가로 스크롤 없음
- [x] 768px, 1280px에서도 동일

## 테스트 결과

### 2026-11-19 임시 스크립트 검증 (코드 단계, 브라우저 시나리오는 미수행)
방법: `site.ts`, `invoice-url.ts`, `id.ts`를 scratchpad로 복사(`@/` 별칭만 상대 경로로 치환)한 뒤 `node --experimental-strip-types`로 실행했습니다. `siteConfig.url`은 환경변수를 `NEXT_PUBLIC_SITE_URL` 미설정/설정(`https://example.test/`) 두 번 바꿔 실제로 읽게 했고, 나머지는 `resolveSiteUrl`에 환경 객체를 넣어 확인했습니다. 총 21건 중 실패 0건.

| 확인 | 입력 | 결과 |
| --- | --- | --- |
| 모두 미설정 | 없음 | `http://localhost:3000` |
| 직접 지정 | `NEXT_PUBLIC_SITE_URL=https://a.com` | `https://a.com` |
| 끝 슬래시 제거 | `https://a.com///` | `https://a.com` |
| 프로토콜 보충 | `a.com/` | `https://a.com` |
| 빈 값/공백 | `"  "` | `http://localhost:3000` |
| 운영 | `VERCEL_ENV=production`, 운영 도메인, `VERCEL_URL` 동시 설정 | 운영 도메인에 `https://` |
| 프리뷰 | `VERCEL_ENV=preview`, 운영 도메인, `VERCEL_URL` 동시 설정 | `VERCEL_URL`에 `https://` |
| 직접 지정 우선 | `NEXT_PUBLIC_SITE_URL` + 운영 환경 | 직접 지정 값 |
| `VERCEL_ENV` 없음 | `VERCEL_URL`만 | `https://<VERCEL_URL>` |
| `siteConfig.url` 실제 읽기 | 미설정 / `https://example.test/` | `http://localhost:3000` / `https://example.test` |
| `getInvoiceUrl` 정규화 | 32자리, 대문자 UUID, 소문자 UUID, 대문자 32자리 | 모두 `<base>/invoice/41d6a564a299816c8eb5ecb02e648af7` |
| `baseUrl` 끝 슬래시 | `https://a.com//` | `https://a.com/invoice/<ID>` (`//invoice` 없음) |
| 잘못된 ID | `""`, `abc`, 31자리, 33자리, `demo`, 비-hex 문자 포함 | 모두 예외 |

정적 검증: `npx tsc --noEmit` 통과, `npm run lint` 통과.

미확인 (이후 단계)
- `npm run build`와 브라우저 시나리오(공유 링크 열기, 환경변수별 canonical, 404, 반응형)는 실행하지 않았습니다. 특히 `generateMetadata`가 Cache Components 빌드를 통과하는지는 `build`로 확인해야 합니다.

### 2026-11-20 build 확인과 PDF 링크 표기 (Task 006 T6 중 수행)
- `npm run build` 통과: `/invoice/[id]`는 `◐ (Partial Prerender)`로 표시되고 `generateMetadata`의 `params` 사용으로 인한 Cache Components 오류가 없음 → 대안 1, 2 불필요.
- PDF 하단에 `견적서 링크: <getInvoiceUrl(invoice.id)>`(클릭 가능한 링크) 표기 구현. `[TEST] 정상` PDF에서 `http://localhost:3000/invoice/41d6a564a299816c8eb5ecb02e648af7`이 하이픈 없는 32자리 소문자로 나옴을 Read로 확인. 접속 URL과의 일치, 환경변수별 값은 체크리스트에서 검증.

### 2026-11-20 Playwright MCP 시나리오 검증 (Task 007 T9)
방법: 개발 서버(3000번)에 새 격리 브라우저 컨텍스트로 접속했습니다. 환경변수 시나리오는 프로젝트를 복사한 별도 디렉터리(3100번 포트)에서 값을 바꿔 서버를 다시 띄워 확인했고, 확인 뒤 복사본은 삭제했습니다. 대상은 `[TEST] 정상`(ID `41d6a564a299816c8eb5ecb02e648af7`)입니다.

| 확인 | 입력 | 결과 |
| --- | --- | --- |
| 공유 링크 열기 | 하이픈 없는 32자리, 새 컨텍스트(로그인 없음) | HTTP 200, 번호 `[TEST] 정상`, 총액 ₩2,490,000(노션 값과 일치), 콘솔 에러 0 |
| canonical | 위 접속 URL | `http://localhost:3000/invoice/41d6...af7`로 접속 URL과 같음. PDF 하단 링크도 같은 값(Task 006 PDF 검증 기록) |
| robots | 견적서 페이지 | `noindex, nofollow` |
| ID 변형 | 하이픈 포함, 대문자, 대문자+하이픈 | 모두 같은 견적서 표시, canonical은 하이픈 없는 소문자 |
| ID 일부 삭제 | 20자리로 자른 ID | HTTP 404, 404 안내 문구, `noindex`, canonical 없음 (콘솔의 404 리소스 메시지는 문서 응답 자체의 상태 로그) |
| 없는 ID | `00000000000000000000000000000000` | 404 안내 문구, `noindex, nofollow`, 콘솔 에러 0 (dev 서버 로그가 콘솔에 경고 1건으로 전달됨, 노션 `object_not_found`) |
| 환경변수 미설정 | 3100번 포트에서 접속 | canonical은 `http://localhost:3000/...` (기본값) |
| 환경변수 설정 | `https://example.test` | `https://example.test/invoice/<ID>` |
| 끝 슬래시 | `https://example.test/` | `https://example.test/invoice/<ID>` (`//invoice` 없음) |
| 프로토콜 없음 | `example.test` | `https://example.test/invoice/<ID>` |
| 빌드 | `npm run build` | 통과 (`/invoice/[id]`는 Partial Prerender, `generateMetadata`의 `params` 사용 오류 없음) |
| 반응형 | 375/768/1280px | `scrollWidth`와 `clientWidth` 동일(가로 스크롤 없음), PDF 버튼 표시, 총액 표시 |

재빌드 필요 여부 (운영 빌드, 복사본)
- 빌드할 때 `NEXT_PUBLIC_SITE_URL`이 없었고 `next start`에서 값을 주면 그 값이 canonical에 반영됨
- 빌드할 때 값을 주었다면 `next start`에서 값을 주지 않아도 빌드 때의 값이 유지됨(빌드 때 코드에 반영됨)
- 결론: 값을 바꾸면 다시 빌드해야 안전합니다. README에도 같은 주의를 적었습니다.

미충족 항목
- 노션 Formula로 만든 링크 확인: 사용자가 Invoices DB에 `공유 링크` Formula 컬럼을 추가한 뒤, 그 컬럼에서 복사한 링크로 새 컨텍스트에서 열어 확인해야 합니다. README 절차를 그대로 따라 링크가 만들어지는지도 이때 함께 확인합니다.
- Vercel 배포 URL 대체 규칙: Task 010 프리뷰 배포에서 확인합니다.

참고
- 없는 ID(형식은 맞음)의 페이지에도 canonical이 들어갑니다(노션을 호출하지 않는 메타데이터 방식의 결과). `noindex`라 색인에는 영향이 없어 변경하지 않았습니다.

### 사용자 결정: 남은 항목 확인 생략 (2026-11-20)
- 노션 Formula 링크 열기와 프리뷰/운영의 Vercel URL 규칙은 사용자가 "확인 안 해도 괜찮다"고 결정해 수행하지 않습니다. 배포된 URL(`invoice-web-two-coral.vercel.app`)에서는 canonical이 접속 URL과 같음을 확인했습니다. 체크박스는 확인하지 않았으므로 `[ ]`로 둡니다.
