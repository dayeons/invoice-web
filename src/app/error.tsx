"use client"

import { TriangleAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

// 런타임 에러 경계 — 하위 라우트에서 발생한 에러를 잡아 복구 버튼을 제공합니다.
// 서버 컴포넌트 에러는 데이터를 다시 가져와야 복구되므로 reset 대신 retry를 씁니다.
export default function Error({
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <TriangleAlert />
          </EmptyMedia>
          <EmptyTitle>문제가 발생했습니다</EmptyTitle>
          <EmptyDescription>
            일시적인 오류일 수 있습니다. 잠시 후 다시 시도해 주세요.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={() => retry()}>다시 시도</Button>
        </EmptyContent>
      </Empty>
    </main>
  )
}
