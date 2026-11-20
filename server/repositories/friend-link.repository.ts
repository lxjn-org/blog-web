/** 友情链接（friend_link 表）的数据访问 */
import { decodeSetting } from '../utils/settings'
import { getDb } from '../database/manager'
import type { Insertable, Kysely } from 'kysely'
import type { Database } from '../database/types'
import type { FriendLinkTable } from '../database/types'

/** 读取已通过的友链，按后台排序 */
export function findApprovedFriendLinks() {
  return getDb()
    .selectFrom('friend_link')
    .select(['id', 'name', 'url', 'avatar', 'description'])
    .where('status', '=', 'approved')
    .orderBy('sort_order')
    .orderBy('id')
    .execute()
}

/** 判断某地址是否已有待审核或已通过的记录 */
export async function existsActiveFriendLink(url: string, db: Kysely<Database>): Promise<boolean> {
  const row = await db
    .selectFrom('friend_link')
    .select('id')
    .where('url', '=', url)
    .where('status', 'in', ['pending', 'approved'])
    .executeTakeFirst()
  return Boolean(row)
}

/**
 * 统计某 IP 在指定时间之后提交的申请数，用于限流。
 * @param since UTC ISO 时间
 */
export async function countApplicationsByIp(ip: string, since: string, db: Kysely<Database>): Promise<number> {
  const row = await db
    .selectFrom('friend_link')
    .select(eb => eb.fn.count<number>('id').as('total'))
    .where('apply_ip', '=', ip)
    .where('created_at', '>=', since)
    .executeTakeFirst()
  return Number(row?.total ?? 0)
}

/** 串行检查申请开关、重复地址和限流，并写入待审核记录。 */
export function insertFriendLink(row: Omit<Insertable<FriendLinkTable>, 'created_at'> & { apply_ip: string }) {
  // 先锁定申请开关所在行，避免并发申请同时通过检查。
  return getDb().transaction().execute(async (db) => {
    await db.updateTable('setting')
      .set(eb => ({ updated_at: eb.ref('updated_at') }))
      .where('group_key', '=', 'footer')
      .where('item_key', '=', 'friendLinkApplyEnabled')
      .execute()
    const setting = await db.selectFrom('setting').select(['type', 'value'])
      .where('group_key', '=', 'footer')
      .where('item_key', '=', 'friendLinkApplyEnabled')
      .executeTakeFirst()
    if (!setting || decodeSetting(setting) !== true) return { code: 'closed' } as const
    const now = Date.now()
    const since = new Date(now - 3600_000).toISOString()
    if (await countApplicationsByIp(row.apply_ip, since, db) >= 3) return { code: 'limited' } as const
    if (await existsActiveFriendLink(row.url, db)) return { code: 'duplicate' } as const
    const result = await db.insertInto('friend_link')
      .values({ ...row, status: 'pending', created_at: new Date(now).toISOString() })
      .executeTakeFirstOrThrow()
    return { code: 'created', id: Number(result.insertId), status: 'pending' } as const
  })
}
