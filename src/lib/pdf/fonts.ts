import path from "node:path";

import { Font } from "@react-pdf/renderer";

// PDF 한글 폰트 등록 — 서버(Route Handler)에서만 사용합니다.
// Node에서는 URL이 아닌 파일 시스템 절대 경로가 필요하므로 process.cwd() 기준으로 만듭니다.
// 배포 시 폰트 파일이 함수에 포함되도록 next.config.ts의 파일 추적 설정이 필요합니다(Task 006 T6에서 확인).
export const PDF_FONT_FAMILY = "NotoSansKR";

const FONT_DIR = path.join(process.cwd(), "src", "assets", "fonts");

// 이 길이를 넘는 단어만 글자 단위 줄바꿈을 허용합니다.
const MAX_WORD_LENGTH = 16;

let registered = false;

export function registerPdfFonts() {
  if (registered) return;
  registered = true;

  Font.register({
    family: PDF_FONT_FAMILY,
    fonts: [
      {
        src: path.join(FONT_DIR, "NotoSansKR-Regular.otf"),
        fontWeight: 400,
      },
      {
        src: path.join(FONT_DIR, "NotoSansKR-Bold.otf"),
        fontWeight: 700,
      },
    ],
  });

  // 일반 단어는 하이픈으로 쪼개지 않아 한글이 글자 단위로 끊기지 않게 합니다.
  // 다만 공백 없이 매우 긴 값은 줄바꿈 지점이 없어 페이지를 넘치므로, 그때만 글자 단위로 나눕니다.
  Font.registerHyphenationCallback(word =>
    word.length > MAX_WORD_LENGTH ? Array.from(word) : [word],
  );
}
