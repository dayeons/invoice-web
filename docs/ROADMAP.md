# 노션 견적서 뷰어 고도화 로드맵

노션 기반 견적서 뷰어(MVP) 위에 다크모드와 링크 복사를 더하는 간결한 로드맵입니다. 12개였던 Task를 핵심 3개(010~012)로 줄였고, 관리자 기능은 보류했습니다.

## 개요

- **다크모드**: 견적서 페이지에서 라이트/다크/시스템 테마를 전환 (`next-themes`와 `ThemeProvider`는 MVP에서 이미 적용되어 있어 토글과 점검만 추가)
- **링크 복사**: 견적서 페이지에서 공유 링크를 한 번에 복사 (기존 `getInvoiceUrl`과 sonner 재사용)
- **보류**: 관리자 대시보드(인증, 견적서 목록, 검색/필터), 링크 공유/통계, 성능/보안 강화, 문서화

> 이전 v3.1 문서는 Task 013~024 12개와 "Phase 5 완료 (3/12)"라고 적혀 있었으나 실제로는 관리자 코드와 완료 기록이 없었습니다. 이 문서는 실제 코드와 작업 파일 기록을 기준으로 다시 썼습니다. MVP 잔여 작업(Task 007~010)과 번호가 겹치지 않도록 새 Task는 010부터 이어 붙였습니다.

## 개발 워크플로우

1. **작업 계획**: 기존 코드베이스를 확인하고 `docs/ROADMAP.md`에 새 Task를 반영. 우선순위 작업은 마지막 완료 Task 다음에 둠
2. **작업 생성**: `/tasks/XXX-description.md` 작성 (`tasks/000-sample.md` 형식). 고수준 명세, 관련 파일, 수락 기준, 구현 단계, 테스트 체크리스트(정상/에러/엣지/반응형), 빈 "테스트 결과" 섹션을 포함
3. **작업 구현**: 작업 파일을 따름. Next.js 코드는 작성 전에 `node_modules/next/dist/docs/`를 확인. 단계마다 `npm run lint`, `npx tsc --noEmit`, 완료 시 `npm run build`를 통과시키고 Playwright MCP로 E2E를 수행해 결과를 작업 파일에 기록. 각 Task 완료 후 다음 지시를 기다림
4. **로드맵 업데이트**: 테스트 체크리스트 전 항목 통과가 작업 파일에 기록된 Task만 ✅ 표시하고 `See: /tasks/XXX-xxx.md`를 추가

## 현재 구현 상태 (코드 확인 결과, 2026-11-20)

| 영역 | 상태 | 위치 |
| --- | --- | --- |
| 견적서 조회(F002), 노션 연동(F001), 404(F011), 반응형(F012) | 완료 (Task 003, 004, 005 ✅) | `src/app/invoice/[id]/`, `src/lib/notion/`, `src/components/features/invoice/` |
| PDF 다운로드(F003) | 완료 (Task 006) | `src/app/invoice/[id]/pdf/route.ts`, `src/lib/pdf/` |
| 공유 URL(F010) | 완료 (Task 007): `getInvoiceUrl`, canonical, README 작성자 절차와 노션 Formula 가이드 | `src/lib/invoice-url.ts`, `src/config/site.ts` |
| 다크모드 토글 | 완료 (Task 010) | `src/components/common/themeToggle.tsx` |
| 링크 복사 | 완료 (Task 011) | `src/components/features/invoice/copyLinkButton.tsx` |
| 관리자 화면 | 없음 (보류) | - |

## 개발 단계

### Phase 5: 다크모드와 링크 복사 ✅

- **Task 010: 다크모드 토글과 다크 스타일 점검** ✅ - 완료 (See: /tasks/010-dark-mode.md)
  - ✅ `ThemeToggle`(라이트 → 다크 → 시스템 순환, 마운트 전 빈 버튼, 알 수 없는 저장값은 `system`으로 정리)
  - ✅ 견적서 페이지 상단 우측에 배치, 인쇄 시 숨김
  - ✅ `.dark` 토큰과 컴포넌트 색상 점검(하드코딩 색상 없음, 수정 불필요), PDF는 변경 없음

- **Task 011: 견적서 링크 복사 버튼** ✅ - 완료 (See: /tasks/011-copy-link.md)
  - ✅ `CopyLinkButton`(`clipboard.writeText` → `execCommand` 폴백 → 에러 토스트), 성공 시 sonner 토스트와 2초간 "복사됨"
  - ✅ 서버에서 `getInvoiceUrl`로 만든 링크를 `shareUrl` prop으로 전달 (`NEXT_PUBLIC_SITE_URL` 반영 확인)
  - ✅ PDF 다운로드 버튼과 같은 줄에 배치

- **Task 012: 통합 테스트와 ROADMAP 정리** ✅ - 완료 (See: /tasks/012-integration-test.md)
  - ✅ 운영 빌드에서 375/768/1280px × 라이트/다크 여정, 새로고침 유지, 실제 PDF 다운로드와 클립보드 검증
  - ✅ `lint`, `tsc --noEmit`, `build` 통과
  - 확인 범위 밖: Chromium만 사용(Safari/Firefox 미확인), 승인/거절 상태 실제 견적서(노션 테스트 데이터 없음)

## 완료된 MVP 작업 (이전 로드맵)

- **Task 003: 견적서 표시 컴포넌트와 더미 데이터** ✅ - 완료 (See: /tasks/003-invoice-components.md)
- **Task 005: 노션 연동 계층 실데이터 검증과 페이지 연결 (F001, F011)** ✅ - 완료 (See: /tasks/005-notion-integration.md)
- **Task 006: PDF 생성과 다운로드 (F003)** ✅ - 완료 (See: /tasks/006-invoice-pdf.md). 한계: 실제 iOS/안드로이드 기기 다운로드는 뷰포트 에뮬레이션까지만 확인, Vercel 함수의 폰트 포함은 배포 검증에서 확인
- **Task 004: 견적서 조회 페이지 UI와 반응형 (F002, F012)** ✅ - 완료 (See: /tasks/004-invoice-page-ui.md). 작업 파일에 "테스트 체크리스트" 섹션이 없어 사용자 결정(2026-11-20)에 따라 "테스트 결과" 기록으로 갈음합니다. 실패 2건은 모두 해소되어 "체크리스트 전 항목 통과"로 끝나며(`retry` 복구 확인, `/invoice/abc` HTTP 404는 Proxy로 해소), `lint`, `tsc --noEmit`, `build` 통과 기록이 있습니다.

## 남은 MVP 작업 (이 로드맵 범위 밖)

- 이전 MVP 로드맵은 `git show HEAD:docs/ROADMAP.md`에서 볼 수 있습니다.
- **Task 007: 견적서 공유 URL 생성 체계** ✅ - 완료 (See: /tasks/007-share-url.md). 사용자 결정(2026-11-20)으로 미확인 3건(노션 Formula 링크 열기, 프리뷰/운영 Vercel URL 규칙, 문서 상태 갱신)은 확인을 생략했습니다. 배포 URL에서 canonical 일치는 확인했습니다
- **Task 008: 핵심 기능 통합 테스트** ✅ - 완료 (See: /tasks/008-integration-test.md)
- **Task 013: Vercel 배포와 운영 준비** ✅ - 완료 (See: /tasks/013-deploy.md, 이전 MVP 로드맵의 Task 010)
  - ✅ 서버 에러 로깅 정리(노션 오류 코드와 요청 ID만 기록, 잘못된 키 시나리오로 확인), README 운영 문서, `npm run check-all` 추가
  - ✅ 결정: CI와 테스트 러너는 도입하지 않음
  - ✅ 배포 URL(`invoice-web-two-coral.vercel.app`) 1차 확인: 조회·PDF·404·noindex·한글 폰트 임베드·375/768px 가로 스크롤 없음·콘솔 에러 0
  - 확인 생략(사용자 결정, 2026-11-20): 프리뷰/운영 구분, 운영 도메인 재검증, 노션 Formula 링크, PDF 육안 확인, 배포 환경 오류 시나리오. 작업 파일 체크박스는 `[ ]`로 남아 있음
- **Task 009: 캐시 전략, 성능, 접근성 개선** ✅ - 완료 (See: /tasks/009-cache-perf-a11y.md)
  - ✅ 캐시 수명 유지와 PDF 캐싱 미도입 결정, 재검증 엔드포인트 `POST /api/revalidate` 도입(Bearer 토큰, 토큰이 없으면 503)
  - ✅ 접근성 Lighthouse 100점(`definition-list` 수정), 성능은 캐시 적중 시 100점. 첫 요청(캐시 없음, 항목 30개)은 86~87점으로 사용자 결정에 따라 예외 허용
  - ✅ 폰트 서브셋은 이득이 작아 보류(첫 PDF 약 0.16s), Vercel 함수 포함 여부는 배포 검증에서 확인
- **번호 주의**: 이전 MVP 로드맵의 Task 010은 "Vercel 배포"였습니다. `tasks/010`은 다크모드 작업이 쓰므로 배포 작업은 Task 013(`tasks/013-deploy.md`)입니다.

## 보류 항목 (원안 v3.1)

| 원안 Task | 내용 | 보류 사유 |
| --- | --- | --- |
| 013~015 | 관리자 레이아웃/인증, 견적서 목록, 검색/필터 | MVP 범위 밖(CLAUDE.md). 인증, 노션 목록 조회 API, Proxy 연동이 모두 필요해 가장 큼. 필요해지면 "인증 + 목록 + 링크 컬럼" 1개 Task로 줄여 새 Phase로 시작 |
| 016~017 | 고유 링크 생성과 복사 | `getInvoiceUrl` 재사용으로 Task 011에 통합 (목록의 링크 컬럼은 관리자 기능과 함께 보류) |
| 018 | 링크 공유(메신저, 메일), 조회수 통계 | 요구가 생길 때 재평가 |
| 019~021 | 다크모드 시스템, 스타일, 토글 | 시스템은 이미 있어 Task 010으로 통합 |
| 022 | 통합 테스트 | Task 012로 대체 (크로스 브라우저는 제외) |
| 023~024 | 성능/보안, 문서화/배포 | 기존 MVP의 캐시/성능(Task 009)과 배포 작업에 흡수 |

## 위험 요소

- **관리자 기능 재도입 시**: 환경변수 패스워드 방식의 보안 한계, 노션 API 속도 제한(평균 초당 3회)에 대한 페이지네이션과 캐싱 필요
- **다크모드**: 승인/거절 배지를 실제 데이터로 확인하지 못했으므로 해당 상태의 견적서가 생기면 다크에서 한 번 확인

---

**문서 버전**: v4.0
**최종 업데이트**: 2026-11-20
**진행 상황**: Phase 5 완료 (3/3 Tasks, Task 010~012). MVP 잔여 Task 007, 009, 013 완료(007, 013은 일부 확인 생략). 관리자 기능은 보류
