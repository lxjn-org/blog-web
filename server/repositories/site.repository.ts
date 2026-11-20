/** 站点公开配置数据访问 */
import { getDb } from '../database/manager'

/**
 * 从数据库读取所有站点设置
 * 返回按 group_key 分组的设置记录
 */
export async function getAllSettings() {
  return getDb()
    .selectFrom('setting')
    .select(['group_key', 'item_key', 'value'])
    .orderBy('group_key')
    .orderBy('item_key')
    .execute()
}

/**
 * 读取指定分组的站点设置
 * @param groupKey 分组 key（如 'basic', 'look', 'footer' 等）
 */
export function getSettingsByGroup(groupKey: string) {
  return getDb()
    .selectFrom('setting')
    .select(['item_key', 'value'])
    .where('group_key', '=', groupKey)
    .orderBy('item_key')
    .execute()
}

/**
 * 读取单个站点设置
 * @param groupKey 分组 key
 * @param itemKey 配置项 key
 */
export function getSetting(groupKey: string, itemKey: string) {
  return getDb()
    .selectFrom('setting')
    .select(['value'])
    .where('group_key', '=', groupKey)
    .where('item_key', '=', itemKey)
    .executeTakeFirst()
}
