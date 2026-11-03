/** 工作经历样例（按时间倒序），对应 GET /api/experiences */
export const experiences: Experience[] = [
  {
    id: 2,
    company: '某科技公司',
    role: '高级前端工程师',
    startMonth: '2023-03',
    endMonth: null,
    items: ['负责中后台前端架构与组件库建设', '推动项目迁移到 Vue 3 + Vite'],
    tags: ['Vue 3', 'TypeScript', 'Vite'],
  },
  {
    id: 1,
    company: '某互联网公司',
    role: '前端工程师',
    startMonth: '2020-07',
    endMonth: '2023-02',
    items: ['参与电商 H5 与小程序开发', '搭建前端监控与埋点平台'],
    tags: ['Vue 2', 'Node.js', '小程序'],
  },
]
