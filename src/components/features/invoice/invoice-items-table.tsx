import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { Invoice } from "@/types/invoice";

export function InvoiceItemsTable({ invoice }: { invoice: Invoice }) {
  if (invoice.items.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>견적 항목이 없습니다</EmptyTitle>
          <EmptyDescription>
            이 견적서에는 아직 등록된 항목이 없습니다.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <>
      <ul className="divide-y rounded-lg border md:hidden">
        {invoice.items.map(item => (
          <li key={item.id} className="space-y-1 p-3 text-sm">
            <p className="font-medium break-words">{item.description}</p>
            <p className="text-muted-foreground">
              {formatNumber(item.quantity)} × {formatCurrency(item.unitPrice)}
            </p>
            <p className="text-right font-medium">
              {formatCurrency(item.amount)}
            </p>
          </li>
        ))}
      </ul>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">항목</TableHead>
              <TableHead scope="col" className="text-right">
                수량
              </TableHead>
              <TableHead scope="col" className="text-right">
                단가
              </TableHead>
              <TableHead scope="col" className="text-right">
                금액
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoice.items.map(item => (
              <TableRow key={item.id}>
                <TableCell className="break-words whitespace-normal">
                  {item.description}
                </TableCell>
                <TableCell className="text-right">
                  {formatNumber(item.quantity)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(item.unitPrice)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(item.amount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
