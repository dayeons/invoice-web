"use client";

import { useRef, useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

const FALLBACK_FILENAME = "invoice.pdf";

// 서버가 보낸 Content-Disposition의 filename*=UTF-8'' 값을 해석합니다.
// 파일명 규칙의 단일 출처는 서버 헤더이므로 여기서는 해석만 하고, 실패하면 기본 이름을 씁니다.
function parseFilename(header: string | null) {
  const match = header?.match(/filename\*=UTF-8''([^;]+)/i);
  if (!match) return FALLBACK_FILENAME;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return FALLBACK_FILENAME;
  }
}

// PDF 다운로드 버튼 (F003)
// 서버(/invoice/<id>/pdf)가 노션에서 다시 조회해 만든 PDF를 내려받습니다. 상대 경로만 사용합니다.
export function DownloadPdfButton({ invoiceId }: { invoiceId: string }) {
  const [pending, setPending] = useState(false);
  // state는 다음 렌더 전에 들어온 두 번째 클릭을 막지 못하므로 ref로 먼저 막습니다.
  const busy = useRef(false);

  async function handleClick() {
    if (busy.current) return;
    busy.current = true;
    setPending(true);

    try {
      const res = await fetch(`/invoice/${invoiceId}/pdf`);
      if (!res.ok) throw new Error("PDF 요청 실패");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = parseFilename(res.headers.get("content-disposition"));
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      // 서버 오류 원문은 화면에 노출하지 않습니다.
      toast.error("PDF를 만들지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      className="print:hidden"
      disabled={pending}
      onClick={handleClick}
    >
      {pending ? (
        <Spinner data-icon="inline-start" />
      ) : (
        <Download data-icon="inline-start" />
      )}
      {pending ? "PDF 생성 중" : "PDF 다운로드"}
    </Button>
  );
}
