import { findProjects } from '../repositories/project.repository'
import type { ProjectCategory } from '../../shared/types/api'

/**
 * GET /api/projects：从数据库读取项目
 * 按 category 筛选；featured=1 只返回首页精选（最多 3 个）
 */
export default defineEventHandler(async (event) => {
  const { category, featured } = getQuery(event)

  const projects = await findProjects({
    category: category ? (category as ProjectCategory) : undefined,
    featured: String(featured) === '1',
    limit: String(featured) === '1' ? 3 : undefined,
  })

  // 解析 tech_tags JSON 数组
  const result = projects.map(project => ({
    id: project.id,
    name: project.name,
    description: project.description,
    cover: project.cover,
    icon: project.icon,
    category: project.category,
    status: project.status,
    techTags: parseJsonArray(project.tech_tags),
    repoUrl: project.repo_url,
    demoUrl: project.demo_url,
    postSlug: project.post_slug,
    featured: project.featured === 1,
  }))

  return ok(result)
})

/**
 * 解析 JSON 数组字符串，失败时返回空数组
 */
function parseJsonArray(json: string): string[] {
  try {
    const parsed = JSON.parse(json)
    return Array.isArray(parsed) ? parsed : []
  } catch (e) {
    return []
  }
}
