import type { Metadata } from "next"

// 관리자 영역 공통 메타데이터. 인증 검사는 여기서 하지 않습니다.
// (레이아웃은 내비게이션 때 다시 렌더링되지 않으므로 페이지와 Server Action이 직접 확인)
export const metadata: Metadata = {
  title: "관리자",
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return children
}
