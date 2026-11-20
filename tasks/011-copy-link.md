# Task 011: 견적서 링크 복사 버튼

## 개요
견적서 페이지에 공유 링크를 한 번에 복사하는 `CopyLinkButton`을 추가합니다. 링크는 서버에서 기존 `getInvoiceUrl`로 만들어 props로 넘기고(클라이언트는 Vercel 배포 URL을 읽을 수 없음), 알림은 기존 sonner를 씁니다. 새 토스트 컴포넌트는 만들지 않습니다. 버튼에 "링크 복사" 글자가 보이므로 별도 Tooltip은 두지 않습니다.

## 관련 파일
- `src/components/features/invoice/copyLinkButton.tsx` (신규)
- `src/components/features/invoice/invoiceView.tsx` (선택 prop `shareUrl`, 버튼 배치)
- `src/app/invoice/[id]/page.tsx` (`getInvoiceUrl`로 링크 생성)
- `src/lib/invoice-url.ts`, `src/components/ui/sonner.tsx` (재사용, 수정 없음)

## 수락 기준
- [x] 버튼 클릭 시 `<사이트 URL>/invoice/<32자리 소문자 ID>`가 클립보드에 복사됨 (`writeText` 가로채기와 실제 시스템 클립보드 읽기 모두 확인)
- [x] 성공 시 "링크를 복사했습니다" 토스트, 버튼이 2초간 "복사됨"으로 바뀜
- [x] 클립보드를 쓸 수 없으면 폴백(execCommand)을 시도하고, 그것도 실패하면 에러 토스트
- [x] PDF 다운로드 버튼과 같은 줄에 놓임 (375px에서도 한 줄에 들어가 줄바꿈은 관찰되지 않음, `flex-wrap`은 적용)
- [x] 인쇄(print)에서는 숨겨짐 (print 미디어 emulate에서 토글, 링크 복사, PDF 버튼이 모두 `display: none`)

## 구현 단계
- [x] 1. `copyLinkButton.tsx` 구현
- [x] 2. `InvoiceView`에 `shareUrl` prop과 버튼 배치
- [x] 3. 페이지에서 `getInvoiceUrl(invoice.id)` 전달
- [x] 4. `lint`, `tsc --noEmit` 통과
- [x] 5. Playwright MCP로 테스트 체크리스트 수행

## 테스트 체크리스트
### 정상 케이스
- [x] 견적서 접속 → "링크 복사" 클릭 → 클립보드 값이 `http://localhost:3000/invoice/<id>`와 일치, 성공 토스트 표시
- [x] 2초 뒤 버튼 글자가 "링크 복사"로 돌아옴
- [x] 복사한 링크로 접속하면 같은 견적서가 열림 (복사된 값과 같은 URL로 접속해 견적서 표시)

### 에러/예외 케이스
- [x] `navigator.clipboard.writeText`가 거부되는 상태 → 폴백으로 복사되거나 에러 토스트 표시
- [x] 클립보드와 폴백이 모두 실패 → 에러 토스트, 화면이 깨지지 않음
- [x] 없는 견적서 ID(404)에는 버튼이 없음

### 경계값/엣지 케이스
- [x] 연속 클릭해도 타이머가 겹치지 않고 마지막 클릭 기준 2초 뒤 복원
- [x] `NEXT_PUBLIC_SITE_URL`을 다른 도메인으로 설정하면 해당 도메인으로 복사됨 (`https://example.test`로 dev 서버 시작 → 복사 값과 canonical 모두 `https://example.test/invoice/<id>`)
- [x] 다크 모드에서 버튼이 보임

### 반응형
- [x] 375px, 768px, 1280px에서 두 버튼이 잘리지 않음(375px는 줄바꿈 허용)

## 테스트 결과

### 변경 사항 요약
- `src/components/features/invoice/copyLinkButton.tsx` 신규: `navigator.clipboard.writeText` → 실패 시 임시 textarea + `execCommand("copy")` 폴백 → 모두 실패하면 에러 토스트. 성공 시 sonner 토스트와 2초간 "복사됨" 표시(연속 클릭 시 타이머 갱신, 언마운트 시 정리)
- `invoiceView.tsx`: 선택 prop `shareUrl` 추가, 있을 때만 버튼 렌더. 버튼 줄은 `flex-wrap gap-2`
- `invoice/[id]/page.tsx`: `getInvoiceUrl(invoice.id)`로 서버에서 링크 생성해 전달
- Tooltip은 버튼에 "링크 복사" 글자가 보이므로 만들지 않음(계획에서 변경)

### 2026-11-20 Playwright MCP 검증 (dev 서버, `[TEST] 정상`)
- `lint`, `tsc --noEmit` 통과
- 클릭 → `writeText`에 `http://localhost:3000/invoice/41d6a564a299816c8eb5ecb02e648af7` 전달, 토스트 "링크를 복사했습니다", 버튼 "복사됨" → 2초 뒤 "링크 복사"
- `writeText` 거부 → `execCommand` 폴백 1회 호출, 성공 처리, 임시 textarea 남지 않음
- 폴백도 `false` → 에러 토스트 "링크를 복사하지 못했습니다. 주소창의 링크를 직접 복사해 주세요.", 버튼 상태 유지
- 1.5초 간격 연속 클릭 2회 → 복사 2회 호출, 두 번째 클릭 1초 뒤 "복사됨", 2.3초 뒤 "링크 복사"
- 하이픈 포함 대문자 ID(`/invoice/41D6A564-...`)로 접속해도 복사 값은 하이픈 없는 소문자 링크
- 휴지통 견적서(404 화면)에는 버튼 없음(견적서 본문과 함께 렌더되지 않음)
- 375/768/1280px: 두 버튼이 한 줄에 들어가고(375px 기준 오른쪽 끝 359px) 가로 스크롤 없음, 다크 모드에서 윤곽선 버튼이 보임

### Task 012에서 추가 확인 (2026-11-20)
- 처음에는 권한 없이 `clipboard.readText`를 호출해 120초 멈춤. `context.grantPermissions(['clipboard-read','clipboard-write'])` 후 클릭 → `readText()`가 `http://localhost:3000/invoice/41d6a564a299816c8eb5ecb02e648af7`을 돌려줌
- `NEXT_PUBLIC_SITE_URL=https://example.test`로 dev 서버를 시작하면 복사 값과 canonical이 `https://example.test/invoice/<id>`
- print 미디어 emulate에서 버튼 3개 모두 `display: none`
