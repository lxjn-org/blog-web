import type { H3Event } from 'h3'

/** 业务错误码，与接口文档“错误码”一节保持一致 */
export const ErrorCode = {
  OK: 0,
  BAD_REQUEST: 40000,
  UNAUTHORIZED: 40100,
  FORBIDDEN: 40300,
  NOT_FOUND: 40400,
  CONFLICT: 40900,
  CAPTCHA_FAILED: 42200,
  TOO_MANY_REQUESTS: 42900,
  SERVER_ERROR: 50000,
} as const

/** 业务错误码对应的 HTTP 状态码；未列出的业务错误一律返回 200 */
const httpStatusOf: Partial<Record<number, number>> = {
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.TOO_MANY_REQUESTS]: 429,
  [ErrorCode.SERVER_ERROR]: 500,
}

/** 包装成功响应 { code: 0, message: 'ok', data } */
export function ok<T>(data: T): ApiResult<T> {
  return { code: ErrorCode.OK, message: 'ok', data }
}

/** 包装失败响应，并按错误码设置对应的 HTTP 状态码 */
export function fail(event: H3Event, code: number, message: string): ApiResult<null> {
  const status = httpStatusOf[code]
  if (status) setResponseStatus(event, status)
  return { code, message, data: null }
}

/** 分页参数：page 从 1 开始；offset 供 SQL 使用 */
export interface Pagination {
  page: number
  size: number
  offset: number
}

/** 解析请求中的 page / size：page 默认 1；size 默认 10、最大 50；非法值回落到默认值 */
export function parsePagination(pageRaw: unknown, sizeRaw: unknown): Pagination {
  const page = Math.max(1, Number.parseInt(String(pageRaw ?? 1), 10) || 1)
  const size = Math.min(50, Math.max(1, Number.parseInt(String(sizeRaw ?? 10), 10) || 10))
  return { page, size, offset: (page - 1) * size }
}

/** 组装分页结果 { list, total, page, size } */
export function toPageResult<T>(list: T[], total: number, { page, size }: Pagination): PageResult<T> {
  return { list, total, page, size }
}
