import { setup } from '@css-render/vue3-ssr'

/**
 * Naive UI 服务端样式收集：渲染完成后把组件样式（带 cssr-id 的 <style>）
 * 暂存到请求上下文，再由 server/plugins/naive-styles.ts 写进 <head>，避免首屏无样式闪动。
 */
export default defineNuxtPlugin((nuxtApp) => {
  const { collect } = setup(nuxtApp.vueApp)
  nuxtApp.hook('app:rendered', () => {
    const event = nuxtApp.ssrContext?.event
    if (event) event.context.naiveStyles = collect()
  })
})
