"use client"

import { useFormStatus } from "react-dom"
import { LogOut } from "lucide-react"

import { logout } from "@/app/admin/actions"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant="outline" size="sm" disabled={pending}>
      {pending ? <Spinner /> : <LogOut />}
      로그아웃
    </Button>
  )
}

// 로그아웃 버튼. Server Action이 세션 쿠키를 지우고 로그인 화면으로 이동합니다.
export function LogoutButton() {
  return (
    <form action={logout}>
      <SubmitButton />
    </form>
  )
}
