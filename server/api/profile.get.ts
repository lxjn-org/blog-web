import { getUserProfile } from '../repositories/profile.repository'

/**
 * GET /api/profile：读取用户信息
 * 返回用户基本信息（name、title、avatar 等）与联系方式列表
 */
export default defineEventHandler(async () => {
  const profile = await getUserProfile()

  if (!profile) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Profile not found',
    })
  }

  return ok(profile)
})
