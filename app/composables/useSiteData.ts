/** 站点公开配置；固定 key，页头、页足、背景等多处调用只请求一次 */
export function useSiteConfig() {
  return useApi<SiteConfig>('/api/site', { key: 'site' })
}

/** 个人资料；固定 key，多处调用只请求一次 */
export function useProfile() {
  return useApi<Profile>('/api/profile', { key: 'profile' })
}

/** 首页整屏滚动当前所在屏（从 0 开始），页头据此决定是否透明 */
export function useFullPageIndex() {
  return useState('full-page-index', () => 0)
}
