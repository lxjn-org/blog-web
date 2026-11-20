import { findSettingsByGroups } from '../repositories/setting.repository'
import { indexSettings, readScalarSetting } from '../utils/settings'

/** 验证解码后的背景配置，无效时返回默认背景。 */
function readBackground(background: unknown): SiteConfig['background'] {
  if (background !== null && typeof background === 'object'
    && 'mode' in background && (background.mode === 'plain' || background.mode === 'glow' || background.mode === 'image')
    && 'image' in background && (background.image === null || typeof background.image === 'string')
    && 'overlay' in background && typeof background.overlay === 'number' && Number.isFinite(background.overlay)) {
    return { mode: background.mode, image: background.image, overlay: background.overlay }
  }
  return { mode: 'plain', image: null, overlay: 0 }
}

/** 读取公开站点配置，并在配置缺失或无效时使用默认值。 */
export default defineEventHandler(async (event) => {
  const settings = indexSettings(await findSettingsByGroups(['basic', 'look', 'footer', 'login', 'ai']))
  const provider = settings.get('login.captchaProvider')
  const captchaProvider = provider === 'geetest' || provider === 'tencent' ? provider : 'turnstile'
  const captchaSiteKey = readScalarSetting(settings, 'login.captchaSiteKey', '')

  return ok<SiteConfig>({
    name: readScalarSetting(settings, 'basic.siteName', ''),
    slogan: readScalarSetting(settings, 'basic.slogan', ''),
    domain: readScalarSetting(settings, 'basic.domain', ''),
    background: readBackground(settings.get('look.background')),
    fullPageScroll: readScalarSetting(settings, 'look.fullPageScroll', false),
    footer: {
      copyright: readScalarSetting(settings, 'footer.copyright', ''),
      icp: readScalarSetting(settings, 'footer.icp', ''),
      showAdminEntry: readScalarSetting(settings, 'footer.showAdminEntry', false),
    },
    friendLinkApply: {
      enabled: readScalarSetting(settings, 'footer.friendLinkApplyEnabled', false),
      ready: captchaProvider === 'turnstile' && Boolean(captchaSiteKey.trim() && useRuntimeConfig(event).turnstileSecret),
      reviewDays: readScalarSetting(settings, 'footer.friendLinkReviewDays', 7),
    },
    captcha: { provider: captchaProvider, siteKey: captchaSiteKey },
    chatEnabled: readScalarSetting(settings, 'ai.chatEnabled', false),
  })
})
