/**
 * 按配置创建数据库连接（Kysely 实例），并检查数据库是否已初始化。
 * 新增数据库类型时只需在 createKysely 里加一个分支。
 */
import { Kysely, MysqlDialect, SqliteDialect } from 'kysely'
import SqliteDatabase from 'better-sqlite3'
import { createPool } from 'mysql2'
import type { DbConfig } from './config'
import type { Database } from './types'

/** SQLite 写锁等待时间（毫秒）：与管理端同时写入时，等待而不是立即报 database is locked */
const SQLITE_BUSY_TIMEOUT = 5000

/** 创建 SQLite 连接：文件必须已存在（用户端不建库），并开启 WAL、外键与锁等待 */
function createSqlite(filename: string): Kysely<Database> {
  const database = new SqliteDatabase(filename, { fileMustExist: true })
  database.pragma('journal_mode = WAL')
  database.pragma(`busy_timeout = ${SQLITE_BUSY_TIMEOUT}`)
  database.pragma('foreign_keys = ON')
  return new Kysely<Database>({ dialect: new SqliteDialect({ database }) })
}

/** 创建 MySQL 连接池：统一 utf8mb4，数字类型按 JS number 返回 */
function createMysql(config: Extract<DbConfig, { type: 'mysql' }>): Kysely<Database> {
  const pool = createPool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    connectionLimit: config.connectionLimit,
    charset: 'utf8mb4',
    // COUNT、SUM 等聚合结果在 MySQL 中是 DECIMAL / BIGINT，转成数字便于直接使用
    decimalNumbers: true,
    supportBigNumbers: true,
    bigNumberStrings: false,
  })
  return new Kysely<Database>({ dialect: new MysqlDialect({ pool }) })
}

/** 按配置创建 Kysely 实例；此时还未真正连接（SQLite 除外），需再调用 checkSchema 验证 */
export function createKysely(config: DbConfig): Kysely<Database> {
  return config.type === 'sqlite' ? createSqlite(config.filename) : createMysql(config)
}

/**
 * 连接数据库并读取表结构版本，用于判断连接是否可用、数据库是否已初始化。
 * @returns 当前表结构版本号
 * @throws 数据库连接失败或尚未初始化模块版本表时抛出错误
 */
export async function checkSchema(db: Kysely<Database>): Promise<number> {
  try {
    const row = await db
      .selectFrom('component_version')
      .select('current_version')
      .where('module', '=', 0)
      .executeTakeFirst()
    return row?.current_version ?? 0
  }
  catch (error) {
    const message = (error as Error).message
    // SQLite 与 MySQL 的“表不存在”报错文案不同，统一识别为未初始化
    if (/no such table|doesn't exist/i.test(message)) {
      throw new Error('数据库缺少模块版本表，请通过管理端初始化或升级')
    }
    throw error
  }
}
