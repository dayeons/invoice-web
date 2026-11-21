# Task 014: 관리자 접근 보호와 관리자 레이아웃 셸 구축

## 개요
`/admin` 이하를 환경변수 비밀번호(`ADMIN_PASSWORD`)와 HMAC-SHA256 서명 세션 쿠키(`ADMIN_SESSION_SECRET`, `node:crypto`)로 보호하고, 로그인 화면과 헤더(제목, `ThemeToggle`, 로그아웃)가 있는 관리자 레이아웃 골격을 만듭니다. 목록 자리는 비워 두고(Task 016), 새 npm 의존성은 추가하지 않습니다.

보호는 세 겹입니다. (1) Proxy가 쿠키 서명과 만료만 낙관적으로 검사(노션 호출 없음), (2) 페이지가 `<Suspense>` 안에서 `requireAdmin()`으로 재확인, (3) 모든 Server Action이 시작할 때 세션을 재확인합니다. 레이아웃에서는 인증 검사를 하지 않습니다(Next 문서: 레이아웃은 내비게이션 때 다시 렌더링되지 않음, matcher 변경 시 Server Action 보호가 조용히 빠질 수 있음).

## 관련 파일
- `src/lib/admin/session.ts` (신규): 세션 서명/검증/만료, 비밀번호 비교. `next/headers` 등 서버 렌더 전용 모듈을 import하지 않는 순수 모듈(Proxy와 서버 공유, `src/lib/notion/id.ts`와 같은 규칙)
- `src/lib/admin/auth.ts` (신규, 서버 전용): `isAdminSession()`, `requireAdmin()`
- `src/app/admin/actions.ts` (신규, `"use server"`): `login`, `logout`
- `src/proxy.ts`: matcher `["/invoice/:id", "/admin/:path*"]`, 경로별 분기. `/invoice/:id` 동작 불변
- `src/app/admin/layout.tsx` (신규): noindex 메타데이터만
- `src/app/admin/login/page.tsx` (신규): 헤더 밖 로그인 화면
- `src/app/admin/(dashboard)/layout.tsx`, `page.tsx` (신규): 헤더 + 목록 자리표시자
- `src/components/layout/adminHeader.tsx` (신규): 우측 영역은 slot props
- `src/components/features/admin/loginForm.tsx`(`"use client"`, `useActionState`), `logoutButton.tsx` (신규)
- `src/components/ui/input.tsx`, `label.tsx`: `npx shadcn@latest add input label`로 추가(직접 편집 없음)
- `.env.example`, `CLAUDE.md`, `shrimp-rules.md`, `README.md` (문서 갱신)
- 수정하지 않음: `src/app/layout.tsx`(루트 레이아웃)

## 수락 기준
- [x] 비로그인 `/admin` 접근은 `/admin/login`으로 리다이렉트, 로그인 성공 시 `/admin`, 로그인 상태의 `/admin/login`은 `/admin`으로
- [x] 세션 쿠키는 `httpOnly`, `sameSite=lax`, 운영 `secure`, `path=/admin`이며 만료 시각을 포함해 서명. 위조/만료 쿠키는 비로그인으로 처리
- [x] 비밀번호는 SHA-256 다이제스트끼리 `timingSafeEqual`로 비교(길이 노출 없음). 실패 시 약 1초 지연과 일반 문구 "비밀번호가 올바르지 않습니다"
- [x] `ADMIN_PASSWORD` 또는 `ADMIN_SESSION_SECRET`이 비어 있으면 관리자 기능은 닫힘(로그인 항상 실패 + "관리자 기능이 설정되지 않았습니다" 안내, 설정 값 미노출)
- [x] Proxy만으로 보호하지 않음: 페이지는 `<Suspense>` 안에서 `requireAdmin()`, Server Action은 시작할 때 세션 재확인, 레이아웃에서는 인증 검사 없음
- [x] 루트 `src/app/layout.tsx`는 그대로, 기존 공개 라우트는 옮기지 않음
- [x] 공개 동작 불변: `/invoice/abc` HTTP 404, `/invoice/<id>`와 PDF, `/api/revalidate`는 로그인 없이 동작
- [x] `/admin`, `/admin/login`에 noindex, 공개 페이지(`/`)에 관리자 링크 없음, 헤더에 `ThemeToggle` 배치
- [x] 새 의존성 없음
- [x] 문서 갱신: `CLAUDE.md`(라우팅 절, Proxy 설명, 환경변수), `shrimp-rules.md`(1절, 2.1절 표, 8.2절, 9절), `.env.example`(자리표시자만), `README.md` 환경변수 표
- [x] `npm run check-all`, `npm run build` 통과

## 구현 단계
- [x] 1. Next.js 문서 확인, 작업 파일 작성
- [x] 2. `npx shadcn@latest add input label`
- [x] 3. `session.ts`(서명, 검증, 만료) 구현
- [x] 4. Proxy 분기 추가(기존 견적서 ID 검사 유지)
- [x] 5. `login`/`logout` Server Action과 `requireAdmin()` 구현
- [x] 6. 관리자 레이아웃, 헤더, 로그인 화면, 목록 자리표시자 구현
- [x] 7. 문서 갱신, `npm run check-all`, `npm run build`
- [x] 8. Playwright MCP로 테스트 체크리스트 수행, 결과 기록

## 테스트 체크리스트
쿠키 속성(`Secure` 포함), HTTP 상태는 `npm run build` 후 `npm run start`에서 확인합니다. 관리자 비밀번호와 비밀키는 명령줄 환경변수로만 넘기고 어디에도 기록하지 않습니다.

### 정상 케이스
- [x] 비로그인 `/admin` → `/admin/login`으로 이동, 로그인 화면 표시
- [x] 올바른 비밀번호 → `/admin`으로 이동, 헤더(제목, 테마 토글, 로그아웃)와 목록 자리표시자 표시
- [x] 쿠키 속성: `HttpOnly`, `SameSite=Lax`, `Path=/admin`, 운영 빌드에서 `Secure`, 만료 시각(Max-Age/Expires) 존재, `document.cookie`에서 보이지 않음
- [x] 로그아웃 → 쿠키 삭제, `/admin` 재접근 시 로그인 화면

### 에러/예외 케이스
- [x] 틀린 비밀번호 → "비밀번호가 올바르지 않습니다", 쿠키 없음, 응답까지 약 1초 지연
- [x] 쿠키 값 한 글자 변조 → `/admin`이 로그인 화면으로 이동
- [x] 만료 시각을 과거로 조작한 쿠키(서명은 원래 값) → 로그인 화면
- [x] 관리자 환경변수 없이 서버 시작 → 로그인 불가 안내("관리자 기능이 설정되지 않았습니다"), 어떤 비밀번호도 실패, 화면과 서버 로그에 설정 값 없음
- [x] `ADMIN_SESSION_SECRET`만 없어도(또는 `ADMIN_PASSWORD`만 없어도) 같은 닫힘 동작

### 경계값/엣지 케이스
- [x] 로그인 상태에서 `/admin/login` → `/admin`으로 이동
- [x] 빈 비밀번호 제출 → 안내 문구, 쿠키 없음
- [x] 매우 긴 입력(1,000자) → 일반 실패 문구, 오류 화면 없음
- [x] 공개 라우트 회귀: `/invoice/abc` HTTP 404, `[TEST] 정상` 견적서 열람, PDF 200, `/api/revalidate` 토큰 없음 401
- [x] `/` 화면에 관리자 링크 없음

### 반응형/테마
- [x] 375/768/1280px에서 로그인 폼과 헤더가 잘리지 않고 가로 넘침 없음(`document.documentElement.scrollWidth`)
- [x] 헤더 토글이 라이트 → 다크 → 시스템으로 순환
- [x] 다크에서 입력란 경계와 오류 문구가 보임
- [x] `/admin`, `/admin/login`에 noindex 메타(`robots`) 존재
- [x] 콘솔 에러 0

## 테스트 결과

### 변경 사항 요약
- `src/lib/admin/session.ts`: `node:crypto`만 쓰는 순수 모듈. 토큰 `<만료 ms>.<HMAC-SHA256 base64url>`(서명에 만료 시각 포함), 8시간 유효, `verifyPassword`는 SHA-256 다이제스트끼리 `timingSafeEqual`
- `src/lib/admin/auth.ts`: `isAdminSession()`, `requireAdmin()`(서버 전용, `<Suspense>` 안에서만 호출)
- `src/app/admin/actions.ts`: `login`(실패 시 1초 지연, 환경변수 누락 시 닫힘 문구), `logout`(`path=/admin`으로 쿠키 삭제)
- `src/proxy.ts`: matcher `["/invoice/:id", "/admin/:path*"]`, 경로별 분기. 로그인 상태의 `/admin/login` 리다이렉트는 GET만(로그인 Server Action POST를 가로채지 않음)
- 라우트/컴포넌트: `app/admin/layout.tsx`(noindex), `login/page.tsx`, `(dashboard)/layout.tsx`, `(dashboard)/page.tsx`, `layout/adminHeader.tsx`(slot), `features/admin/loginForm.tsx`, `logoutButton.tsx`, shadcn `input`, `label`
- 문서: `CLAUDE.md`, `shrimp-rules.md`(1절, 2.1절, 5.2절, 8.2절, 9절), `.env.example`, `README.md`

### 구현 중 발견해 고친 문제
- `isAdminSession()`이 환경변수를 `cookies()`보다 먼저 확인해, `/admin/login`이 빌드 시점 환경변수로 프리렌더되어 "관리자 기능이 설정되지 않았습니다"가 고정되는 문제가 있었음. `cookies()`를 먼저 읽도록 순서를 바꾸자 두 라우트가 부분 프리렌더(◐)로 바뀌고 요청 시점 값이 반영됨(빌드에 관리자 환경변수가 없어도 동작)

### 2026-11-21 Playwright MCP 검증 (`npm run build` 후 `next start -p 3100`)
관리자 비밀번호, 비밀키는 명령줄 환경변수로만 전달했고 이 파일에 값을 적지 않음. 3000번 포트는 이미 다른 `next-server`가 쓰고 있어 3100번을 사용함.

정상
- 비로그인 `/admin` → HTTP 307로 `/admin/login`, 로그인 화면 표시, `robots`=`noindex, nofollow`
- 올바른 비밀번호 → `/admin`, 헤더("견적서 관리", 테마 토글, 로그아웃)와 목록 자리표시자 표시
- 쿠키: `HttpOnly`=true, `SameSite=Lax`, `Secure`=true(운영 빌드), `Path=/admin`, 만료까지 28,800초, `document.cookie`에서 보이지 않음
- 로그아웃 → 로그인 화면, `admin_session` 쿠키 0개, 이후 `/admin` 재접근 시 로그인 화면

에러
- 틀린 비밀번호 → "비밀번호가 올바르지 않습니다.", 쿠키 0개, 응답까지 약 1.3초
- 쿠키 마지막 글자 변조, 서명은 올바르고 만료만 과거인 토큰, 임의 문자열 → 모두 `/admin/login`
- 관리자 환경변수 둘 다 없음 / `ADMIN_PASSWORD`만 있음 / `ADMIN_SESSION_SECRET`만 있음 → 모두 "관리자 기능이 설정되지 않았습니다" 안내, 폼 미표시. 화면과 서버 로그에 임시 값 0건

엣지
- 로그인 상태에서 `/admin/login` → `/admin`
- 빈 비밀번호 → "비밀번호를 입력해 주세요.", 쿠키 없음. 1,000자 입력 → 일반 실패 문구, 오류 화면 없음
- 공개 라우트: `/invoice/abc` 404, `[TEST] 정상` 200, PDF 200, `/api/revalidate` 토큰 없음 401, `/` 본문에 "admin" 문자열 없음

반응형/테마
- 로그인 화면과 `/admin`을 375/768/1280px에서 라이트·다크 모두 `scrollWidth - clientWidth` = 0
- 헤더 토글: 시스템 → 라이트 → 다크 → 시스템으로 순환
- 다크(375px)에서 입력란 경계(빨간 오류 윤곽)와 오류 문구가 보임(스크린샷 확인)
- 콘솔 에러/경고 0 (로그인, 로그아웃, 변조 쿠키 시나리오 동안 수집)

### 검증 한계
- Proxy를 우회했을 때 페이지의 `requireAdmin()`과 Server Action 재확인이 막는지는 직접 시험하지 못함(Proxy 없이 서버를 띄우는 방법이 없음). 코드 경로(`requireAdmin()` 호출, `logout`은 쿠키만 삭제)는 리뷰로만 확인함
- `logout`은 세션 확인 없이 쿠키 삭제 후 이동(멱등 동작, 관리자 데이터를 읽지 않음). 다른 Server Action은 시작할 때 `requireAdmin()`을 부르는 규칙을 `shrimp-rules.md`에 명시함
