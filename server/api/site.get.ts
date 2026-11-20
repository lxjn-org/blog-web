import { getAllSettings, getSettingsByGroup } from '../repositories/site.repository'

/**
 * GET /api/site：读取站点配置信息
 * 将数据库中的 setting 表按分组组装成前端所需的对象结构
 * 部分字段存储为 JSON 字符串，需要解析
 */
export default defineEventHandler(async () => {
  // 读取所有设置
  const allSettings = await getAllSettings()

  // 按 group_key 分组
  const grouped = new Map<string, Record<string, string>>()
  allSettings.forEach(row => {
    if (!grouped.has(row.group_key)) {
      grouped.set(row.group_key, {})
    }
    grouped.get(row.group_key)![row.item_key] = row.value
  })

  // 构建返回对象
  const basic = grouped.get('basic') ?? {}
  const look = grouped.get('look') ?? {}
  const footer = grouped.get('footer') ?? {}
  const login = grouped.get('login') ?? {}
  const ai = grouped.get('ai') ?? {}

  // 解析 JSON 字段
  let backgroundObj = { mode: 'plain' as const, image: null, overlay: 0 }
  try {
    if (look.background) {
      backgroundObj = JSON.parse(look.background)
    }
  } catch (e) {
    // JSON 解析失败，使用默认值
  }

  let captchaProvider = 'turnstile' as const
  try {
    if (login.captchaProvider) {
      captchaProvider = JSON.parse(login.captchaProvider)
    }
  } catch (e) {
    // JSON 解析失败，使用默认值
  }

  // 从 JSON 中解析 name/slogan/domain（存储时带引号的 JSON 字符串）
  const parseName = (val: string) => {
    try {
      return JSON.parse(val)
    } catch (e) {
      return val
    }
  }

  const siteConfig = {
    name: parseName(basic.siteName ?? ''),
    slogan: parseName(basic.slogan ?? ''),
    domain: parseName(basic.domain ?? ''),
    background: backgroundObj,
    fullPageScroll: look.fullPageScroll === 'true',
    footer: {
      copyright: parseName(footer.copyright ?? ''),
      icp: parseName(footer.icp ?? ''),
      showAdminEntry: footer.showAdminEntry === 'true',
    },
    friendLinkApply: {
      enabled: footer.friendLinkApplyEnabled === 'true',
      reviewDays: parseInt(footer.friendLinkReviewDays ?? '7', 10),
    },
    captcha: {
      provider: captchaProvider,
      siteKey: parseName(login.captchaSiteKey ?? ''),
    },
    chatEnabled: ai.chatEnabled === 'true',
  }

  return ok(siteConfig)
})
