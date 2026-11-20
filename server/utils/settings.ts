import type { SettingRow } from '../repositories/setting.repository'

/** 按设置类型还原值，格式无效时交由调用方使用默认值。 */
export function decodeSetting({ type, value }: Pick<SettingRow, 'type' | 'value'>): unknown {
  switch (type) {
    case 0: {
      if (!/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(value.trim())) return undefined
      const number = Number(value)
      return Number.isFinite(number) ? number : undefined
    }
    case 1:
      return value
    case 2:
      if (value === '1') return true
      if (value === '0') return false
      return undefined
    case 3:
      try {
        return JSON.parse(value)
      }
      catch {
        return undefined
      }
  }
}

/** 将设置按“分组.键名”索引，并一次性解码。 */
export function indexSettings(rows: SettingRow[]): Map<string, unknown> {
  return new Map(rows.map(row => [`${row.group_key}.${row.item_key}`, decodeSetting(row)]))
}

/** 读取标量设置，缺失或类型不匹配时使用默认值。 */
export function readScalarSetting(settings: Map<string, unknown>, key: string, fallback: string): string
export function readScalarSetting(settings: Map<string, unknown>, key: string, fallback: number): number
export function readScalarSetting(settings: Map<string, unknown>, key: string, fallback: boolean): boolean
export function readScalarSetting(settings: Map<string, unknown>, key: string, fallback: string | number | boolean) {
  const value = settings.get(key)
  return typeof value === typeof fallback ? value as typeof fallback : fallback
}
