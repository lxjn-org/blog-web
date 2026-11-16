/**
 * 数据库连接配置的定位与解析。
 *
 * 查找顺序：runtimeConfig.dbConfigPath（环境变量 NUXT_DB_CONFIG_PATH）→ data/data.config。
 * 配置文件不存在、格式错误或字段不完整时，回退到默认 SQLite（data/blog.db），不抛错，
 * 保证用户端在任何配置下都能启动。相对路径以进程运行目录为基准。
 */
import { readFileSync } from 'node:fs'
import { isAbsolute, resolve } from 'node:path'

/** 默认配置文件路径（相对运行目录） */
export const DEFAULT_CONFIG_FILE = 'data/data.config'
/** 默认 SQLite 数据库文件路径（相对运行目录） */
export const DEFAULT_SQLITE_FILE = 'data/blog.db'

export interface SqliteConfig {
  type: 'sqlite'
  /** 数据库文件的绝对路径（解析后） */
  filename: string
}

export interface MysqlConfig {
  type: 'mysql'
  host: string
  port: number
  user: string
  password: string
  database: string
  /** 连接池大小，默认 5 */
  connectionLimit: number
}

export type DbConfig = SqliteConfig | MysqlConfig

/** 解析结果：source 说明配置从哪里来，warning 说明为什么回退到默认值 */
export interface ResolvedDbConfig {
  config: DbConfig
  source: 'file' | 'default'
  configPath: string
  warning: string | null
}

/** 把相对路径按运行目录解析为绝对路径 */
function fromCwd(path: string): string {
  return isAbsolute(path) ? path : resolve(process.cwd(), path)
}

/** 取配置文件的绝对路径：优先使用 runtimeConfig 中的配置，其次默认路径 */
export function resolveConfigPath(): string {
  const custom = String(useRuntimeConfig().dbConfigPath ?? '').trim()
  return fromCwd(custom || DEFAULT_CONFIG_FILE)
}

/** 默认的 SQLite 配置 */
function defaultSqlite(): SqliteConfig {
  return { type: 'sqlite', filename: fromCwd(DEFAULT_SQLITE_FILE) }
}

/** 判断值是否为非空字符串 */
function isText(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== ''
}

/**
 * 校验并规范化配置文件内容。
 * @returns 规范化后的配置；内容不合法时返回错误说明
 */
function normalize(raw: unknown): DbConfig | string {
  if (!raw || typeof raw !== 'object') return '内容不是 JSON 对象'
  const data = raw as Record<string, unknown>

  if (data.type === 'sqlite') {
    return { type: 'sqlite', filename: fromCwd(isText(data.filename) ? data.filename : DEFAULT_SQLITE_FILE) }
  }

  if (data.type === 'mysql') {
    const missing = ['host', 'user', 'database'].filter(key => !isText(data[key]))
    if (missing.length) return `MySQL 配置缺少字段：${missing.join('、')}`
    const port = Number(data.port ?? 3306)
    if (!Number.isInteger(port) || port <= 0 || port > 65535) return 'MySQL 端口不正确'
    const limit = Number(data.connectionLimit ?? 5)
    return {
      type: 'mysql',
      host: String(data.host),
      port,
      user: String(data.user),
      password: typeof data.password === 'string' ? data.password : '',
      database: String(data.database),
      connectionLimit: Number.isInteger(limit) && limit > 0 ? limit : 5,
    }
  }

  return `不支持的数据库类型：${String(data.type ?? '（未填写）')}，可选 sqlite / mysql`
}

/** 读取并解析数据库配置；任何问题都回退到默认 SQLite，并通过 warning 说明原因 */
export function loadDbConfig(): ResolvedDbConfig {
  const configPath = resolveConfigPath()

  let text: string
  try {
    text = readFileSync(configPath, 'utf8')
  }
  catch (error) {
    // 文件不存在是正常情况（使用默认 SQLite），其他读取错误需要提示
    const missing = (error as NodeJS.ErrnoException).code === 'ENOENT'
    return {
      config: defaultSqlite(),
      source: 'default',
      configPath,
      warning: missing ? null : `读取配置文件失败：${(error as Error).message}`,
    }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  }
  catch {
    return { config: defaultSqlite(), source: 'default', configPath, warning: '配置文件不是合法的 JSON' }
  }

  const result = normalize(parsed)
  if (typeof result === 'string') {
    return { config: defaultSqlite(), source: 'default', configPath, warning: result }
  }
  return { config: result, source: 'file', configPath, warning: null }
}

/** 生成不含密码的连接描述，用于日志 */
export function describeConfig(config: DbConfig): string {
  return config.type === 'sqlite'
    ? `sqlite ${config.filename}`
    : `mysql ${config.user}@${config.host}:${config.port}/${config.database}`
}
