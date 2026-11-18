import { FileText } from "lucide-react"

import { Container } from "@/components/layout/container"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { siteConfig } from "@/config/site"

// 홈 — 견적서는 고유 링크로만 접근하므로 안내 문구만 표시합니다.
export default function HomePage() {
  return (
    <main className="flex min-h-svh items-center">
      <Container>
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileText />
            </EmptyMedia>
            <EmptyTitle>{siteConfig.name}</EmptyTitle>
            <EmptyDescription>
              견적서는 발행자에게 받은 고유 링크로 확인할 수 있습니다.
              링크를 열어 견적서를 조회하고 PDF로 저장하세요.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </Container>
    </main>
  )
}
