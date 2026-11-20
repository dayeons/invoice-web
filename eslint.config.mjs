import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Playwright MCP 출력(스크린샷, 다운로드, 임시 빌드 산출물). gitignore 대상이며 검사할 소스가 아님
    ".playwright-mcp/**",
  ]),
]);

export default eslintConfig;
