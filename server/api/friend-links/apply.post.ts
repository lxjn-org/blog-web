import { insertFriendLink } from '../../repositories/friend-link.repository'
import { findSettingsByGroups } from '../../repositories/setting.repository'
import { indexSettings, readScalarSetting } from '../../utils/settings'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** 读取并去除表单字段两端的空白。 */
function field(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

/** 校验数据库允许长度内的 HTTP 或 HTTPS 地址。 */
function isWebUrl(value: string): boolean {
  if (value.length > 500 || !/^https?:\/\/\S+$/i.test(value)) return false
  try {
    const url = new URL(value)
    return Boolean(url.hostname) && !url.username && !url.password
  }
  catch {
    return false
  }
}

/** 调用 Turnstile 服务端接口验证一次性票据。 */
async function verifyTurnstile(token: string, secret: string): Promise<boolean> {
  try {
    const result = await $fetch<{ success: boolean }>('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: { secret, response: token },
      timeout: 5000,
    })
    return result.success === true
  }
  catch {
    return false
  }
}

/** 校验友链申请及人机验证票据，并持久化待审核记录。 */
export default defineEventHandler(async (event) => {
  const settings = indexSettings(await findSettingsByGroups(['footer', 'login']))
  const provider = readScalarSetting(settings, 'login.captchaProvider', 'turnstile')
  const runtime = useRuntimeConfig(event)
  const secret = runtime.turnstileSecret
  const siteKey = readScalarSetting(settings, 'login.captchaSiteKey', '').trim()
  if (!readScalarSetting(settings, 'footer.friendLinkApplyEnabled', false) || provider !== 'turnstile' || !siteKey || !secret) {
    return fail(event, ErrorCode.FORBIDDEN, '暂未开放友链申请')
  }

  const body = await readBody<Partial<FriendLinkApply>>(event)
  const name = field(body?.name)
  const url = field(body?.url)
  const avatar = field(body?.avatar)
  const description = field(body?.description)
  const email = field(body?.email)
  const backlinkUrl = field(body?.backlinkUrl)
  const token = field(body?.captchaToken)
  if (name.length < 1 || name.length > 30) return fail(event, ErrorCode.BAD_REQUEST, '网站名称需为 1–30 字')
  if (!isWebUrl(url) || (avatar && !isWebUrl(avatar)) || (backlinkUrl && !isWebUrl(backlinkUrl))) {
    return fail(event, ErrorCode.BAD_REQUEST, '请输入有效的 HTTP 或 HTTPS 地址')
  }
  if (description.length > 50) return fail(event, ErrorCode.BAD_REQUEST, '简介不能超过 50 字')
  if (email.length > 200 || !EMAIL_RE.test(email)) return fail(event, ErrorCode.BAD_REQUEST, '邮箱格式不正确')
  if (!token || token.length > 2048 || !await verifyTurnstile(token, secret)) {
    return fail(event, ErrorCode.CAPTCHA_FAILED, '人机验证未通过')
  }

  const ip = runtime.trustProxy ? getClientIp(event) : (getRequestIP(event) ?? 'unknown')
  const result = await insertFriendLink({
    name, url, email, avatar: avatar || null, description: description || null,
    backlink_url: backlinkUrl || null,
    apply_ip: hashIp(ip),
    review_note: null,
    reviewed_at: null,
  })
  if (result.code === 'closed') return fail(event, ErrorCode.FORBIDDEN, '暂未开放友链申请')
  if (result.code === 'limited') return fail(event, ErrorCode.TOO_MANY_REQUESTS, '每小时最多提交 3 次申请')
  if (result.code === 'duplicate') return fail(event, ErrorCode.CONFLICT, '该地址已申请过')
  return ok({ id: result.id, status: result.status })
})
