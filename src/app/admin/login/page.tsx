import { Suspense } from "react"
import { redirect } from "next/navigation"

import { LoginForm } from "@/components/features/admin/loginForm"
import { Container } from "@/components/layout/container"
import { Skeleton } from "@/components/ui/skeleton"
import { getAdminConfig } from "@/lib/admin/session"
import { isAdminSession } from "@/lib/admin/auth"

// 관리자 로그인 (헤더 밖)
export default function AdminLoginPage() {
  return (
    <main className="flex min-h-svh items-center">
      <Container className="max-w-sm">
        <h1 className="mb-6 text-xl font-semibold">관리자 로그인</h1>
        <Suspense fallback={<Skeleton className="h-28 w-full" />}>
          <LoginContent />
        </Suspense>
      </Container>
    </main>
  )
}

// 세션(쿠키)과 환경변수는 요청 시점에 읽어야 하므로 Suspense 안에서 확인합니다.
async function LoginContent() {
  if (await isAdminSession()) redirect("/admin")
  return <LoginForm configured={getAdminConfig() !== null} />
}
