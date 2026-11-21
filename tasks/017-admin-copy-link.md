# Task 017: 견적서 목록에서 클라이언트 링크 복사

## 개요
관리자 목록(`/admin`)의 행마다 클라이언트에게 보낼 공유 링크를 복사하는 버튼을 둡니다. 기존 `CopyLinkButton`을 견적서 페이지와 관리자 목록이 함께 쓰므로 `common` 레이어로 옮기고, 크기, 접근성 이름, 실패 문구를 선택 props로 받게 합니다(기본값은 현재 동작과 동일). 링크는 서버(목록 페이지)에서 `getInvoiceUrl(item.id)`로 만들어 props로 전달합니다. 새 의존성은 없습니다.

## 관련 파일
- `src/components/features/invoice/copyLinkButton.tsx` → `src/components/common/copyLinkButton.tsx` (`git mv`, 선택 props `size`, `ariaLabel`, `errorMessage` 추가)
- `src/components/features/invoice/invoiceView.tsx`: import 경로만 수정
- `src/components/features/admin/invoiceList.tsx`: 표와 카드의 작업 영역에 버튼 배치
- `src/app/admin/(dashboard)/page.tsx`: 행마다 서버에서 `getInvoiceUrl(item.id)` 계산
- `src/types/invoice.ts`: 목록 항목에 링크를 붙이는 타입이 필요하면 추가
- 문서: `CLAUDE.md`, `README.md`, `shrimp-rules.md`, `docs/ROADMAP.md`(현재 구현 상태 표)

## 수락 기준
- [x] `CopyLinkButton`이 `components/common`에 있고 `ui`만 import, `invoiceView` import 경로만 바뀜
- [x] 선택 props(`size`, 접근성 이름, 실패 문구) 추가, 기본값은 현재 동작과 동일
- [x] 링크는 서버에서 `getInvoiceUrl`로 만든 값만 props로 전달(클라이언트에서 `siteConfig.url` 미사용)
- [x] 행별 복사 값 = `<사이트 URL>/invoice/<32자리 소문자 ID>` = 해당 견적서 페이지의 canonical
- [x] 토스트와 "복사됨" 상태는 클릭한 행에만 나타남(행마다 독립 인스턴스)
- [x] 표(768px 이상)와 카드(768px 미만) 모두 "견적서 열기"와 함께 버튼 배치, 375px 카드에서 잘리지 않음
- [x] 목록 버튼 접근성 이름이 "링크 복사: <견적서 번호>"(보이는 글자 포함), 행마다 다름
- [x] 목록 실패 문구: "링크를 복사하지 못했습니다. 견적서를 열어 주소창에서 복사해 주세요."
- [x] 견적서 페이지의 버튼 모양, 문구, 동작 회귀 없음
- [x] 새 의존성 없음, `components/ui/*` 미수정, 레이어 import 방향 유지, 노션 쓰기 없음
- [x] 문서 갱신, `npm run check-all`, `npm run build` 통과, 임시 코드 삭제

## 구현 단계
- [x] 1. 컴포넌트 이동과 선택 props 추가, `invoiceView` import 수정
- [x] 2. 목록 표/카드에 버튼 배치, 서버에서 링크 계산
- [x] 3. `npm run check-all`, `npm run build`
- [x] 4. Playwright MCP로 테스트 체크리스트 수행(견적서 페이지 회귀 포함), 결과 기록
- [x] 5. 문서 갱신(`CLAUDE.md`, `README.md`, `shrimp-rules.md`, `docs/ROADMAP.md`)

## 테스트 체크리스트
노션 쓰기는 하지 않습니다. 운영 동작은 `npm run build` 후 `next start -p 3100`에서 확인합니다. 클립보드를 읽기 전에 `clipboard-read`, `clipboard-write` 권한을 부여합니다.

### 정상 케이스
- [x] 세 행에서 각각 복사 → 실제 클립보드 값이 그 행의 링크와 일치
- [x] 성공 토스트 표시, 클릭한 행 버튼이 "복사됨"
- [x] 2초 뒤 "링크 복사"로 복원
- [x] 복사한 링크를 로그인하지 않은 새 브라우저 컨텍스트에서 열면 같은 견적서

### 에러/예외 케이스
- [x] `writeText` 거부 → `execCommand` 폴백으로 복사
- [x] 둘 다 실패 → 목록용 에러 토스트, 화면 유지

### 경계값/엣지 케이스
- [x] 두 행을 연달아 클릭해도 상태가 행마다 따로
- [x] 같은 행 연속 클릭 시 타이머가 겹치지 않음
- [x] `NEXT_PUBLIC_SITE_URL=https://example.test`로 시작 → 복사 값에 도메인 반영
- [x] 접근성 트리에서 행마다 버튼 이름이 다름 (`aria-label`을 10행 전체 수집해 확인)

### 회귀
- [x] 견적서 페이지 링크 복사(Task 011 핵심 시나리오: 값, 토스트, 2초 복원, 기본 실패 문구)
- [x] 견적서 페이지에서 PDF 버튼과 같은 줄
- [x] 견적서 페이지 인쇄 시 숨김

### 반응형/테마
- [x] 375px 카드 안에서 버튼이 잘리지 않음, 가로 넘침 없음
- [x] 768/1280px 표의 작업 열
- [x] 라이트/다크에서 버튼과 토스트가 보임

### 정리
- [x] 임시 코드 원복 확인, 띄운 서버 종료

## 테스트 결과
### 변경 사항 요약
- 이동: `src/components/features/invoice/copyLinkButton.tsx` → `src/components/common/copyLinkButton.tsx`(`git mv`). 선택 props `size`, `subject`(접근성 이름 "링크 복사: <대상>", 복사 직후는 "복사됨: <대상>"으로 보이는 글자와 일치), `errorMessage` 추가. 기본값은 기존 동작과 같음
- 수정: `invoiceView.tsx`(import 경로만), `invoiceList.tsx`(행 작업 영역 `RowActions`, 표/카드 공용), `admin/(dashboard)/page.tsx`(행마다 서버에서 `getInvoiceUrl(item.id)` 계산해 `shareUrl`로 전달)
- 문서: `CLAUDE.md`, `README.md`, `shrimp-rules.md`, `docs/ROADMAP.md`

### 구현 중 발견해 고친 문제 (계획과 다른 점)
- 768px 표에서 작업 열이 가로 스크롤 안으로 잘림: 버튼이 하나 늘면서가 아니라 표 전체 폭(761px)이 컨테이너(720px)를 넘어 맨 오른쪽 열이 가려졌음(`scrollWidth`, 버튼 right와 표 wrapper right 비교로 발견. 문서 가로 넘침 검사로는 안 잡힘). 해결: 768~1023px에서 두 버튼을 세로로 쌓고(`md:flex-col`, 1024px 이상은 가로), 번호 칸 최소 폭을 `min-w-32` → `min-w-20`, 표 셀 가로 패딩을 768~1023px에서 `px-1.5`로 줄임. 수정 후 768/1024/1280px 모두 표 스크롤 없음, 버튼 잘림 0

### 2026-11-21 검증 (`npm run build` 후 `next start -p 3200`)
`npm run check-all`, `npm run build` 통과. 관리자 비밀번호와 비밀키는 명령줄 환경변수로만 전달함. 노션 쓰기 없음.

정상
- 세 행(1~3번째) 복사 시 클립보드(`readText`, 권한 부여 후) 값이 각 행 링크(`http://localhost:3000/invoice/<32자리 소문자>`, `NEXT_PUBLIC_SITE_URL` 미설정 기본값)와 일치. 해당 행만 "복사됨", 성공 토스트, 2.3초 뒤 "링크 복사"
- 복사한 링크를 새 브라우저 컨텍스트(비로그인)에서 열면 같은 견적서(제목 일치), canonical은 복사 값과 같은 경로

에러
- `writeText` 거부 → `execCommand("copy")` 1회, 복사된 textarea 값이 해당 행 링크, 성공 처리
- 둘 다 실패 → 토스트 "링크를 복사하지 못했습니다. 견적서를 열어 주소창에서 복사해 주세요.", 버튼 "링크 복사" 유지, 임시 textarea 남지 않음

엣지
- 1행 클릭 1.2초 뒤 2행 클릭: 상태가 따로("링크 복사"/"복사됨" 시점이 각자 클릭 기준 2초)
- 같은 행 1.5초 간격 2회 클릭: 첫 클릭 2.5초 시점에 아직 "복사됨", 두 번째 클릭 2.3초 뒤 "링크 복사"(타이머 갱신, 겹치지 않음)
- `NEXT_PUBLIC_SITE_URL=https://example.test`로 빌드 후 시작: 복사 값 `https://example.test/invoice/<id>` = 해당 견적서 canonical (이 값은 빌드 때 들어가므로 빌드부터 환경변수를 줌. 확인 후 환경변수 없이 다시 빌드함)
- 접근성 이름: "링크 복사: INV-2026-002", "링크 복사: [TEST] 큰금액" 등 10행 모두 서로 다름

회귀(견적서 페이지, 운영 빌드)
- 버튼 높이 32px(기본 크기), `aria-label` 없음(기본 이름 "링크 복사"), 복사 값, 토스트 "링크를 복사했습니다", "복사됨" → 2.3초 뒤 복원, 실패 토스트는 기존 문구 "주소창의 링크를 직접 복사해 주세요."
- PDF 버튼과 같은 줄(1280px, 375px 모두 top 일치), print 미디어에서 두 버튼 `display: none`

반응형/테마
- 375px 카드(버튼 잘림 0), 768/1024/1280px 표(작업 열 잘림 0, 표 가로 스크롤 0), 라이트/다크 8조합 모두 문서 가로 넘침 0. 768 다크, 375 라이트는 스크린샷으로 확인. 버튼과 토스트가 라이트/다크 모두 보임(첫 행 클릭 후 토스트 표시 확인)
- 콘솔 에러 0

정리
- 임시 코드 없음(`grep`으로 확인), 테스트용 서버(3200)는 종료함

### 미확인
- 없음

### Task 018 보완 (2026-11-21)
- 운영 빌드에서 375/768/1280px × 라이트/다크 6조합 모두 복사 값 = 상세 canonical, 비로그인 컨텍스트에서 열기 200, PDF 200을 확인함
- 주의: `NEXT_PUBLIC_SITE_URL`은 빌드 시점에 반영되므로 위 "시작" 시나리오는 값을 넣고 **다시 빌드**해야 복사 값에 반영됨(`next start`에 값만 넘기면 폴백 `http://localhost:3000`)
