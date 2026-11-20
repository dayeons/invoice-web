# Task 010: 다크모드 토글과 다크 스타일 점검

## 개요
`next-themes` ThemeProvider(`attribute="class"`, `defaultTheme="system"`)와 `globals.css`의 `.dark` 토큰은 이미 있습니다. 이 작업은 테마를 바꾸는 버튼(`ThemeToggle`)을 견적서 페이지 상단 우측에 추가하고, 다크에서 견적서 화면이 읽기 좋은지 확인합니다. 별도 헤더는 만들지 않으며 PDF는 항상 라이트로 유지합니다.

## 관련 파일
- `src/components/common/themeToggle.tsx` (신규)
- `src/app/invoice/[id]/page.tsx` (토글 배치)
- `src/components/providers/appProviders.tsx`, `themeProvider.tsx` (참조, 수정 없음)
- `src/app/globals.css` (`.dark` 토큰, 필요할 때만 수정)

## 수락 기준
- [x] 버튼 클릭 시 라이트 → 다크 → 시스템 순서로 순환하고 `<html>`의 `dark` 클래스가 맞게 바뀜
- [x] 새로고침 후에도 선택한 테마가 유지됨
- [x] 시스템 설정이 다크일 때 시스템 모드에서 자동 적용됨
- [x] 하이드레이션 오류가 콘솔에 없음
- [x] 다크에서 본문 텍스트, 표 경계, 상태 배지가 구분됨
- [x] PDF 출력/다운로드는 변하지 않음

## 구현 단계
- [x] 1. Next.js 문서와 next-themes 사용법 확인, 하드코딩 색상 점검
- [x] 2. `themeToggle.tsx` 구현 (마운트 전 빈 버튼, 한국어 aria-label)
- [x] 3. 견적서 페이지 상단 우측에 배치
- [x] 4. `lint`, `tsc --noEmit` 통과
- [x] 5. Playwright MCP로 테스트 체크리스트 수행

## 테스트 체크리스트
### 정상 케이스
- [x] 견적서 접속 → 토글 클릭 3번 → html 클래스가 dark 추가 → 시스템(emulate 다크면 dark 적용) → light 순으로 바뀜
- [x] 다크 선택 후 새로고침 → 깜빡임 없이 dark 유지
- [x] 시스템 모드에서 prefers-color-scheme을 dark로 emulate → dark 적용

### 에러/예외 케이스
- [x] localStorage 값을 잘못된 문자열로 설정 후 새로고침 → 시스템 모드로 동작하고 오류 없음
- [x] 없는 견적서 ID(404 화면)에서는 토글이 없어도 다크 설정은 유지됨 (휴지통 ID 404 화면에서 dark 클래스, 배경 L≈2.8, 글자 L≈98 확인)

### 경계값/엣지 케이스
- [x] 항목 0개, 30개, 특수문자/긴 이름, 큰 금액 견적서에서 다크 표 경계와 합계가 보이고 가로 넘침 없음 (30개와 큰 금액은 운영 빌드에서 값 기준으로 확인)
- [x] 상태 배지(대기/승인/거절) 3종이 다크에서 구분됨 (테스트 데이터에는 대기만 있어, 실제 배지 클래스를 복제해 variant별 계산 색상으로 확인. 화면 캡처는 대기만)
- [x] PDF 다운로드 버튼 동작이 다크에서도 정상

### 반응형
- [x] 375px, 768px, 1280px에서 토글이 우측 상단에 잘리지 않고 표시됨

## 테스트 결과

### 변경 사항 요약
- `src/components/common/themeToggle.tsx` 신규: 라이트 → 다크 → 시스템 순환, 마운트 전 빈 버튼(하이드레이션 불일치 방지), 한국어 aria-label, 저장소의 알 수 없는 테마 값을 `system`으로 정리
- `src/app/invoice/[id]/page.tsx`: 상단 우측에 토글 배치(스켈레톤 중에도 표시, `print:hidden`)
- `globals.css`의 `.dark` 토큰과 컴포넌트 색상은 이미 토큰 기반이라 수정하지 않음(하드코딩 색상 없음 확인). PDF 코드도 수정하지 않음

### 2026-11-20 Playwright MCP 검증 (dev 서버, `[TEST]` 행)
- `lint`, `tsc --noEmit` 통과
- 토글 3회 클릭: 시스템 → 라이트 → 다크 → 시스템 순으로 `html` 클래스와 localStorage 값이 바뀜
- 다크 선택 후 새로고침: dark 유지. 시스템 모드 + prefers-color-scheme dark emulate: dark 적용
- 저장값을 `garbage`로 설정: 처음에는 `html`에 `garbage` 클래스가 붙고 라이트로 보이는데 버튼은 "시스템"이라고 표시하는 불일치 발견 → 토글에서 `system`으로 정리하도록 수정 후 재검증, dark(OS 다크) 적용됨
- 콘솔: 하이드레이션 오류와 경고 없음. 에러 1건은 테스트로 호출한 `/invoice/abc`의 예상된 404
- 다크 화면: 정상 견적서, 항목 0개(빈 상태), 특수문자/긴 이름 견적서에서 본문, 표 경계, 배지, 버튼이 구분되고 가로 넘침 없음
- 반응형: 375/768/1280px에서 토글이 컨테이너 우측 끝에 표시되고 가로 스크롤 없음
- PDF: `/invoice/<id>/pdf` 200, `application/pdf`, `%PDF-` 시작. 존재하지 않는 형식 `/invoice/abc`는 404

### Task 012에서 추가 확인 (2026-11-20, 운영 빌드/dev)
- 휴지통 견적서 404 화면에서 저장된 다크 설정이 그대로 적용됨(토글은 404 화면에 없음)
- 배지 variant별 계산 색상(다크, 페이지 배경 L≈2.8): 대기(secondary) 배경 L≈15/글자 L≈98, 승인(default) 배경 L≈91/글자 L≈8, 거절(destructive) 글자 L≈64/배경 빨강 20% 투명. 승인/거절 값이 든 실제 견적서는 노션 데이터가 없어 보지 못함
