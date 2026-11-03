/** 把 app/plugins/naive-ssr.server.ts 收集到的 Naive UI 样式插入页面 <head> */
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:html', (html, { event }) => {
    const styles = event.context.naiveStyles as string | undefined
    if (styles) html.head.push(styles)
  })
})
