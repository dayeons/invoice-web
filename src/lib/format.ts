import { format, formatDistanceToNow, parseISO } from "date-fns"
import { ko } from "date-fns/locale"

// 날짜·숫자 포맷 유틸 — 날짜는 date-fns, 숫자/통화는 내장 Intl API를 사용합니다.

// 예: 2026년 11월 12일
// 문자열은 parseISO로 읽어 "2026-11-12" 같은 날짜만 있는 값을 서버 시간대의 해당 날짜로 해석합니다.
// (new Date("2026-11-12")는 UTC 자정이라 UTC보다 늦은 시간대에서는 하루 전으로 보일 수 있음)
export function formatDate(date: Date | string | number, pattern = "PPP") {
  const value = typeof date === "string" ? parseISO(date) : new Date(date)
  return format(value, pattern, { locale: ko })
}

// 예: 3일 전
export function formatRelative(date: Date | string | number) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ko })
}

const numberFormatter = new Intl.NumberFormat("ko-KR")
const currencyFormatter = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: "KRW",
})

// 예: 1,234,567
export function formatNumber(value: number) {
  return numberFormatter.format(value)
}

// 예: ₩1,234,567
export function formatCurrency(value: number) {
  return currencyFormatter.format(value)
}
