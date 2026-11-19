"use client";

import { Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

// PDF 다운로드 버튼 골격 — 실제 다운로드 동작은 Task 006에서 연결합니다.
export function DownloadPdfButton() {
  return (
    <Button
      type="button"
      className="print:hidden"
      onClick={() => toast.info("PDF 다운로드는 준비 중입니다.")}
    >
      <Download data-icon="inline-start" />
      PDF 다운로드
    </Button>
  );
}
