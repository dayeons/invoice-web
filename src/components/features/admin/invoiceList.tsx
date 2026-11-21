import Link from "next/link"
import { ExternalLink, FileText } from "lucide-react"

import { CopyLinkButton } from "@/components/common/copyLinkButton"
import { StatusBadge } from "@/components/common/statusBadge"
import { RefreshListButton } from "@/components/features/admin/refreshListButton"
import { buttonVariants } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency, formatDate } from "@/lib/format"
import type { InvoiceListItem, InvoiceListResult } from "@/types/invoice"

// 목록 행. 공유 링크는 서버(페이지)에서 getInvoiceUrl로 만들어 넘깁니다.
type InvoiceRow = InvoiceListItem & { shareUrl: string }

type InvoiceListProps = Omit<InvoiceListResult, "items"> & {
  items: InvoiceRow[]
}

// 날짜가 없으면 formatDate를 부르지 않고 "-"로 대신합니다. (잘못된 값은 RangeError)
function dateText(value: string | null) {
  return value ? formatDate(value) : "-"
}

// 총 금액이 null이면 "-"이고, 0은 ₩0으로 구분해 보여 줍니다.
function amountText(value: number | null) {
  return value === null ? "-" : formatCurrency(value)
}

// 행마다 독립 인스턴스라 토스트와 "복사됨" 상태가 클릭한 행에만 나타납니다.
// 표가 좁은 768~1023px에서는 두 버튼을 세로로 쌓아 작업 열이 잘리지 않게 합니다.
function RowActions({ item }: { item: InvoiceRow }) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2 md:flex-col md:items-end lg:flex-row lg:items-center">
      <CopyLinkButton
        url={item.shareUrl}
        size="sm"
        subject={item.invoiceNumber || item.clientName || "견적서"}
        errorMessage="링크를 복사하지 못했습니다. 견적서를 열어 주소창에서 복사해 주세요."
      />
      <OpenInvoiceLink id={item.id} />
    </div>
  )
}

function OpenInvoiceLink({ id }: { id: string }) {
  return (
    <Link
      href={`/invoice/${id}`}
      target="_blank"
      rel="noopener"
      prefetch={false}
      className={buttonVariants({ variant: "outline", size: "sm" })}
    >
      <ExternalLink />
      견적서 열기
    </Link>
  )
}

function InvoiceCard({ item }: { item: InvoiceRow }) {
  return (
    <li className="space-y-2 p-3 text-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 font-medium break-words">
          {item.invoiceNumber || "-"}
        </p>
        <StatusBadge status={item.status} />
      </div>
      <p className="break-words">{item.clientName || "-"}</p>
      <p className="text-muted-foreground">
        발행 {dateText(item.issueDate)} · 유효 {dateText(item.validUntil)}
      </p>
      <p className="font-medium">{amountText(item.totalAmount)}</p>
      <RowActions item={item} />
    </li>
  )
}

// 관리자 견적서 목록. 768px 미만은 카드, 이상은 표로 보여 줍니다.
export function InvoiceList({ items, truncated }: InvoiceListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">총 {items.length}건</p>
          {truncated ? (
            <p className="text-xs text-muted-foreground">
              최근 {items.length}건만 표시합니다.
            </p>
          ) : null}
        </div>
        <RefreshListButton />
      </div>

      {items.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileText />
            </EmptyMedia>
            <EmptyTitle>등록된 견적서가 없습니다</EmptyTitle>
            <EmptyDescription>
              노션 데이터베이스에 견적서를 추가한 뒤 새로고침해 주세요.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <ul className="divide-y rounded-lg border md:hidden">
            {items.map((item) => (
              <InvoiceCard key={item.id} item={item} />
            ))}
          </ul>
          <div className="hidden md:block">
            <Table className="[&_td]:px-1.5 [&_th]:px-1.5 lg:[&_td]:px-2 lg:[&_th]:px-2">
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">견적서 번호</TableHead>
                  <TableHead scope="col">클라이언트명</TableHead>
                  <TableHead scope="col">발행일</TableHead>
                  <TableHead scope="col">유효기간</TableHead>
                  <TableHead scope="col">상태</TableHead>
                  <TableHead scope="col" className="text-right">
                    총 금액
                  </TableHead>
                  <TableHead scope="col">
                    <span className="sr-only">작업</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="min-w-20 max-w-48 font-medium break-words whitespace-normal">
                      {item.invoiceNumber || "-"}
                    </TableCell>
                    <TableCell className="max-w-56 break-words whitespace-normal">
                      {item.clientName || "-"}
                    </TableCell>
                    <TableCell>{dateText(item.issueDate)}</TableCell>
                    <TableCell>{dateText(item.validUntil)}</TableCell>
                    <TableCell>
                      <StatusBadge status={item.status} />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {amountText(item.totalAmount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <RowActions item={item} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  )
}
