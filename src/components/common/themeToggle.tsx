"use client"

import { useEffect, useSyncExternalStore } from "react"
import { Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

// 클릭할 때마다 라이트 → 다크 → 시스템 순서로 순환합니다.
const NEXT_THEME = { light: "dark", dark: "system", system: "light" } as const
type ThemeName = keyof typeof NEXT_THEME

const LABELS: Record<ThemeName, string> = {
  light: "라이트 모드",
  dark: "다크 모드",
  system: "시스템 설정 따르기",
}

const subscribe = () => () => {}

// 테마 전환 버튼
// 서버에서는 저장된 테마를 알 수 없으므로, 마운트 전에는 같은 크기의 빈 버튼을 그려 하이드레이션 불일치를 막습니다.
export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  )

  // 저장소에 알 수 없는 값이 들어 있으면 system으로 정리합니다. (next-themes는 값을 검증하지 않고 그대로 클래스로 붙임)
  const invalid = mounted && !!theme && !(theme in NEXT_THEME)
  useEffect(() => {
    if (invalid) setTheme("system")
  }, [invalid, setTheme])

  if (!mounted) {
    return (
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="print:hidden"
        disabled
        aria-label="테마 전환"
      />
    )
  }

  const current: ThemeName = theme && theme in NEXT_THEME ? (theme as ThemeName) : "system"
  const next = NEXT_THEME[current]
  const Icon = { light: Sun, dark: Moon, system: Monitor }[current]

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="print:hidden"
      onClick={() => setTheme(next)}
      aria-label={`현재 ${LABELS[current]}, 클릭하면 ${LABELS[next]}로 전환`}
      title={LABELS[current]}
    >
      <Icon />
    </Button>
  )
}
