import type { UseFetchOptions } from 'nuxt/app'

/**
 * 首屏数据请求：包一层 useFetch，自动拆出 ApiResult.data，
 * code 不为 0 时抛错，交给页面的 error 处理。
 */
export function useApi<T>(url: string | (() => string), options: UseFetchOptions<ApiResult<T>, T> = {}) {
  return useFetch(url, {
    ...options,
    transform: (res: ApiResult<T>) => {
      if (res.code !== 0) throw createError({ statusCode: res.code === 40400 ? 404 : 500, statusMessage: res.message })
      return res.data
    },
  })
}

/** 事件触发的请求（如提交表单）：直接返回完整 ApiResult，由调用方按 code 处理 */
export function apiRequest<T>(url: string, options: Parameters<typeof $fetch>[1] = {}) {
  return $fetch<ApiResult<T>>(url, { ...options, ignoreResponseError: true })
}
