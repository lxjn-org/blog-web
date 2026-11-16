/**
 * 业务异常。服务层发现参数不合法、资源不存在等情况时抛出，
 * 由 defineApiHandler 统一转换成 { code, message, data: null } 响应。
 */
import { ErrorCode } from './result'

export class AppError extends Error {
  /** 业务错误码，见 ErrorCode */
  readonly code: number

  /**
   * @param code 业务错误码
   * @param message 返回给前端的说明
   */
  constructor(code: number, message: string) {
    super(message)
    this.name = 'AppError'
    this.code = code
  }
}

/** 数据库未就绪（未配置、连不上或未初始化）时抛出 */
export class DbUnavailableError extends AppError {
  /** @param reason 具体原因，只写入服务端日志，不返回给访客 */
  constructor(readonly reason: string) {
    super(ErrorCode.SERVER_ERROR, '数据库暂不可用，请稍后再试')
    this.name = 'DbUnavailableError'
  }
}
