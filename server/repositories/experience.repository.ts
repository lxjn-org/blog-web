/** 工作经历数据访问 */
import { getDb } from '../database/manager'

/**
 * 读取全部工作经历，按时间倒序排列
 * items、tags 字段存储为 JSON 数组，需要解析返回给客户端
 */
export async function findExperiences() {
  const rows = await getDb()
    .selectFrom('experience')
    .select(['id', 'company', 'role', 'start_month', 'end_month', 'items', 'tags'])
    .orderBy('start_month', 'desc')
    .orderBy('id', 'desc')
    .execute()

  return rows.map(row => ({
    id: row.id,
    company: row.company,
    role: row.role,
    startMonth: row.start_month,
    endMonth: row.end_month,
    items: parseJsonArray(row.items),
    tags: parseJsonArray(row.tags),
  }))
}

/**
 * 解析 JSON 数组字符串，失败时返回空数组
 */
function parseJsonArray(json: string): string[] {
  try {
    const parsed = JSON.parse(json)
    return Array.isArray(parsed) ? parsed : []
  } catch (e) {
    return []
  }
}
