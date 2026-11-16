/** 项目（project 表）的数据访问 */
import { getDb } from '../database/manager'

export interface ProjectQuery {
  /** 项目分类，不传返回全部 */
  category?: ProjectCategory
  /** 只返回首页精选 */
  featured?: boolean
  /** 最多返回条数 */
  limit?: number
}

/**
 * 按条件读取项目，按后台排序。
 * 关联的复盘文章只在已发布时返回 slug，否则 post_slug 为 null。
 */
export function findProjects(query: ProjectQuery = {}) {
  let builder = getDb()
    .selectFrom('project')
    .leftJoin('post', join => join
      .onRef('post.id', '=', 'project.post_id')
      .on('post.status', '=', 'published'))
    .select([
      'project.id',
      'project.name',
      'project.description',
      'project.cover',
      'project.icon',
      'project.category',
      'project.status',
      'project.tech_tags',
      'project.repo_url',
      'project.demo_url',
      'project.featured',
      'post.slug as post_slug',
    ])
    .orderBy('project.sort_order')
    .orderBy('project.id')

  if (query.category) builder = builder.where('project.category', '=', query.category)
  if (query.featured) builder = builder.where('project.featured', '=', 1)
  if (query.limit) builder = builder.limit(query.limit)
  return builder.execute()
}
