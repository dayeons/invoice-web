import { Badge } from "@/components/ui/badge"

type BadgeVariant = "default" | "secondary" | "destructive" | "outline"

// 노션 상태 값(대기/승인/거절)을 배지 색상으로 매핑합니다.
const STATUS_VARIANTS: Record<string, BadgeVariant> = {
  대기: "secondary",
  승인: "default",
  거절: "destructive",
}

// 상태가 없으면 아무것도 그리지 않고, 알 수 없는 값은 기본 윤곽선 배지로 보여줍니다.
export function StatusBadge({ status }: { status: string | null }) {
  if (!status) return null

  return <Badge variant={STATUS_VARIANTS[status] ?? "outline"}>{status}</Badge>
}
