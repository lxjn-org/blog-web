import { homeSkills, skillGroups } from '../mock/skills'

/** GET /api/skills：home=1 返回首页前 8 个主力技术，否则按分组返回 */
export default defineEventHandler((event) => {
  const { home } = getQuery(event)
  return String(home) === '1' ? ok(homeSkills) : ok(skillGroups)
})
