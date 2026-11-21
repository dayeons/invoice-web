"use client"

import { useTransition } from "react"
import { RefreshCw } from "lucide-react"

import { refreshInvoiceList } from "@/app/admin/actions"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

// 목록 새로고침 버튼. Server Action이 세션을 다시 확인하고 목록 캐시를 만료하면 화면이 새 데이터로 갱신됩니다.
export function RefreshListButton() {
  const [pending, startTransition] = useTransition()

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => startTransition(() => refreshInvoiceList())}
    >
      {pending ? <Spinner /> : <RefreshCw />}
      새로고침
    </Button>
  )
}
