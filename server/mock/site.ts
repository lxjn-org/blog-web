/** 站点公开配置样例，对应 GET /api/site */
export const site: SiteConfig = {
  name: 'LY 的个人网站',
  slogan: '记录开发、工具与折腾的地方',
  domain: 'example.com',
  background: { mode: 'glow', image: null, overlay: 0.7 },
  fullPageScroll: true,
  footer: { copyright: '© 2026 LY', icp: '', showAdminEntry: false },
  friendLinkApply: { enabled: true, ready: false, reviewDays: 3 },
  captcha: { provider: 'turnstile', siteKey: '' },
  chatEnabled: false,
}
