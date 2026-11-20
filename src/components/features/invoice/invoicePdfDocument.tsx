import {
  Document,
  Link,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { getInvoiceUrl } from "@/lib/invoice-url";
import { PDF_FONT_FAMILY, registerPdfFonts } from "@/lib/pdf/fonts";
import { stripEmoji } from "@/lib/pdf/text";
import type { Invoice } from "@/types/invoice";

registerPdfFonts();

// 흑백 인쇄에서도 읽히도록 회색조만 사용합니다.
const styles = StyleSheet.create({
  page: {
    fontFamily: PDF_FONT_FAMILY,
    fontSize: 10,
    color: "#111111",
    paddingTop: 40,
    paddingBottom: 56,
    paddingHorizontal: 40,
  },
  header: { marginBottom: 20 },
  headerTop: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  invoiceNumber: { fontSize: 10, color: "#555555", flexShrink: 1 },
  status: {
    marginLeft: 8,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: "#111111",
    borderRadius: 8,
    fontSize: 9,
  },
  clientName: { fontSize: 20, fontWeight: 700 },
  meta: { flexDirection: "row", marginBottom: 20 },
  metaItem: { flexGrow: 1, flexBasis: 0 },
  metaLabel: { fontSize: 9, color: "#555555", marginBottom: 2 },
  metaValue: { fontSize: 11, fontWeight: 700 },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#111111",
    paddingVertical: 6,
    fontWeight: 700,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#999999",
    paddingVertical: 6,
  },
  colDescription: { flexGrow: 1, flexBasis: 0, paddingRight: 8 },
  colQuantity: { width: 50, textAlign: "right" },
  colUnitPrice: { width: 90, textAlign: "right" },
  colAmount: { width: 100, textAlign: "right" },
  empty: {
    borderWidth: 1,
    borderColor: "#999999",
    padding: 20,
    textAlign: "center",
  },
  emptyTitle: { fontSize: 11, fontWeight: 700, marginBottom: 4 },
  emptyDescription: { color: "#555555" },
  summary: { marginTop: 20, marginLeft: "auto", width: 240 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between" },
  summaryLabel: { color: "#555555" },
  summaryDivider: {
    borderTopWidth: 1,
    borderTopColor: "#111111",
    marginVertical: 8,
  },
  total: { fontSize: 13, fontWeight: 700 },
  shareLink: { marginTop: 24, fontSize: 8, color: "#555555" },
  shareLinkUrl: { color: "#111111" },
  pageNumber: {
    position: "absolute",
    bottom: 24,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 8,
    color: "#555555",
  },
});

// 날짜가 없으면 "-"로 표시합니다.
function displayDate(value: string | null) {
  return value ? formatDate(value) : "-";
}

// 웹 화면(InvoiceView)과 같은 정보 구조의 PDF 문서입니다. 서버에서만 사용합니다.
export function InvoicePdfDocument({ invoice }: { invoice: Invoice }) {
  const subtotal = invoice.items.reduce((sum, item) => sum + item.amount, 0);
  const shareUrl = getInvoiceUrl(invoice.id);
  const invoiceNumber = stripEmoji(invoice.invoiceNumber);

  return (
    <Document title={invoiceNumber} author="Invoice" language="ko">
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.invoiceNumber}>{invoiceNumber}</Text>
            {invoice.status ? (
              <Text style={styles.status}>{stripEmoji(invoice.status)}</Text>
            ) : null}
          </View>
          <Text style={styles.clientName}>{stripEmoji(invoice.clientName)}</Text>
        </View>

        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>발행일</Text>
            <Text style={styles.metaValue}>
              {displayDate(invoice.issueDate)}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>유효기간</Text>
            <Text style={styles.metaValue}>
              {displayDate(invoice.validUntil)}
            </Text>
          </View>
        </View>

        {invoice.items.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>견적 항목이 없습니다</Text>
            <Text style={styles.emptyDescription}>
              이 견적서에는 아직 등록된 항목이 없습니다.
            </Text>
          </View>
        ) : (
          <View>
            {/* 표 머리글은 페이지가 넘어가도 매 페이지 반복합니다. */}
            <View style={styles.tableHeader} fixed>
              <Text style={styles.colDescription}>항목</Text>
              <Text style={styles.colQuantity}>수량</Text>
              <Text style={styles.colUnitPrice}>단가</Text>
              <Text style={styles.colAmount}>금액</Text>
            </View>
            {invoice.items.map(item => (
              // 행이 두 페이지에 걸쳐 잘리지 않게 합니다.
              <View key={item.id} style={styles.row} wrap={false}>
                <Text style={styles.colDescription}>{stripEmoji(item.description)}</Text>
                <Text style={styles.colQuantity}>
                  {formatNumber(item.quantity)}
                </Text>
                <Text style={styles.colUnitPrice}>
                  {formatCurrency(item.unitPrice)}
                </Text>
                <Text style={styles.colAmount}>
                  {formatCurrency(item.amount)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* 합계가 페이지 사이에서 쪼개지지 않게 묶습니다. */}
        <View style={styles.summary} wrap={false}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>소계</Text>
            <Text>{formatCurrency(subtotal)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={[styles.summaryRow, styles.total]}>
            <Text>총액</Text>
            <Text>{formatCurrency(invoice.totalAmount)}</Text>
          </View>
        </View>

        <Text style={styles.shareLink}>
          견적서 링크:{" "}
          <Link src={shareUrl} style={styles.shareLinkUrl}>
            {shareUrl}
          </Link>
        </Text>

        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `${pageNumber} / ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}
