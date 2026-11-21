"use client"

import { TriangleAlert } from "lucide-react"

import { Container } from "@/components/layout/container"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

// 관리자 화면 오류 경계. 레이아웃(헤더)은 유지되고 본문만 오류 상태로 바뀝니다.
// 노션 오류 원문은 화면에 싣지 않으며, 서버 컴포넌트 오류는 데이터를 다시 가져와야 하므로 retry를 씁니다.
export default function AdminError({
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  return (
    <Container>
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <TriangleAlert />
          </EmptyMedia>
          <EmptyTitle>견적서 목록을 불러오지 못했습니다</EmptyTitle>
          <EmptyDescription>
            노션 연결에 문제가 있을 수 있습니다. 잠시 후 다시 시도해 주세요.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={() => retry()}>다시 시도</Button>
        </EmptyContent>
      </Empty>
    </Container>
  )
}
