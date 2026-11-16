import { posts } from '../../mock/posts'

/** GET /api/posts：按关键词、分类、标签筛选并分页，置顶在前，其余按发布时间倒序 */
export default defineEventHandler((event) => {
  const { q, category, tag, page, size } = getQuery(event)
  const keyword = String(q ?? '').trim().toLowerCase()

  const list: PostSummary[] = posts
    .filter(post => !category || post.category.slug === category)
    .filter(post => !tag || post.tags.some(t => t.slug === tag))
    .filter(post => !keyword
      || post.title.toLowerCase().includes(keyword)
      || post.summary.toLowerCase().includes(keyword)
      || post.tags.some(t => t.name.toLowerCase().includes(keyword)))
    .sort((a, b) => Number(b.isTop) - Number(a.isTop) || b.publishedAt.localeCompare(a.publishedAt))
    .map(({ content: _content, updatedAt: _updatedAt, ...summary }) => summary)

  const pagination = parsePagination(page, size)
  return ok(toPageResult(
    list.slice(pagination.offset, pagination.offset + pagination.size),
    list.length,
    pagination,
  ))
})
