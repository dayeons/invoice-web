"use client"

import { useActionState } from "react"
import { Lock } from "lucide-react"

import { login, type LoginState } from "@/app/admin/actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"

type LoginFormProps = {
  // 관리자 환경변수가 없으면 false. 폼을 닫고 안내만 보여 줍니다.
  configured: boolean
}

const initialState: LoginState = {}

export function LoginForm({ configured }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(login, initialState)

  if (!configured) {
    return (
      <Alert variant="destructive">
        <AlertDescription>관리자 기능이 설정되지 않았습니다.</AlertDescription>
      </Alert>
    )
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="admin-password">비밀번호</Label>
        <Input
          id="admin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={!!state.error}
          aria-describedby={state.error ? "admin-password-error" : undefined}
          disabled={pending}
        />
        {state.error ? (
          <p id="admin-password-error" role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        ) : null}
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? <Spinner /> : <Lock />}
        로그인
      </Button>
    </form>
  )
}
