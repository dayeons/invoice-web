import { FileQuestion } from "lucide-react"

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

// 404 페이지 (F011) — 존재하지 않는 견적서 접근 시 표시
export default function NotFound() {
  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileQuestion />
          </EmptyMedia>
          <EmptyTitle>견적서를 찾을 수 없습니다</EmptyTitle>
          <EmptyDescription>
            링크가 올바른지 확인하거나, 견적서를 발행한 담당자에게 올바른 링크를 요청해 주세요.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </main>
  )
}
