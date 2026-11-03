/** 技术栈样例（按分组），对应 GET /api/skills */
export const skillGroups: SkillGroup[] = [
  {
    group: '前端',
    items: [
      { name: 'Vue', mark: 'V', level: 'main' },
      { name: 'TypeScript', mark: 'TS', level: 'main' },
      { name: 'Nuxt', mark: 'N', level: 'main' },
      { name: 'React', mark: 'R', level: 'familiar' },
    ],
  },
  {
    group: '后端',
    items: [
      { name: 'Node.js', mark: 'JS', level: 'main' },
      { name: 'Java', mark: 'J', level: 'main' },
      { name: 'Go', mark: 'Go', level: 'familiar' },
    ],
  },
  {
    group: '工程',
    items: [
      { name: 'Vite', mark: 'Vi', level: 'main' },
      { name: 'Docker', mark: 'D', level: 'main' },
      { name: 'Nginx', mark: 'Ng', level: 'familiar' },
    ],
  },
]

/** 首页展示的前 8 个主力技术，对应 GET /api/skills?home=1 */
export const homeSkills: HomeSkill[] = [
  { name: 'Vue', mark: 'V', category: '前端' },
  { name: 'TypeScript', mark: 'TS', category: '语言' },
  { name: 'Nuxt', mark: 'N', category: '前端' },
  { name: 'Node.js', mark: 'JS', category: '后端' },
  { name: 'Java', mark: 'J', category: '后端' },
  { name: 'Vite', mark: 'Vi', category: '构建' },
  { name: 'Docker', mark: 'D', category: '部署' },
  { name: 'MySQL', mark: 'M', category: '数据库' },
]
