/** 文章、分类、标签的数据访问。用户端只能看到已发布的文章。 */
import { sql } from 'kysely'
import type { ExpressionBuilder, SelectQueryBuilder } from 'kysely'
import { getDb } from '../database/manager'
import type { Database } from '../database/types'
import { LIKE_ESCAPE, escapeLike } from './shared'

export interface PostFilter {
  /** 搜索关键词：匹配标题、摘要、标签名 */
  keyword?: string
  /** 分类 slug */
  category?: string
  /** 标签 slug */
  tag?: string
}

type PostWithCategory = SelectQueryBuilder<Database, 'post' | 'category', object>

/** 生成 `column like '%keyword%' escape '!'` 条件，两种数据库通用 */
function likeExpr(column: string, keyword: string) {
  return sql<boolean>`${sql.ref(column)} like ${`%${escapeLike(keyword)}%`} escape ${sql.lit(LIKE_ESCAPE)}`
}

/** 已发布文章的基础查询（已连接分类表）：状态为已发布且有发布时间 */
function publishedPosts(): PostWithCategory {
  return getDb()
    .selectFrom('post')
    .innerJoin('category', 'category.id', 'post.category_id')
    .where('post.status', '=', 'published')
    .where('post.published_at', 'is not', null)
}

/** 在基础查询上叠加分类、标签、关键词筛选 */
function applyFilter(builder: PostWithCategory, filter: PostFilter): PostWithCategory {
  let query = builder
  if (filter.category) query = query.where('category.slug', '=', filter.category)

  if (filter.tag) {
    const tag = filter.tag
    query = query.where(eb => eb.exists(
      eb.selectFrom('post_tag')
        .innerJoin('tag', 'tag.id', 'post_tag.tag_id')
        .select(sql.lit(1).as('one'))
        .whereRef('post_tag.post_id', '=', 'post.id')
        .where('tag.slug', '=', tag),
    ))
  }

  if (filter.keyword) {
    const keyword = filter.keyword
    query = query.where((eb: ExpressionBuilder<Database, 'post' | 'category'>) => eb.or([
      likeExpr('post.title', keyword),
      likeExpr('post.summary', keyword),
      eb.exists(
        eb.selectFrom('post_tag')
          .innerJoin('tag', 'tag.id', 'post_tag.tag_id')
          .select(sql.lit(1).as('one'))
          .whereRef('post_tag.post_id', '=', 'post.id')
          .where(likeExpr('tag.name', keyword)),
      ),
    ]))
  }
  return query
}

/** 统计符合条件的已发布文章数 */
export async function countPublishedPosts(filter: PostFilter): Promise<number> {
  const row = await applyFilter(publishedPosts(), filter)
    .select(eb => eb.fn.count<number>('post.id').as('total'))
    .executeTakeFirst()
  return Number(row?.total ?? 0)
}

/**
 * 分页读取已发布文章（不含正文），置顶在前，其余按发布时间倒序。
 * @param offset 跳过条数
 * @param limit 读取条数
 */
export function findPublishedPosts(filter: PostFilter, offset: number, limit: number) {
  return applyFilter(publishedPosts(), filter)
    .select([
      'post.id',
      'post.slug',
      'post.title',
      'post.summary',
      'post.cover',
      'post.is_top',
      'post.read_minutes',
      'post.views',
      'post.published_at',
      'category.name as category_name',
      'category.slug as category_slug',
    ])
    .orderBy('post.is_top', 'desc')
    .orderBy('post.published_at', 'desc')
    .orderBy('post.id', 'desc')
    .offset(offset)
    .limit(limit)
    .execute()
}

/** 读取一批文章的标签，按标签 id 排序；ids 为空时直接返回空数组 */
export async function findTagsByPostIds(postIds: number[]) {
  if (!postIds.length) return []
  return getDb()
    .selectFrom('post_tag')
    .innerJoin('tag', 'tag.id', 'post_tag.tag_id')
    .select(['post_tag.post_id', 'tag.name', 'tag.slug'])
    .where('post_tag.post_id', 'in', postIds)
    .orderBy('tag.id')
    .execute()
}

/** 按 slug 读取一篇已发布文章（含正文），不存在或未发布时返回 undefined */
export function findPublishedPostBySlug(slug: string) {
  return publishedPosts()
    .select([
      'post.id',
      'post.slug',
      'post.title',
      'post.summary',
      'post.content',
      'post.cover',
      'post.read_minutes',
      'post.views',
      'post.published_at',
      'post.updated_at',
      'category.name as category_name',
      'category.slug as category_slug',
    ])
    .where('post.slug', '=', slug)
    .executeTakeFirst()
}

/**
 * 读取相邻的已发布文章。
 * @param direction prev = 更早发布的一篇，next = 更晚发布的一篇
 * @param publishedAt 当前文章的发布时间
 * @param id 当前文章 id，发布时间相同时按 id 区分先后
 */
export function findAdjacentPost(direction: 'prev' | 'next', publishedAt: string, id: number) {
  const before = direction === 'prev'
  return publishedPosts()
    .select(['post.slug', 'post.title'])
    .where(eb => eb.or([
      eb('post.published_at', before ? '<' : '>', publishedAt),
      eb.and([eb('post.published_at', '=', publishedAt), eb('post.id', before ? '<' : '>', id)]),
    ]))
    .orderBy('post.published_at', before ? 'desc' : 'asc')
    .orderBy('post.id', before ? 'desc' : 'asc')
    .limit(1)
    .executeTakeFirst()
}

/** 文章阅读量 +1 */
export async function incrementPostViews(id: number): Promise<void> {
  await getDb()
    .updateTable('post')
    .set(eb => ({ views: eb('views', '+', 1) }))
    .where('id', '=', id)
    .execute()
}

/** 按 slug 批量查文章 id（含未发布的），用于把访问记录关联到文章 */
export function findPostIdsBySlugs(slugs: string[]) {
  if (!slugs.length) return Promise.resolve([])
  return getDb()
    .selectFrom('post')
    .select(['id', 'slug'])
    .where('slug', 'in', slugs)
    .execute()
}

/** 读取全部分类及其已发布文章数，按后台排序 */
export function findCategoriesWithCount() {
  return getDb()
    .selectFrom('category')
    .leftJoin('post', join => join
      .onRef('post.category_id', '=', 'category.id')
      .on('post.status', '=', 'published')
      .on('post.published_at', 'is not', null))
    .select(eb => ['category.name', 'category.slug', eb.fn.count<number>('post.id').as('count')])
    .groupBy(['category.id', 'category.name', 'category.slug', 'category.sort_order'])
    .orderBy('category.sort_order')
    .orderBy('category.id')
    .execute()
}

/** 读取有已发布文章的标签及文章数，按文章数倒序 */
export function findTagsWithCount() {
  return getDb()
    .selectFrom('tag')
    .innerJoin('post_tag', 'post_tag.tag_id', 'tag.id')
    .innerJoin('post', 'post.id', 'post_tag.post_id')
    .where('post.status', '=', 'published')
    .where('post.published_at', 'is not', null)
    .select(eb => ['tag.name', 'tag.slug', eb.fn.count<number>('post.id').as('count')])
    .groupBy(['tag.id', 'tag.name', 'tag.slug'])
    .orderBy('count', 'desc')
    .orderBy('tag.id')
    .execute()
}
