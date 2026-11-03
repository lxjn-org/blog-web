/** 文章分类样例（按后台排序） */
export const categories: Taxonomy[] = [
  { name: '前端', slug: 'frontend' },
  { name: '后端', slug: 'backend' },
  { name: '随笔', slug: 'essay' },
]

/** 文章标签样例 */
export const tags: Taxonomy[] = [
  { name: 'Vue', slug: 'vue' },
  { name: 'Nuxt', slug: 'nuxt' },
  { name: 'Node.js', slug: 'nodejs' },
  { name: 'Docker', slug: 'docker' },
]

/** 按 slug 取分类或标签，样例数据内部使用 */
function pick(list: Taxonomy[], slug: string): Taxonomy {
  return list.find(item => item.slug === slug)!
}

/** 样例文章（含正文），对应 GET /api/posts 与 GET /api/posts/:slug */
export const posts: (Omit<PostDetail, 'prev' | 'next'> & { isTop: boolean })[] = [
  {
    id: 1,
    slug: 'hello-nuxt',
    title: '用 Nuxt 重写个人网站',
    summary: '为什么从 Vue CLI 换到 Nuxt，以及 SSR 对 SEO 的帮助。',
    cover: null,
    category: pick(categories, 'frontend'),
    tags: [pick(tags, 'vue'), pick(tags, 'nuxt')],
    isTop: true,
    readMinutes: 3,
    views: 128,
    publishedAt: '2026-11-01T10:00:00+08:00',
    updatedAt: '2026-11-02T09:00:00+08:00',
    content: '## 为什么换 Nuxt\n\n搜索引擎更容易抓取服务端渲染的页面。\n\n## 技术选型\n\n### 组件库\n\nNaive UI，主题可在 TS 里配置。\n\n### 样式\n\nSCSS，颜色统一走主题变量。\n',
  },
  {
    id: 2,
    slug: 'docker-deploy-node',
    title: '用 Docker 部署 Node 服务',
    summary: '从 Dockerfile 到 docker compose 的一次完整部署记录。',
    cover: null,
    category: pick(categories, 'backend'),
    tags: [pick(tags, 'docker'), pick(tags, 'nodejs')],
    isTop: false,
    readMinutes: 5,
    views: 86,
    publishedAt: '2026-10-20T20:30:00+08:00',
    updatedAt: '2026-10-20T20:30:00+08:00',
    content: '## 编写 Dockerfile\n\n使用多阶段构建减小镜像体积。\n\n## 使用 compose\n\n把服务和数据库编排在一起。\n',
  },
  {
    id: 3,
    slug: 'year-end-2025',
    title: '2025 年终总结',
    summary: '这一年做过的项目、读过的书和一些想法。',
    cover: null,
    category: pick(categories, 'essay'),
    tags: [],
    isTop: false,
    readMinutes: 4,
    views: 230,
    publishedAt: '2025-12-31T22:00:00+08:00',
    updatedAt: '2025-12-31T22:00:00+08:00',
    content: '## 项目\n\n今年完成了三个小项目。\n\n## 读书\n\n读了十来本书。\n',
  },
]
