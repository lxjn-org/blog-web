import { findExperiences } from '../repositories/experience.repository'

/**
 * GET /api/experiences：从数据库读取工作经历
 * 返回按时间倒序的工作经历列表
 */
export default defineEventHandler(async () => {
  const experiences = await findExperiences()
  return ok(experiences)
})
