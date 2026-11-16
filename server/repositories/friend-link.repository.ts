/** 友情链接（friend_link 表）的数据访问 */
import { getDb } from '../database/manager'
import type { Insertable } from 'kysely'
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
export async function existsActiveFriendLink(url: string): Promise<boolean> {
  const row = await getDb()
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
export async function countApplicationsByIp(ip: string, since: string): Promise<number> {
  const row = await getDb()
    .selectFrom('friend_link')
    .select(eb => eb.fn.count<number>('id').as('total'))
    .where('apply_ip', '=', ip)
    .where('created_at', '>=', since)
    .executeTakeFirst()
  return Number(row?.total ?? 0)
}

/** 新增一条友链申请 */
export async function insertFriendLink(row: Insertable<FriendLinkTable>): Promise<void> {
  await getDb().insertInto('friend_link').values(row).execute()
}
