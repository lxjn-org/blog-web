/**
 * 时间工具。数据库统一存 UTC ISO 字符串，接口返回时转成站点时区的带偏移时间，
 * 例如 2026-11-01T02:00:00.000Z → 2026-11-01T10:00:00+08:00（时区 Asia/Shanghai）。
 */

/** 当前时间的 UTC ISO 字符串，写入数据库时使用 */
export function nowIso(): string {
  return new Date().toISOString()
}

/** 按时区缓存格式化器，避免每次转换都重新创建 */
const formatters = new Map<string, Intl.DateTimeFormat>()

/** 取指定时区的格式化器；时区名非法时回退到 UTC */
function formatterOf(timeZone: string): Intl.DateTimeFormat {
  let formatter = formatters.get(timeZone)
  if (!formatter) {
    try {
      formatter = new Intl.DateTimeFormat('en-US', {
        timeZone,
        hourCycle: 'h23',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    }
    catch {
      return formatterOf('UTC')
    }
    formatters.set(timeZone, formatter)
  }
  return formatter
}

/** 把分钟数格式化为 +08:00 形式的时区偏移 */
function formatOffset(minutes: number): string {
  const sign = minutes >= 0 ? '+' : '-'
  const abs = Math.abs(minutes)
  return `${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`
}

/**
 * 把数据库中的 UTC 时间转成指定时区的 ISO 8601 字符串（带偏移，精确到秒）。
 * @param utc 数据库中的时间字符串；为空或无法解析时原样返回空串
 * @param timeZone IANA 时区名，如 Asia/Shanghai
 */
export function toZonedIso(utc: string | null | undefined, timeZone: string): string {
  if (!utc) return ''
  const date = new Date(utc)
  if (Number.isNaN(date.getTime())) return ''

  const parts = Object.fromEntries(formatterOf(timeZone).formatToParts(date).map(p => [p.type, p.value]))
  const local = `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`
  // 把“当地时间”当作 UTC 解析，与真实时间的差值就是时区偏移
  const offsetMinutes = Math.round((Date.parse(`${local}Z`) - Math.floor(date.getTime() / 1000) * 1000) / 60000)
  return `${local}${formatOffset(offsetMinutes)}`
}
