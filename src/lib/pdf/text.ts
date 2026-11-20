// PDF 한글 폰트(Noto Sans KR)에는 이모지 글리프가 없어 깨진 글리프가 이웃 글자와 겹칩니다.
// PDF에 넣는 텍스트에서만 이모지를 제거하고, 웹 화면과 노션 원본은 그대로 둡니다.
// ©, ®, ™, ★ 같은 일반 기호는 폰트에 있으므로 유지하기 위해 이모지 표현(Emoji_Presentation)이거나
// 변형 선택자(U+FE0F)가 붙은 문자만 지웁니다.
const EMOJI_PATTERN = new RegExp(
  "(?:\\p{Extended_Pictographic}\\uFE0F|\\p{Emoji_Presentation})" +
    "(?:\\p{Emoji_Modifier}|\\uFE0F|\\u20E3)*" +
    "(?:\\u200D(?:\\p{Extended_Pictographic}|\\p{Emoji_Presentation})(?:\\p{Emoji_Modifier}|\\uFE0F)*)*",
  "gu",
);

// 이모지 제거 후 남는 결합 문자(키캡, ZWJ, 변형 선택자)
const LEFTOVER_PATTERN = /[️⃣‍]/g;

export function stripEmoji(value: string) {
  return value.replace(EMOJI_PATTERN, "").replace(LEFTOVER_PATTERN, "").trim();
}
