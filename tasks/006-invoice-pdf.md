# Task 006: PDF 생성과 다운로드 구현 (F003)

## 개요
견적서를 PDF 파일로 내려받을 수 있게 합니다. 서버(Route Handler)가 `getInvoice(id)`로 견적서를 다시 조회해 PDF를 만들고, 클라이언트가 보낸 금액이나 항목은 사용하지 않습니다. 이 작업은 세 단계(T5 준비, T6 Route Handler, T7 버튼 연결과 전체 검증)로 나뉘며, 현재 T5(의존성, 한글 폰트, PDF 문서 컴포넌트)만 진행했습니다.

### PDF 방식 결정 근거
- **`@react-pdf/renderer` 채택**: 순수 Node.js에서 동작해 Vercel 서버리스 함수에서 가볍고, React 컴포넌트(`Document`, `Page`, `View`, `Text`)로 문서를 구성하므로 웹 화면 컴포넌트와 같은 정보 구조를 유지하기 쉽습니다. 기본 폰트는 한글을 지원하지 않으므로 한글 폰트 등록이 필요합니다.
- **Puppeteer 제외**: 헤드리스 Chromium 번들 크기가 커서 서버리스 함수 크기 제한과 콜드 스타트에 불리합니다.
- 설치 버전: `@react-pdf/renderer` 4.9.0 (React 19 peer 지원 확인). 이 패키지는 Next.js 기본 `serverExternalPackages` 목록에 이미 들어 있어 `next.config.ts`에 따로 추가하지 않습니다.

### 폰트
- 사용 폰트: Noto Sans KR 정적 Regular(400), Bold(700). 라이선스 SIL Open Font License 1.1(전문 `src/assets/fonts/OFL.txt`).
- 출처: `https://github.com/notofonts/noto-cjk` 의 `Sans/SubsetOTF/KR/` (공식 저장소). 라이선스 파일은 같은 저장소의 `Sans/LICENSE`.
- 파일은 격리된 빈 디렉토리에 내려받아 `file` 명령과 헤더(`OTTO`)로 형식을 확인한 뒤 복사했습니다.

| 파일 | 크기(바이트) | SHA-256 |
| --- | --- | --- |
| `NotoSansKR-Regular.otf` | 4,644,748 | `69975a0ac8472717870aefeab0a4d52739308d90856b9955313b2ad5e0148d68` |
| `NotoSansKR-Bold.otf` | 4,816,044 | `5a6ceb287ed2fc6cfc6213144ebea68cbd94b20fc9eb873d8486493bf02d9bda` |
| `OFL.txt` | 4,301 | `6a73f9541c2de74158c0e7cf6b0a58ef774f5a780bf191f2d7ec9cc53efe2bf2` |

- **TTF가 아니라 OTF(CFF)를 쓴 이유**: 1차로 `google/fonts`의 `NotoSansKR[wght].ttf`(가변 TrueType, 10,414,588바이트, SHA-256 `194018e6b2b293a7964f037b25c0249ce1418bc9ab3c971060a03aa57861e252`)를 시도했으나, `@react-pdf/renderer`가 가변 폰트의 굵기 축을 적용하지 못해 Regular와 Bold가 모두 가는 굵기(Thin 계열)로 렌더링됐습니다. `google/fonts`에는 정적 TTF가 없고, 정적 Regular/Bold는 `notofonts/noto-cjk`의 OTF뿐이라 이를 채택했습니다. react-pdf에서 한글, 굵기, 줄바꿈이 정상 렌더링되는 것을 확인했습니다. 가변 TTF 파일은 저장소에 포함하지 않았습니다.
- 용량 최적화(서브셋 등)는 Task 009에서 합니다. 현재 폰트 2개가 약 9.5MB로 Vercel 함수 크기에 영향이 있는지 T6에서 확인합니다.
- 이모지 글리프가 폰트에 없어 이모지는 PDF에 올바르게 표시되지 않습니다(깨진 글리프가 앞뒤 글자에 겹쳐 보임). 결정이 필요한 사항으로 보고합니다.

### T5 렌더링 사전 확인 (임시 스크립트, Next.js 빌드 밖)
`ts.transpileModule`로 TSX를 변환해 `renderToBuffer`로 PDF를 만들고 Read 도구로 확인했습니다(공식 테스트 결과가 아니라 T6 전 사전 확인이며, 정식 검증은 T6, T7에서 합니다). 시드가 없어 하드코딩 Invoice 5종을 썼습니다.
- 항목 3개: 한글, 굵기, 금액, 날짜 정상
- 항목 30개: 2페이지로 나뉘고 머리글 반복, 행 잘림 없음, 쪽 번호 표시
- 항목 0개: 날짜 "-", 빈 상태 안내, 소계와 총액 ₩0
- 긴 한글/특수문자: 긴 클라이언트명과 항목명이 줄바꿈되고 `&` `<` `"` 정상. 공백 없는 긴 단어를 글자 단위로 나눌 때 줄 끝에 하이픈(`-`)이 붙는 현상이 있음(react-pdf 동작, 수용 여부는 사용자 판단). 이모지는 폰트에 글리프가 없어 깨진 글리프가 겹쳐 표시됨
- 10억 원 금액: `₩1,200,000,000` 잘림 없음

## 관련 파일
- `package.json`, `package-lock.json` (`@react-pdf/renderer` 추가)
- `src/assets/fonts/` (`NotoSansKR-Regular.otf`, `NotoSansKR-Bold.otf`, `OFL.txt`)
- `src/lib/pdf/fonts.ts` (`registerPdfFonts`: `Font.register`, 하이픈 처리 콜백)
- `src/components/features/invoice/invoicePdfDocument.tsx` (`InvoicePdfDocument`)
- `src/app/invoice/[id]/pdf/route.ts` (T6에서 생성)
- `src/components/features/invoice/downloadPdfButton.tsx` (T7에서 연결)
- `src/lib/format.ts` (`formatCurrency`, `formatDate`, `formatNumber` 재사용)
- `src/lib/notion/invoice.ts` (`getInvoice`, 참조만)
- `next.config.ts` (T6에서 `outputFileTracingIncludes` 확인)

## 수락 기준
- `/invoice/<id>/pdf`가 `application/pdf` 200으로 응답하고 `Content-Disposition`이 `attachment; filename*=UTF-8''<인코딩된 견적서 번호>.pdf`
- PDF의 견적서 번호, 클라이언트명, 상태, 발행일, 유효기간, 항목별 수량/단가/금액, 소계, 총액이 웹 화면과 일치하고 한글이 깨지지 않음
- 항목이 많으면 여러 페이지로 나뉘고 표 머리글이 매 페이지 반복되며 행이 잘리지 않음. 항목 0개면 빈 상태 안내와 총액 0원
- 없는 ID, 형식 오류 ID, 다른 DB 페이지는 404이고 PDF가 생성되지 않음. 요청 본문이나 쿼리의 금액은 무시
- 다운로드 버튼은 생성 중 스피너와 비활성화, 실패 시 sonner 토스트, 다운로드 후 같은 페이지 유지와 재다운로드 가능
- `lint`, `tsc --noEmit`, `build` 통과, 아래 테스트 체크리스트 전 항목 통과

## 구현 단계
- [x] T5: PDF 방식 결정 기록, `@react-pdf/renderer` 설치, 한글 폰트 포함과 등록, `InvoicePdfDocument` 작성, 임시 스크립트 렌더링 확인
- [x] T6: Route Handler `src/app/invoice/[id]/pdf/route.ts` (ID 검증, `getInvoice` 재조회, 404, 응답 헤더, 한글 파일명 인코딩), 폰트 파일 추적(`outputFileTracingIncludes`) 확인, Route Handler 단독 확인
- [x] T7: `DownloadPdfButton` 연결(스피너, 비활성화, 토스트), 전체 체크리스트 수행과 결과 기록

## T6에서 확인할 사항
- `next.config.ts`의 `outputFileTracingIncludes`: Vercel 함수에 `src/assets/fonts/**`가 포함되어야 합니다. 키는 route glob(picomatch)이라 `/invoice/[id]/pdf`의 `[id]`가 문자 클래스로 해석될 수 있어 `\\[id\\]` 이스케이프가 필요한지 Route Handler가 생긴 뒤 `build` 결과의 추적 파일(`.next/server/app/invoice/[id]/pdf/route.js.nft.json`)로 확인합니다. Route Handler가 없는 지금은 검증할 수 없어 설정하지 않았습니다.
- `serverExternalPackages`는 Next.js 기본 목록에 `@react-pdf/renderer`가 포함되어 있어 추가하지 않았습니다. 실제 `build`와 Route Handler 동작으로 문제가 없는지 확인합니다.
- Route Handler 안의 `getInvoice`는 `"use cache"` 함수이므로 Cache Components 규칙(비결정 값 사용 위치)을 가이드로 확인합니다.
- React Compiler(`reactCompiler: true`)와 `@react-pdf/renderer`가 같은 빌드에서 충돌하지 않는지 확인합니다. T5의 렌더링 확인은 Next.js 빌드 밖의 임시 스크립트였습니다.
- 폰트 2개(약 9.5MB)가 함수 크기와 응답 시간에 주는 영향을 확인합니다.
- 이모지 처리: **사용자 결정(2026-11-20): PDF 텍스트에서만 제거**합니다. 웹 화면과 노션 원본은 그대로 둡니다. 구현은 `src/lib/pdf/text.ts`의 `stripEmoji`이고, `InvoicePdfDocument`가 견적서 번호, 상태, 클라이언트명, 항목명에 적용합니다.
- `<Document title>`에 들어가는 견적서 번호가 PDF 메타데이터에서 한글로 올바르게 보이는지 확인합니다.

## 테스트 체크리스트
(Playwright MCP로 수행. 다운로드한 PDF는 Read 도구의 PDF 읽기로 내용 확인. 별도 표기가 없으면 `npm run dev`)

### 정상 케이스
- 다운로드 버튼 클릭 → 다운로드 이벤트가 발생하고 파일명이 `<견적서번호>.pdf`
- `/invoice/<id>/pdf` 응답 → 상태 200, `Content-Type: application/pdf`, `Content-Disposition`이 `attachment`이고 `filename*=UTF-8''` 인코딩 포함
- 다운로드 후 같은 페이지 유지, 다시 클릭하면 두 번째 다운로드도 성공
- 데이터 정합성: 내려받은 PDF의 견적서 번호, 클라이언트명, 상태, 날짜, 항목별 금액, 소계, 총액이 웹 화면 값과 일치하고 한글이 깨지지 않음

### 에러/예외 케이스
- 존재하지 않는 ID와 형식이 잘못된 ID의 PDF 경로 요청 → 404, PDF가 생성되지 않음
- 다른 DB 페이지 ID의 PDF 경로 요청 → 404
- 휴지통 페이지 ID의 PDF 경로 요청 → 404
- 생성 실패(PDF 경로 응답을 500으로 변경하거나 잘못된 API 키로 서버 재시작) → sonner 토스트 표시, 버튼이 다시 활성화, 페이지 유지, 화면에 키나 노션 오류 원문이 노출되지 않음

### 경계값/엣지 케이스
- 중복 클릭: 생성 중 버튼이 비활성화되고 스피너 표시, 연속 클릭해도 네트워크 요청이 1회만 발생
- 한글/특수문자 파일명: 견적서 번호에 한글이나 공백이 있을 때(`[TEST] 정상` 등) 파일명이 깨지지 않음
- 긴 목록: 항목 25개와 30개 견적서 PDF가 여러 페이지로 나뉘고, 표 머리글이 매 페이지 반복되며, 항목 누락이나 행 잘림이 없음
- 항목 0개: PDF가 생성되고 "견적 항목이 없습니다" 안내와 총액 ₩0 표시
- 날짜/상태 비어 있음: 발행일, 유효기간이 "-"로 표시되고 상태 배지는 없음
- 긴 값과 특수문자: 긴 항목명과 클라이언트명이 줄바꿈되어 페이지 밖으로 넘치지 않고, `&` `<` `"`가 그대로 표시됨. 이모지 표시 결과를 기록
- 큰 금액: 10억 원 이상 금액이 잘리지 않음
- 보안: 쿼리 문자열이나 요청 본문으로 다른 금액을 보내도 PDF 내용은 노션 값 그대로

### 반응형
- 375px, 768px, 1280px 폭에서 다운로드 버튼이 보이고 다운로드가 동작

## 테스트 결과

### 2026-11-20 T6 Route Handler 단독 확인 (정식 체크리스트 수행은 T7)
구현: `src/app/invoice/[id]/pdf/route.ts`(GET), `src/lib/pdf/text.ts`(`stripEmoji`), `invoicePdfDocument.tsx`에 공유 링크(`getInvoiceUrl(invoice.id)`)와 이모지 제거 적용. 파일명 정규화(`toSafeName`, `buildContentDisposition`)는 route 파일 안의 비공개 함수입니다.

| 확인 | 결과 |
| --- | --- |
| `npm run lint`, `npx tsc --noEmit` | 통과. 단 `RouteContext<"/invoice/[id]/pdf">`는 타입이 `next typegen`(또는 dev/build)으로 생성된 뒤에야 `tsc`가 통과함 |
| `npm run build` | 통과. `/invoice/[id]/pdf`는 `ƒ (Dynamic)`로 표시. `export const dynamic/runtime`은 쓰지 않음 |
| 폰트 추적 | **`outputFileTracingIncludes` 설정 없이** `.next/server/app/invoice/[id]/pdf/route.js.nft.json`에 `NotoSansKR-Regular.otf`, `NotoSansKR-Bold.otf` 포함 → 설정을 추가하지 않음. 따라서 대괄호 이스케이프 여부(Next 문서 105행 vs 114행 불일치)는 결정할 필요가 없었음. 단 Vercel 함수에서의 실제 포함은 로컬로 증명 불가 → Task 010 프리뷰 배포에서 확인 |
| 정상 ① | 200, `application/pdf`, `Cache-Control: private, no-store`, `Content-Disposition: attachment; filename="[TEST].pdf"; filename*=UTF-8''%5BTEST%5D%20%EC%A0%95%EC%83%81.pdf`. ASCII 대체 이름에는 한글이 빠지고 `filename*`에는 한글 유지 |
| ID 형식 | 하이픈 포함 대문자 UUID도 같은 PDF(200) |
| 형식 오류 `abc`, 31자리 | 404(text/plain), 노션 호출 없음(응답 3~4ms) |
| 없는 ID, 휴지통(⑩) | 404. 노션 `object_not_found` 경고 로그는 서버 로그에만 있고 응답에는 없음 |
| 다른 DB 페이지 | 이 단계에서는 미수행(작업 파일에 해당 페이지 ID가 기록돼 있지 않음). `getInvoice`의 소속 검사는 Task 005에서 검증됨. **T7 체크리스트에서 수행** |
| 쿼리 무시 | `?amount=999&totalAmount=1`을 붙여도 PDF 값 그대로(소계, 총액 ₩2,490,000). 바이트는 달랐으나 마지막 부분(문서 메타데이터) 차이로 판단(값은 같음) |
| PDF 내용(①) | Read로 확인: 번호, 클라이언트명, 상태 `대기`, 발행일 2026년 11월 12일, 유효기간 2026년 12월 12일, 항목 3개 수량/단가/금액, 소계/총액 ₩2,490,000, 공유 링크 `http://localhost:3000/invoice/41d6a564a299816c8eb5ecb02e648af7`, 한글 정상 |
| PDF 내용(⑦ 특수문자) | 이모지 제거됨, `&` `<` `"` 그대로, 긴 클라이언트명과 항목명 줄바꿈(글자 단위, 줄 끝 하이픈), 총액 ₩2,400,000 |
| PDF 내용(⑤ 30개) | 2페이지, 표 머리글 반복, 항목 01~30 누락 없음, 총액 ₩4,650,000, 쪽 번호 1/2, 2/2 |
| `stripEmoji` 단위 확인 | `🚀`, `❤️`, ZWJ 가족, 피부색, 국기, 키캡이 제거되고 `© ® ™ ★ ✓ ₩ R&D`는 유지. 키캡 `1️⃣`은 숫자 `1`이 남음(수용) |
| 응답 시간(dev) | ① 1.6s → 0.04s, ⑤ 30개 3.4s → 0.08s, ④ 25개 4.0s → 0.06s (1회차는 노션 캐시 미스 포함) |
| 응답 시간(build+start) | ① 0.68s → 0.03s, ④ 25개 6.0s → 0.05s, ⑤ 30개 3.8s → 0.06s. 느린 1회차는 항목 3개씩 순차 조회 때문이며 PDF 렌더링 자체는 약 0.03~0.08s |
| 429/재시도 | dev와 start 로그 모두 `retrying request`, 429 0건 |
| reactCompiler 충돌 | 없음(build와 실제 요청 모두 정상) |
| Playwright MCP(운영 모드, 1280px) | 브라우저 컨텍스트 `fetch`로 정상/쿼리/형식 오류/없는 ID/휴지통 5건이 위 결과와 같음, `%PDF-` 헤더 확인. 콘솔 에러 3건은 의도한 404 요청의 리소스 로드 메시지뿐 |

발견한 환경 이슈: dev 서버(`npm run dev`)에서 Playwright MCP 브라우저를 열어 두면 `.playwright-mcp/`에 콘솔 로그가 계속 쓰이고 dev 파일 감시가 이를 감지해 페이지가 무한 새로고침됨(`Compiled in 0ms` 반복, 브라우저를 닫으면 멈춤). `.playwright-mcp`는 gitignore되어 저장소 영향은 없음. 이후 브라우저 확인은 `build` + `start`(운영 모드)로 수행.

### 2026-11-20 T7 버튼 연결과 전체 체크리스트 (Playwright MCP, `build` + `start` 운영 모드)
구현: `downloadPdfButton.tsx`(`invoiceId` prop, `fetch` → blob → `a[download]`, ref 가드 + state, `Spinner`, 실패 시 sonner 토스트, `Content-Disposition`의 `filename*` 해석), `invoiceView.tsx`가 `invoice.id` 전달. 검증은 `npm run lint`, `npx tsc --noEmit`, `npm run build` 통과 후 `npm run start`에서 수행. 다운로드한 PDF는 Read 도구로 열어 대조했습니다.

**정상 케이스**
| 시나리오 | 결과 |
| --- | --- |
| 버튼 클릭 → 다운로드 이벤트, 파일명 `<견적서번호>.pdf` | 통과. 7건 모두 `[TEST] 정상.pdf`, `[TEST] 항목30개.pdf`, `[TEST] 항목25개.pdf`, `[TEST] 항목0개.pdf`, `[TEST] 빈필드.pdf`, `[TEST] 특수문자.pdf`, `[TEST] 큰금액.pdf` |
| `/invoice/<id>/pdf` 응답 헤더 | 통과(T6 확인 + 브라우저 fetch): 200, `application/pdf`, `attachment; filename="..."; filename*=UTF-8''...` |
| 다운로드 후 같은 페이지 유지, 재다운로드 | 통과. 7건 모두 URL 유지, 버튼 재활성화, 두 번째 다운로드 성공 |
| 데이터 정합성(화면 ↔ PDF ↔ 노션) | 통과. ① 총액 ₩2,490,000, ④ ₩3,250,000, ⑧ ₩1,200,000,000, ⑥ ₩300,000, ③ ₩0이 화면, PDF, tasks/005의 노션 합계와 일치. 번호, 클라이언트명, 상태 배지, 날짜, 항목별 수량/단가/금액, 소계, 공유 링크, 한글 정상 |

**에러/예외 케이스**
| 시나리오 | 결과 |
| --- | --- |
| 형식 오류(`abc`, 31자리), 없는 ID | 404, PDF 없음(T6, 브라우저 fetch 재확인) |
| 휴지통(⑩) | 404 |
| 다른 DB(Items DB 항목 페이지 ID) | 404 (`curl`, 이 단계에서 처음 확인) |
| 생성 실패(응답 500 가로채기) | 통과. 토스트 `PDF를 만들지 못했습니다. 잠시 후 다시 시도해 주세요.`, 버튼 재활성화, 페이지 유지, 응답 본문(`NOTION_SECRET`)이 화면에 노출되지 않음 |
| 네트워크 오류(abort) | 통과. 토스트 1개, 버튼 재활성화 |
| 잘못된 API 키로 서버 재시작(별도 포트 3100, `.env*` 미수정) | PDF 경로 HTTP 500, 응답 본문 비어 있음(원문 미노출). 서버 로그에는 `API token is invalid.`만 있고 키 문자열은 0건 |

**경계값/엣지 케이스**
| 시나리오 | 결과 |
| --- | --- |
| 중복 클릭 | 통과. 응답을 1.5초 지연시키고 같은 틱에 `click()` 3회 → 네트워크 요청 1회, 생성 중 버튼 `PDF 생성 중` + disabled + 스피너, 완료 후 재활성화 |
| 한글/공백 파일명 | 통과. 위 파일명 7건이 깨지지 않음 |
| 긴 목록(25개, 30개) | 통과. 둘 다 2페이지, 머리글 반복, 항목 01~25 / 01~30 누락 없음, 행 잘림 없음, 쪽 번호 |
| 항목 0개 | 통과. `견적 항목이 없습니다` 안내, 소계/총액 ₩0 |
| 날짜/상태 비어 있음(⑥) | 통과. 발행일/유효기간 `-`. 상태는 노션 기본값 때문에 `대기`가 표시됨(tasks/005와 같은 이유로 빈 상태 실데이터는 만들 수 없음) |
| 긴 값과 특수문자, 이모지(⑦) | 통과(T6 확인). 이모지 제거, `&` `<` `"` 정상, 긴 값 줄바꿈 |
| 큰 금액(⑧) | 통과. ₩1,200,000,000 잘림 없음 |
| 보안(쿼리로 금액 전달) | 통과(T6 확인). 값은 노션 그대로 |
| 키보드만 | 통과. Tab으로 버튼에 포커스 → Enter로 다운로드 |

**반응형**
| 폭 | 결과 |
| --- | --- |
| 375px, 768px, 1280px | 버튼 표시, 가로 스크롤 없음(`scrollWidth` ≤ 폭), 다운로드 성공 |

콘솔: 에러 5건은 모두 테스트가 의도적으로 만든 요청(404 3건, 가로챈 500, abort)의 리소스 로드 메시지이고 앱 자체의 에러와 하이드레이션 경고는 없음.

**한계**: 실제 iOS/안드로이드 기기에서의 다운로드(`a[download]` + blob)는 Playwright로 검증할 수 없어 뷰포트 에뮬레이션까지만 확인했습니다. 노션 원본과의 대조는 tasks/005에 기록된 노션 합계와 화면 값을 기준으로 했습니다. Vercel 함수에서 폰트가 실제로 포함되는지는 Task 010 프리뷰 배포에서 확인합니다.

