"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

const COPIED_RESET_MS = 2000;

// 클립보드 API를 쓸 수 없을 때(비보안 컨텍스트, 권한 거부 등)를 위한 폴백입니다.
// 임시 textarea를 선택해 복사 명령을 실행하며, 성공 여부를 돌려줍니다.
function copyWithExecCommand(text: string) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();

  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return copyWithExecCommand(text);
  }
}

// 견적서 공유 링크 복사 버튼 (F010)
// 링크는 서버에서 getInvoiceUrl로 완성해 넘깁니다. 클라이언트에서는 siteConfig.url의 Vercel 값을 읽을 수 없기 때문입니다.
export function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 언마운트 시 남은 타이머를 정리합니다.
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  async function handleClick() {
    const ok = await copyText(url);

    if (!ok) {
      toast.error("링크를 복사하지 못했습니다. 주소창의 링크를 직접 복사해 주세요.");
      return;
    }

    toast.success("링크를 복사했습니다");
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), COPIED_RESET_MS);
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="print:hidden"
      onClick={handleClick}
    >
      {copied ? (
        <Check data-icon="inline-start" />
      ) : (
        <LinkIcon data-icon="inline-start" />
      )}
      {copied ? "복사됨" : "링크 복사"}
    </Button>
  );
}
