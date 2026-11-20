import { findAdjacentPost, findPublishedPostBySlug, findTagsByPostIds, incrementPostViews } from '../../repositories/post.repository'

/** 读取已发布文章的详情、标签和上下篇，并记录一次阅读。 */
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug', { decode: true })
  const post = slug ? await findPublishedPostBySlug(slug) : undefined
  if (!post?.published_at) return fail(event, ErrorCode.NOT_FOUND, '文章不存在')

  const [tags, prev, next] = await Promise.all([
    findTagsByPostIds([post.id]),
    findAdjacentPost('prev', post.published_at, post.id),
    findAdjacentPost('next', post.published_at, post.id),
  ])
  await incrementPostViews(post.id)

  return ok<PostDetail>({
    id: post.id,
    slug: post.slug,
    title: post.title,
    summary: post.summary,
    content: post.content,
    cover: post.cover,
    category: { name: post.category_name, slug: post.category_slug },
    // 保留标签的公开字段。
    tags: tags.map(({ name, slug }) => ({ name, slug })),
    readMinutes: post.read_minutes,
    views: post.views + 1,
    publishedAt: post.published_at,
    updatedAt: post.updated_at,
    prev: prev ?? null,
    next: next ?? null,
  })
})
