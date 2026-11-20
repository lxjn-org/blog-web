import { findSkillGroups, findHomeSkills } from '../repositories/skill.repository'

/**
 * GET /api/skills：从数据库读取技能栈
 * home=1 返回首页前 8 个主力技术，否则按分组返回全部
 */
export default defineEventHandler(async (event) => {
  const { home } = getQuery(event)

  if (String(home) === '1') {
    const homeSkills = await findHomeSkills()
    return ok(homeSkills)
  }

  const skillGroups = await findSkillGroups()
  return ok(skillGroups)
})
