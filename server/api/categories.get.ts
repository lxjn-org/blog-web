import { categories, posts } from '../mock/posts'

/** GET /api/categories：返回分类及其已发布文章数 */
export default defineEventHandler(() => {
  const list: TaxonomyCount[] = categories.map(item => ({
    ...item,
    count: posts.filter(post => post.category.slug === item.slug).length,
  }))
  return ok(list)
})
