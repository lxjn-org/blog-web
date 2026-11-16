import type { UseFetchOptions } from 'nuxt/app'

type ApiFetchOptions = Omit<UseFetchOptions<ApiResult<unknown>>, 'transform' | 'default'>

/**
 * 首屏数据请求：包一层 useFetch，自动拆出 ApiResult.data，
 * code 不为 0 时抛错，交给页面的 error 处理。
 */
export function useApi<T>(url: string | (() => string), options: ApiFetchOptions = {}) {
  return useFetch(url, {
    ...(options as object),
    transform: (res: ApiResult<T>): T => {
      if (res.code !== 0) {
        // 40400 资源不存在 → 404；50000 数据库不可用 → 503（维护页）；其余 → 500
        const statusCode = res.code === 40400 ? 404 : res.code === 50000 ? 503 : 500
        throw createError({ statusCode, message: res.message })
      }
      return res.data
    },
  })
}

/** 事件触发的请求（如提交表单）：直接返回完整 ApiResult，由调用方按 code 处理 */
export function apiRequest<T>(url: string, options: Parameters<typeof $fetch>[1] = {}) {
  return $fetch<ApiResult<T>>(url, { ...options, ignoreResponseError: true })
}
