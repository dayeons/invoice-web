import { LogoutButton } from "@/components/features/admin/logoutButton"
import { ThemeToggle } from "@/components/common/themeToggle"
import { AdminHeader } from "@/components/layout/adminHeader"

// 헤더가 있는 관리자 화면 레이아웃. 인증 검사는 하지 않습니다. (각 페이지의 requireAdmin이 담당)
export default function DashboardLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex min-h-svh flex-col">
      <AdminHeader
        actions={
          <>
            <ThemeToggle />
            <LogoutButton />
          </>
        }
      />
      <main className="flex-1 py-6">{children}</main>
    </div>
  )
}
