#!/usr/bin/env node
/**
 * 初始化测试数据库：创建表结构并导入样例数据
 * 使用方式：node scripts/db-init.js
 */
import Database from 'better-sqlite3'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const dbPath = resolve(process.cwd(), 'data/blog.db')
const schemaPath = resolve(process.cwd(), 'database/schema.sqlite.sql')
const seedPath = resolve(process.cwd(), 'database/seed.sql')

console.log('📦 初始化数据库...')
console.log(`📍 数据库位置: ${dbPath}`)

try {
  // 打开数据库（如果不存在会自动创建）
  const db = new Database(dbPath)

  // 执行 schema
  console.log('📋 执行表结构...')
  const schema = readFileSync(schemaPath, 'utf8')
  db.exec(schema)

  // 执行 seed
  console.log('🌱 导入样例数据...')
  const seed = readFileSync(seedPath, 'utf8')
  db.exec(seed)

  db.close()
  console.log('✅ 数据库初始化完成！')
} catch (error) {
  console.error('❌ 初始化失败:', error.message)
  process.exit(1)
}
