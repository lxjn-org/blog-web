/** 个人资料样例，对应 GET /api/profile */
export const profile: Profile = {
  name: 'LY',
  title: '全栈开发工程师',
  avatar: '',
  city: '深圳',
  years: 6,
  homeIntro: '专注 Web 前端与 Node.js，也喜欢写小工具和折腾硬件。',
  aboutMd: '你好，我是 LY。\n\n这里记录我做过的项目、写过的文章和踩过的坑。',
  contacts: [
    { type: 'github', label: 'GitHub', value: 'https://github.com/' },
    { type: 'email', label: '邮箱', value: 'hello@example.com' },
    { type: 'rss', label: 'RSS', value: '/rss.xml' },
  ],
}
