import { Client } from "@notionhq/client"

// 서버 전용 모듈입니다. 클라이언트 컴포넌트에서 import하지 마세요.
// (환경변수에 NEXT_PUBLIC_ 접두사가 없어 브라우저 번들에서는 값이 비어 있습니다.)

function requireEnv(name: "NOTION_API_KEY" | "NOTION_DATABASE_ID") {
  const value = process.env[name]
  if (!value) {
    throw new Error(`환경변수 ${name}이(가) 설정되지 않았습니다. .env.local을 확인하세요.`)
  }
  return value
}

let client: Client | null = null

export function getNotionClient() {
  client ??= new Client({ auth: requireEnv("NOTION_API_KEY") })
  return client
}

export function getDatabaseId() {
  return requireEnv("NOTION_DATABASE_ID")
}
