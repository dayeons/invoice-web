import { Container } from "@/components/layout/container"

type AdminHeaderProps = {
  // 우측 영역(테마 토글, 로그아웃 등). layout이 features를 import하지 않도록 slot으로 받습니다.
  actions?: React.ReactNode
}

// 관리자 화면 공통 헤더
export function AdminHeader({ actions }: AdminHeaderProps) {
  return (
    <header className="border-b bg-background print:hidden">
      <Container className="flex h-14 items-center justify-between gap-3">
        <span className="truncate text-sm font-semibold">견적서 관리</span>
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      </Container>
    </header>
  )
}
