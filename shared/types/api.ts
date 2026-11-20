/** 统一响应结构 */
export interface ApiResult<T> {
  code: number
  message: string
  data: T
}

/** 分页结果 */
export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  size: number
}

export type BackgroundMode = 'plain' | 'glow' | 'image'
export type ProjectCategory = 'web' | 'tool' | 'mobile' | 'hw'
export type ProjectStatus = 'doing' | 'maintaining' | 'done'
export type SkillLevel = 'main' | 'familiar'
export type ContactType = 'github' | 'email' | 'rss' | 'custom'

/** GET /api/site */
export interface SiteConfig {
  name: string
  slogan: string
  domain: string
  background: { mode: BackgroundMode; image: string | null; overlay: number }
  fullPageScroll: boolean
  footer: { copyright: string; icp: string; showAdminEntry: boolean }
  friendLinkApply: { enabled: boolean; ready: boolean; reviewDays: number }
  captcha: { provider: 'turnstile' | 'geetest' | 'tencent'; siteKey: string }
  chatEnabled: boolean
}

export interface Contact {
  type: ContactType
  label: string
  value: string
}

/** GET /api/profile */
export interface Profile {
  name: string
  title: string
  avatar: string
  city: string
  years: number
  homeIntro: string
  aboutMd: string
  contacts: Contact[]
}

export interface Skill {
  name: string
  mark: string
  level: SkillLevel
}

/** GET /api/skills */
export interface SkillGroup {
  group: string
  items: Skill[]
}

/** GET /api/skills?home=1 */
export interface HomeSkill {
  name: string
  mark: string
  category: string
}

/** GET /api/experiences */
export interface Experience {
  id: number
  company: string
  role: string
  startMonth: string
  endMonth: string | null
  items: string[]
  tags: string[]
}

/** GET /api/projects */
export interface Project {
  id: number
  name: string
  description: string
  cover: string | null
  icon: string
  category: ProjectCategory
  status: ProjectStatus
  techTags: string[]
  repoUrl: string | null
  demoUrl: string | null
  postSlug: string | null
  featured: boolean
}

export interface Taxonomy {
  name: string
  slug: string
}

/** GET /api/categories、/api/tags */
export interface TaxonomyCount extends Taxonomy {
  count: number
}

/** GET /api/posts 列表项 */
export interface PostSummary {
  id: number
  slug: string
  title: string
  summary: string
  cover: string | null
  category: Taxonomy
  tags: Taxonomy[]
  isTop: boolean
  readMinutes: number
  views: number
  publishedAt: string
}

/** GET /api/posts/:slug */
export interface PostDetail extends Omit<PostSummary, 'isTop'> {
  content: string
  updatedAt: string
  prev: { slug: string; title: string } | null
  next: { slug: string; title: string } | null
}

/** GET /api/friend-links */
export interface FriendLink {
  id: number
  name: string
  url: string
  avatar: string | null
  description: string | null
}

/** POST /api/friend-links/apply 请求体 */
export interface FriendLinkApply {
  name: string
  url: string
  avatar?: string
  description?: string
  email: string
  backlinkUrl?: string
  captchaToken: string
}
