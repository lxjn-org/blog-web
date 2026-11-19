import { getDb } from '../database/manager'

/** 接口请求、Nuxt 内部资源与静态文件不拦截 */
const STATIC_EXT = /\.(?:js|mjs|cjs|css|json|map|svg|png|jpe?g|gif|webp|avif|ico|woff2?|ttf|eot|txt|xml|pdf|zip)$/i

function isExcluded(path: string): boolean {
  return (
    path.startsWith('/api/')
    || path.startsWith('/_nuxt/')
    || path.startsWith('/__nuxt/')
    || path.startsWith('/_ipx/')
    || STATIC_EXT.test(path)
  )
}

/**
 * 数据库是否可用：不可用时 getDb() 会按 RETRY_INTERVAL 触发一次后台重连，
 * 这样即使服务启动时数据库还没就绪，管理端建好表后也能自动恢复。
 */
function isDatabaseReady(): boolean {
  try {
    getDb()
    return true
  }
  catch {
    return false
  }
}

/**
 * 检测用户的语言偏好：优先级为 Cookie > URL 路径 > Accept-Language 请求头 > 英文兜底
 * @param event Nitro 事件对象
 * @returns true 表示英文，false 表示中文
 */
function detectLanguagePreference(event: any): boolean {
  const path = event.path

  // 优先级 1：检查 URL 路径中的语言前缀
  if (path.startsWith('/en/') || path === '/en') {
    return true
  }
  if (path === '/' || path.startsWith('/')) {
    // 检查是否有明确的中文路径标记
    if (!path.includes('/en')) {
      // 优先级 2：检查 locale Cookie
      const localeCookie = getCookie(event, 'locale')
      if (localeCookie === 'en') return true
      if (localeCookie === 'zh-CN') return false

      // 优先级 3：检查 Accept-Language 请求头
      const acceptLanguage = getHeader(event, 'accept-language') || ''
      if (acceptLanguage) {
        // 如果请求头中有 en（任何 en-* 变体）且不包含 zh，倾向英文
        const hasEnglish = /\ben/i.test(acceptLanguage)
        const hasChinese = /\bzh/i.test(acceptLanguage)
        if (hasEnglish && !hasChinese) return true
        if (hasChinese) return false
      }
    }
  }

  // 优先级 4：英文兜底
  return true
}

/** 生成数据库不可用时的维护页（内联样式，不依赖 Nuxt 渲染，保证一定能输出） */
function renderMaintenance(isEnglish: boolean, isDark: boolean): string {
  const t = isEnglish
    ? {
        title: 'Under Maintenance',
        heading: 'Site Under Maintenance',
        desc: 'The site is temporarily unavailable. We will be back shortly.',
        tip: 'If this page persists, please contact the site owner.',
        refresh: 'Refresh',
      }
    : {
        title: '网站维护中',
        heading: '网站维护中',
        desc: '数据库暂时不可用，我们正在努力恢复服务，请稍后再来。',
        tip: '如长时间未恢复，请联系站长。',
        refresh: '刷新重试',
      }

  const bg = isDark ? '#101014' : '#f7f8fa'
  const card = isDark ? 'rgba(24, 24, 28, 0.86)' : 'rgba(255, 255, 255, 0.86)'
  const text1 = isDark ? '#e8e8ea' : '#303133'
  const text2 = isDark ? '#9a9aa0' : '#606266'
  const border = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(228, 231, 237, 0.8)'

  return `<!doctype html>
<html lang="${isEnglish ? 'en' : 'zh-CN'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${t.title}</title>
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
    font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", Arial, sans-serif;
    background: ${bg}; color: ${text1};
  }
  .card {
    max-width: 440px; width: calc(100% - 48px); padding: 44px 36px; text-align: center;
    background: ${card}; border: 1px solid ${border}; border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  }
  .icon { width: 52px; height: 52px; margin: 0 auto 20px; color: #409eff; }
  h1 { margin: 0 0 14px; font-size: 22px; font-weight: 600; }
  p { margin: 0 0 4px; font-size: 14px; line-height: 1.7; color: ${text2}; }
  button {
    margin-top: 26px; padding: 9px 30px; font-size: 14px; cursor: pointer;
    color: #fff; background: #409eff; border: none; border-radius: 3px;
  }
  button:hover { background: #79bbff; }
</style>
</head>
<body>
  <div class="card">
    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17v3h3l5.3-5.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-2.4 2.6-2.6z"/>
    </svg>
    <h1>${t.heading}</h1>
    <p>${t.desc}</p>
    <p>${t.tip}</p>
    <button type="button" onclick="location.reload()">${t.refresh}</button>
  </div>
</body>
</html>`
}

export default defineEventHandler((event) => {
  const path = event.path

  // 接口自身有 50000 错误码，静态资源与 Nuxt 内部资源放行
  if (isExcluded(path)) return
  if (isDatabaseReady()) return

  const isEnglish = detectLanguagePreference(event)
  const isDark = getCookie(event, 'theme') === 'dark'

  setResponseStatus(event, 503)
  setHeader(event, 'content-type', 'text/html; charset=utf-8')
  return renderMaintenance(isEnglish, isDark)
})
