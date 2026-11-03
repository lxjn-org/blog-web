import { posts, tags } from '../mock/posts'

/** GET /api/tags：返回标签及文章数，按文章数倒序，不含文章数为 0 的标签 */
export default defineEventHandler(() => {
  const list: TaxonomyCount[] = tags
    .map(item => ({ ...item, count: posts.filter(post => post.tags.some(t => t.slug === item.slug)).length }))
    .filter(item => item.count > 0)
    .sort((a, b) => b.count - a.count)
  return ok(list)
})
