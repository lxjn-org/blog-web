import { countPublishedPosts, findPublishedPosts, findTagsByPostIds } from '../../repositories/post.repository'
import type { PostFilter } from '../../repositories/post.repository'

/**
 * GET /api/posts：按关键词、分类、标签筛选并分页，置顶在前，其余按发布时间倒序
 * 从数据库查询已发布的文章列表
 */
export default defineEventHandler(async (event) => {
  const { q, category, tag, page, size } = getQuery(event)

  // 构建数据库过滤条件
  const filter: PostFilter = {
    keyword: String(q ?? '').trim() || undefined,
    category: String(category ?? '').trim() || undefined,
    tag: String(tag ?? '').trim() || undefined,
  }

  // 获取分页参数
  const pagination = parsePagination(page, size)

  // 查询符合条件的文章总数和分页数据
  const [total, dbPosts] = await Promise.all([
    countPublishedPosts(filter),
    findPublishedPosts(filter, pagination.offset, pagination.size),
  ])

  // 提取文章 ID 用于批量查询标签
  const postIds = dbPosts.map(p => p.id)
  const tagResults = postIds.length > 0 ? await findTagsByPostIds(postIds) : []

  // 将标签按文章 ID 分组
  const tagsByPostId = new Map<number, Array<{ name: string; slug: string }>>()
  tagResults.forEach(row => {
    if (!tagsByPostId.has(row.post_id)) {
      tagsByPostId.set(row.post_id, [])
    }
    tagsByPostId.get(row.post_id)!.push({ name: row.name, slug: row.slug })
  })

  // 转换数据库结果为 PostSummary 格式
  const list: PostSummary[] = dbPosts.map(post => ({
    id: post.id,
    slug: post.slug,
    title: post.title,
    summary: post.summary,
    cover: post.cover ?? '',
    category: {
      name: post.category_name,
      slug: post.category_slug,
    },
    tags: tagsByPostId.get(post.id) ?? [],
    isTop: post.is_top === 1,
    readMinutes: post.read_minutes,
    views: post.views,
    publishedAt: post.published_at,
  }))

  return ok(toPageResult(list, total, pagination))
})
