import type { Kysely } from 'kysely'
import type { Database } from './types'

/** 将三段各占三位的版本整数格式化为可读版本号。 */
export function formatVersion(version: number): string {
  const major = Math.floor(version / 1_000_000)
  const release = Math.floor(version / 1_000) % 1_000
  const patch = version % 1_000
  return `v${major}.${release}.${patch}`
}

/** 读取并校验发布产物内的用户端版本号。 */
export async function readWebVersion(): Promise<number> {
  const manifest = await useStorage('assets:server').getItem<{ version: number }>('version.json')
  const version = manifest?.version
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1 || version > 999999999) {
    throw new Error('用户端版本文件缺失或版本号无效')
  }
  return version
}

/** 只在版本号发生变化时登记模块 1 的当前版本。 */
export async function syncWebVersion(db: Kysely<Database>): Promise<void> {
  const version = await readWebVersion()
  await db.updateTable('component_version')
    .set({ current_version: version, updated_at: new Date().toISOString() })
    .where('module', '=', 1)
    .where('current_version', '!=', version)
    .execute()
}
