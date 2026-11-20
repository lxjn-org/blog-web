/** 站点设置（setting 表）的数据访问 */
import { getDb } from '../database/manager'
import type { Selectable } from 'kysely'
import type { SettingTable } from '../database/types'

export type SettingRow = Pick<Selectable<SettingTable>, 'group_key' | 'item_key' | 'type' | 'value'>

/**
 * 读取指定分组的全部设置项。
 * @param groups 分组名列表，如 ['basic', 'look']
 */
export function findSettingsByGroups(groups: string[]): Promise<SettingRow[]> {
  return getDb()
    .selectFrom('setting')
    .select(['group_key', 'item_key', 'type', 'value'])
    .where('group_key', 'in', groups)
    .execute()
}
