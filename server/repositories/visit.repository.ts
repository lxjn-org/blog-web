/** 访问记录（visit_log 表）的数据访问 */
import type { Insertable } from 'kysely'
import { getDb } from '../database/manager'
import type { VisitLogTable } from '../database/types'

/** 单次批量插入的最大行数，避免超出数据库的参数个数上限 */
const CHUNK_SIZE = 200

/** 批量写入访问记录 */
export async function insertVisitLogs(rows: Insertable<VisitLogTable>[]): Promise<void> {
  const db = getDb()
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    await db.insertInto('visit_log').values(rows.slice(i, i + CHUNK_SIZE)).execute()
  }
}
