import type { EventHandlerRequest, H3Event } from 'h3'

/**
 * 接口处理函数的统一包装：handler 只需返回数据，成功时自动包装成 { code: 0, data }；
 * 抛出 AppError 时返回对应的错误码；其他异常记录日志后返回 50000，不把内部错误暴露给访客。
 *
 * @param handler 返回业务数据的处理函数
 */
export function defineApiHandler<T>(handler: (event: H3Event<EventHandlerRequest>) => T | Promise<T>) {
  return defineEventHandler(async (event): Promise<ApiResult<T> | ApiResult<null>> => {
    try {
      return ok(await handler(event))
    }
    catch (error) {
      if (error instanceof DbUnavailableError) {
        console.error(`[api] ${event.method} ${event.path} 数据库不可用：${error.reason}`)
        return fail(event, error.code, error.message)
      }
      if (error instanceof AppError) {
        return fail(event, error.code, error.message)
      }
      console.error(`[api] ${event.method} ${event.path} 处理失败：`, error)
      return fail(event, ErrorCode.SERVER_ERROR, '服务器内部错误')
    }
  })
}
