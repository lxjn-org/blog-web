import { projects } from '../mock/projects'

/** GET /api/projects：按 category 筛选；featured=1 只返回首页精选（最多 3 个） */
export default defineEventHandler((event) => {
  const { category, featured } = getQuery(event)
  let list = projects
  if (category) list = list.filter(item => item.category === category)
  if (String(featured) === '1') list = list.filter(item => item.featured).slice(0, 3)
  return ok(list)
})
