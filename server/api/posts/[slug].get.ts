import { posts } from '../../mock/posts'

/** GET /api/posts/:slug：返回文章详情与上下篇，slug 不存在时返回 40400 */
export default defineEventHandler((event) => {
  const slug = getRouterParam(event, 'slug')
  const post = posts.find(item => item.slug === slug)
  if (!post) return fail(event, ErrorCode.NOT_FOUND, '文章不存在')

  // 按发布时间正序排列，prev 是更早的一篇，next 是更晚的一篇
  const timeline = [...posts].sort((a, b) => a.publishedAt.localeCompare(b.publishedAt))
  const index = timeline.findIndex(item => item.slug === slug)
  const brief = (item?: typeof post) => (item ? { slug: item.slug, title: item.title } : null)

  const { isTop: _isTop, ...rest } = post
  const detail: PostDetail = { ...rest, prev: brief(timeline[index - 1]), next: brief(timeline[index + 1]) }
  return ok(detail)
})
