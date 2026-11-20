/**
 * 数据库表的 TypeScript 类型，供 Kysely 做类型检查。
 * 与 database/README.md、database/schema.*.sql 一一对应，改表时三处同步修改。
 *
 * 约定：时间字段为 UTC ISO 字符串；布尔字段为 0 / 1；JSON 字段为字符串，由仓储层解析。
 * Generated<T> 表示插入时可省略（自增主键或有默认值）。
 */
import type { Generated } from 'kysely'

/** 0 / 1 表示的布尔值 */
export type Bool = 0 | 1

export interface ComponentVersionTable {
  id: Generated<number>
  module: 0 | 1 | 2 | 3
  current_version: Generated<number>
  latest_version: number | null
  updated_at: string
}

export interface SettingTable {
  group_key: string
  item_key: string
  /** 0 数字、1 字符串、2 布尔、3 JSON */
  type: Generated<0 | 1 | 2 | 3>
  /** 按 type 编码的文本，布尔值存 0 或 1 */
  value: string
  updated_at: string
}

export interface ProfileTable {
  id: number
  name: string
  title: Generated<string>
  avatar: Generated<string>
  city: Generated<string>
  career_start_year: number | null
  home_intro: Generated<string>
  about_md: string
  updated_at: string
}

export interface ContactTable {
  id: Generated<number>
  type: ContactType
  label: string
  value: string
  visible: Generated<Bool>
  sort_order: Generated<number>
}

export interface SkillGroupTable {
  id: Generated<number>
  name: string
  sort_order: Generated<number>
}

export interface SkillTable {
  id: Generated<number>
  group_id: number
  name: string
  mark: Generated<string>
  level: Generated<SkillLevel>
  sort_order: Generated<number>
  home_sort: number | null
  home_category: Generated<string>
}

export interface ExperienceTable {
  id: Generated<number>
  company: string
  role: string
  start_month: string
  end_month: string | null
  /** JSON 数组文本 */
  items: string
  /** JSON 数组文本 */
  tags: string
}

export interface CategoryTable {
  id: Generated<number>
  name: string
  slug: string
  sort_order: Generated<number>
  created_at: string
}

export interface TagTable {
  id: Generated<number>
  name: string
  slug: string
  created_at: string
}

export type PostStatus = 'draft' | 'published'

export interface PostTable {
  id: Generated<number>
  slug: string
  title: string
  summary: Generated<string>
  content: string
  cover: string | null
  category_id: number
  status: Generated<PostStatus>
  is_top: Generated<Bool>
  read_minutes: Generated<number>
  views: Generated<number>
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface PostTagTable {
  post_id: number
  tag_id: number
}

export interface ProjectTable {
  id: Generated<number>
  name: string
  description: Generated<string>
  cover: string | null
  icon: Generated<string>
  category: ProjectCategory
  status: Generated<ProjectStatus>
  /** JSON 数组文本 */
  tech_tags: string
  repo_url: string | null
  demo_url: string | null
  post_id: number | null
  featured: Generated<Bool>
  sort_order: Generated<number>
  created_at: string
  updated_at: string
}

export type ReviewStatus = 'pending' | 'approved' | 'rejected'

export interface FriendLinkTable {
  id: Generated<number>
  name: string
  url: string
  avatar: string | null
  description: string | null
  email: string | null
  backlink_url: string | null
  status: Generated<ReviewStatus>
  sort_order: Generated<number>
  apply_ip: string | null
  review_note: string | null
  created_at: string
  reviewed_at: string | null
}

export interface CommentTable {
  id: Generated<number>
  post_id: number | null
  parent_id: number | null
  nickname: string
  email: string | null
  website: string | null
  content: string
  is_admin: Generated<Bool>
  status: Generated<ReviewStatus>
  ip: string | null
  user_agent: string | null
  created_at: string
}

export interface VisitLogTable {
  id: Generated<number>
  path: string
  post_id: number | null
  ip_hash: string
  user_agent: string | null
  referer: string | null
  created_at: string
}

/**
 * 用户端用到的表。管理端专用的表（admin_user、api_key 等）用户端不访问，这里不声明，
 * 避免误用；管理端项目自行声明完整类型。
 */
export interface Database {
  component_version: ComponentVersionTable
  setting: SettingTable
  profile: ProfileTable
  contact: ContactTable
  skill_group: SkillGroupTable
  skill: SkillTable
  experience: ExperienceTable
  category: CategoryTable
  tag: TagTable
  post: PostTable
  post_tag: PostTagTable
  project: ProjectTable
  friend_link: FriendLinkTable
  comment: CommentTable
  visit_log: VisitLogTable
}
