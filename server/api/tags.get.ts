import { findTagsWithCount } from '../repositories/post.repository'

/**
 * GET /api/tags：从数据库读取标签及已发布文章数
 * 按文章数倒序，不含文章数为 0 的标签
 */
export default defineEventHandler(async () => {
  const tags = await findTagsWithCount()
  const result = tags.map(tag => ({
    name: tag.name,
    slug: tag.slug,
    count: Number(tag.count),
  }))
  return ok(result)
})
