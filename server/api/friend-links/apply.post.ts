import { friendLinks } from '../../mock/friend-links'
import { site } from '../../mock/site'

const URL_RE = /^https?:\/\/\S+$/i
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** 样例阶段在内存里记录已申请的地址，用于模拟 40900 冲突 */
const appliedUrls = new Set<string>()

/** POST /api/friend-links/apply：校验友链申请；样例阶段不校验人机验证与限流 */
export default defineEventHandler(async (event) => {
  if (!site.friendLinkApply.enabled) return fail(event, ErrorCode.FORBIDDEN, '暂未开放友链申请')

  const body = await readBody<Partial<FriendLinkApply>>(event)
  const name = body?.name?.trim() ?? ''
  const url = body?.url?.trim() ?? ''

  if (name.length < 1 || name.length > 30) return fail(event, ErrorCode.BAD_REQUEST, 'name 长度需为 1–30 字')
  if (!URL_RE.test(url)) return fail(event, ErrorCode.BAD_REQUEST, 'url 需为 http(s) 地址')
  if (body?.avatar && !URL_RE.test(body.avatar)) return fail(event, ErrorCode.BAD_REQUEST, 'avatar 需为 http(s) 地址')
  if ((body?.description?.length ?? 0) > 50) return fail(event, ErrorCode.BAD_REQUEST, 'description 不能超过 50 字')
  if (!EMAIL_RE.test(body?.email ?? '')) return fail(event, ErrorCode.BAD_REQUEST, 'email 格式不正确')
  if (!body?.captchaToken) return fail(event, ErrorCode.CAPTCHA_FAILED, '人机验证未通过')

  if (appliedUrls.has(url) || friendLinks.some(item => item.url === url)) {
    return fail(event, ErrorCode.CONFLICT, '该地址已申请过')
  }
  appliedUrls.add(url)
  return ok(null)
})
