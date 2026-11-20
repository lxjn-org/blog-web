/**
 * 数据库连接管理：全局只维护一个连接，负责启动连接、配置热重载与状态记录。
 *
 * 设计原则：任何数据库问题都不让服务退出。
 * - 连接失败时记录原因，接口通过 getDb() 拿到 DbUnavailableError，返回 50000；
 * - 已有可用连接时，新配置连不上则继续使用旧连接；
 * - 未就绪时，后续请求会定期自动重试（例如管理端稍后才初始化好数据库）。
 *
 * 状态挂在 globalThis 上，开发环境热更新重新执行模块时不会重复建立连接和监听。
 */
import { unwatchFile, watchFile } from 'node:fs'
import type { Kysely } from 'kysely'
import databaseVersion from '../../database/version.json'
import { DbUnavailableError } from '../utils/errors'
import { describeConfig, loadDbConfig } from './config'
import { checkSchema, createKysely } from './connect'
import type { Database } from './types'
import { formatVersion, syncWebVersion } from './version'

/** 用户端代码要求的最低数据库版本。 */
export const REQUIRED_SCHEMA_VERSION = databaseVersion.version

/** 配置文件轮询间隔（毫秒）：用轮询而非 fs.watch，文件不存在、被替换时也能可靠感知 */
const WATCH_INTERVAL = 2000
/** 配置文件变化后的等待时间（毫秒）：避开编辑器连续写入时读到半个文件 */
const RELOAD_DELAY = 500
/** 未就绪时自动重试的最小间隔（毫秒） */
const RETRY_INTERVAL = 10_000
/** 连接就绪后定期核对用户端版本。 */
const VERSION_SYNC_INTERVAL = 60_000

/** 对外暴露的连接状态，便于日志与以后的状态接口使用；不含密码 */
export interface DbStatus {
  ready: boolean
  /** 当前连接描述，如 sqlite /path/blog.db */
  target: string | null
  /** 配置来源：配置文件 / 默认 SQLite */
  source: 'file' | 'default' | null
  schemaVersion: number | null
  /** 最近一次连接或重载失败的原因 */
  error: string | null
  /** 状态最近一次变化的时间 */
  updatedAt: string
}

interface ManagerState {
  db: Kysely<Database> | null
  status: DbStatus
  /** 正在进行的重载，保证同一时间只有一次重载 */
  reloading: Promise<void> | null
  syncingVersion?: Promise<void>
  lastVersionSyncAt?: number
  lastAttemptAt: number
  watchedPath: string | null
  reloadTimer: ReturnType<typeof setTimeout> | null
}

const GLOBAL_KEY = '__blogDbManager'
const globalStore = globalThis as typeof globalThis & { [GLOBAL_KEY]?: ManagerState }

/** 取全局唯一的管理器状态，不存在时初始化 */
function state(): ManagerState {
  globalStore[GLOBAL_KEY] ??= {
    db: null,
    status: { ready: false, target: null, source: null, schemaVersion: null, error: '尚未连接', updatedAt: new Date().toISOString() },
    reloading: null,
    lastAttemptAt: 0,
    watchedPath: null,
    reloadTimer: null,
  }
  return globalStore[GLOBAL_KEY]
}

/** 更新状态并记录时间 */
function setStatus(patch: Partial<DbStatus>) {
  const s = state()
  s.status = { ...s.status, ...patch, updatedAt: new Date().toISOString() }
}

/** 安全关闭一个连接，关闭失败只记日志 */
async function closeQuietly(db: Kysely<Database>) {
  try {
    await db.destroy()
  }
  catch (error) {
    console.warn('[db] 关闭旧连接失败：', (error as Error).message)
  }
}

/** 尝试登记用户端版本，失败后留给下一轮同步处理。 */
async function registerWebVersion(db: Kysely<Database>) {
  try {
    await syncWebVersion(db)
  }
  catch (error) {
    console.warn('[db] 用户端版本同步失败：', (error as Error).message)
  }
}

/** 定期重试未就绪的目标数据库，并核对已连接数据库中的用户端版本。 */
export async function maintainDatabase() {
  const s = state()
  if (s.reloading) return
  if (!s.db || s.status.error) {
    await reloadDatabase()
    return
  }
  if (s.syncingVersion || Date.now() - (s.lastVersionSyncAt ?? 0) < VERSION_SYNC_INTERVAL) return

  s.lastVersionSyncAt = Date.now()
  s.syncingVersion = registerWebVersion(s.db)
  try {
    await s.syncingVersion
  }
  finally {
    s.syncingVersion = undefined
  }
}

/**
 * 读取最新配置并尝试连接；成功后替换当前连接，失败时保留原连接。
 * 并发调用会合并为同一次重载。
 */
export function reloadDatabase(): Promise<void> {
  const s = state()
  s.reloading ??= doReload().finally(() => {
    s.reloading = null
  })
  return s.reloading
}

/** 重载的具体步骤，由 reloadDatabase 串行调用 */
async function doReload() {
  const s = state()
  s.lastAttemptAt = Date.now()

  const { config, source, configPath, warning } = loadDbConfig()
  if (warning) console.warn(`[db] 配置文件 ${configPath} 有误，改用默认 SQLite：${warning}`)
  const target = describeConfig(config)

  let next: Kysely<Database> | null = null
  try {
    next = createKysely(config)
    const schemaVersion = await checkSchema(next)
    if (schemaVersion < REQUIRED_SCHEMA_VERSION) {
      throw new Error(`数据库当前版本 ${formatVersion(schemaVersion)} 低于要求的 ${formatVersion(REQUIRED_SCHEMA_VERSION)}，请通过管理端完成初始化或升级`)
    }

    await registerWebVersion(next)
    s.lastVersionSyncAt = Date.now()
    await s.syncingVersion
    const previous = s.db
    s.db = next
    setStatus({ ready: true, target, source, schemaVersion, error: null })
    console.info(`[db] 已连接 ${target}（表结构版本 ${formatVersion(schemaVersion)}）`)
    if (previous) await closeQuietly(previous)
  }
  catch (error) {
    if (next) await closeQuietly(next)
    const reason = humanize(error, config.type === 'sqlite' ? config.filename : null)
    if (s.db) {
      // 已有可用连接：继续使用旧连接，只记录这次失败
      setStatus({ error: `新配置连接失败，继续使用原连接：${reason}` })
      console.error(`[db] 新配置 ${target} 连接失败，继续使用原连接：${reason}`)
    }
    else {
      setStatus({ ready: false, target, source, schemaVersion: null, error: reason })
      console.error(`[db] 连接 ${target} 失败：${reason}`)
    }
  }
}

/** 把常见的底层错误转成便于排查的中文说明 */
function humanize(error: unknown, sqliteFile: string | null): string {
  const err = error as NodeJS.ErrnoException & { code?: string }
  if (sqliteFile && (err.code === 'SQLITE_CANTOPEN' || /does not exist/i.test(err.message))) {
    return `SQLite 数据库文件不存在：${sqliteFile}，请先通过管理端初始化`
  }
  if (err.code === 'ECONNREFUSED') return '数据库拒绝连接，请检查地址、端口和服务是否启动'
  if (err.code === 'ER_ACCESS_DENIED_ERROR') return '数据库用户名或密码错误'
  if (err.code === 'ER_BAD_DB_ERROR') return '数据库不存在，请先创建'
  return err.message
}

/**
 * 取当前数据库连接，供仓储层使用。
 * 未就绪时抛出 DbUnavailableError，并按间隔在后台重试连接。
 */
export function getDb(): Kysely<Database> {
  const s = state()
  if (s.db) return s.db

  if (!s.reloading && Date.now() - s.lastAttemptAt > RETRY_INTERVAL) {
    void reloadDatabase()
  }
  throw new DbUnavailableError(s.status.error ?? '数据库未连接')
}

/** 当前连接状态（副本） */
export function getDbStatus(): DbStatus {
  return { ...state().status }
}

/** 开始监听配置文件，变化后延迟重载；重复调用不会重复监听 */
export function watchDbConfig(configPath: string) {
  const s = state()
  if (s.watchedPath === configPath) return
  if (s.watchedPath) unwatchFile(s.watchedPath)

  s.watchedPath = configPath
  watchFile(configPath, { interval: WATCH_INTERVAL }, (curr, prev) => {
    // 修改时间和大小都没变，说明只是被访问，不需要重载
    if (curr.mtimeMs === prev.mtimeMs && curr.size === prev.size) return
    if (s.reloadTimer) clearTimeout(s.reloadTimer)
    // 连接过程中发生的配置变更，在本次连接结束后再处理。
    s.reloadTimer = setTimeout(async () => {
      s.reloadTimer = null
      await s.reloading
      if (s.watchedPath !== configPath) return
      console.info(`[db] 检测到配置文件变化：${configPath}`)
      await reloadDatabase()
    }, RELOAD_DELAY)
  })
}

/** 停止监听并关闭连接，服务关闭时调用 */
export async function shutdownDatabase() {
  const s = state()
  if (s.watchedPath) unwatchFile(s.watchedPath)
  if (s.reloadTimer) clearTimeout(s.reloadTimer)
  s.watchedPath = null
  s.reloadTimer = null
  await s.reloading
  await s.syncingVersion
  if (s.db) {
    const db = s.db
    s.db = null
    setStatus({ ready: false, error: '服务已关闭' })
    await closeQuietly(db)
  }
}
