/** 仓储层公用的小工具 */

/**
 * 解析数据库中的 JSON 文本字段，内容损坏时返回默认值而不是抛错，
 * 避免一条脏数据导致整个页面打不开。
 */
export function parseJson<T>(text: string | null | undefined, fallback: T): T {
  if (!text) return fallback
  try {
    return JSON.parse(text) as T
  }
  catch {
    console.warn('[db] JSON 字段解析失败：', text.slice(0, 100))
    return fallback
  }
}

/** 解析 JSON 字符串数组字段，非数组或含非字符串时过滤掉 */
export function parseStringArray(text: string | null | undefined): string[] {
  const value = parseJson<unknown>(text, [])
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

/**
 * LIKE 的转义字符。不用反斜杠：MySQL 字符串里的反斜杠本身要转义，SQLite 不需要，
 * 同一条 SQL 在两种数据库里含义不同；用 ! 则两边一致。
 */
export const LIKE_ESCAPE = '!'

/** 转义 LIKE 中的通配符，配合 `like ... escape '!'` 使用，让用户输入的 % 和 _ 按字面匹配 */
export function escapeLike(keyword: string): string {
  return keyword.replace(/[!%_]/g, char => `${LIKE_ESCAPE}${char}`)
}
