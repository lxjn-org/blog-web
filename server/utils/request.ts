import { createHash } from 'node:crypto'
import type { H3Event } from 'h3'

/**
 * 取访客 IP。部署在 Nginx 等反向代理之后时取 X-Forwarded-For 的第一个地址，
 * 因此反向代理必须覆盖（而不是追加）该请求头，否则访客可以伪造 IP 绕过限流。
 * @returns IP 字符串，取不到时返回 'unknown'
 */
export function getClientIp(event: H3Event): string {
  return getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
}

/**
 * 对 IP 做加盐哈希，访问记录中只保存哈希，不保存原始 IP。
 * 盐来自 runtimeConfig.ipHashSalt（环境变量 NUXT_IP_HASH_SALT）。
 * @returns 16 位十六进制字符串
 */
export function hashIp(ip: string): string {
  const salt = String(useRuntimeConfig().ipHashSalt ?? '')
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 16)
}

/** 截断过长的字符串（如 User-Agent），避免超出字段长度；空值返回 null */
export function truncate(value: string | null | undefined, max: number): string | null {
  if (!value) return null
  return value.length > max ? value.slice(0, max) : value
}
