import { findCategoriesWithCount } from '../repositories/post.repository'

/**
 * GET /api/categories：从数据库读取分类及其已发布文章数
 */
export default defineEventHandler(async () => {
  const categories = await findCategoriesWithCount()
  const result = categories.map(cat => ({
    name: cat.name,
    slug: cat.slug,
    count: Number(cat.count),
  }))
  return ok(result)
})
