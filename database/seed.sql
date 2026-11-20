-- =====================================================================
-- 样例数据：SQLite 与 MySQL 通用（只使用标准 INSERT 语法）
-- 在执行 schema.*.sql 之后执行，用于本地开发和首次体验；正式上线前可不导入
-- 时间均为 UTC，前端展示时按站点时区（setting.basic.timezone）转换
-- =====================================================================

-- 站点设置：0 数字，1 字符串，2 布尔，3 JSON
INSERT INTO setting (group_key, item_key, type, value, updated_at) VALUES
  ('basic',  'siteName',              1, 'LY 的个人网站',                              '2026-11-01T00:00:00.000Z'),
  ('basic',  'slogan',                1, '记录开发、工具与折腾的地方',                  '2026-11-01T00:00:00.000Z'),
  ('basic',  'domain',                1, 'example.com',                               '2026-11-01T00:00:00.000Z'),
  ('basic',  'timezone',              1, 'Asia/Shanghai',                             '2026-11-01T00:00:00.000Z'),
  ('look',   'background',            3, '{"mode":"glow","image":null,"overlay":0.7}',  '2026-11-01T00:00:00.000Z'),
  ('look',   'fullPageScroll',        2, '1',                                        '2026-11-01T00:00:00.000Z'),
  ('footer', 'copyright',             1, '© 2026 LY',                                 '2026-11-01T00:00:00.000Z'),
  ('footer', 'icp',                   1, '',                                          '2026-11-01T00:00:00.000Z'),
  ('footer', 'showAdminEntry',        2, '1',                                        '2026-11-01T00:00:00.000Z'),
  ('footer', 'friendLinkApplyEnabled',2, '1',                                        '2026-11-01T00:00:00.000Z'),
  ('footer', 'friendLinkReviewDays',  0, '3',                                           '2026-11-01T00:00:00.000Z'),
  ('login',  'captchaProvider',       1, 'turnstile',                                 '2026-11-01T00:00:00.000Z'),
  ('login',  'captchaSiteKey',        1, '',                                          '2026-11-01T00:00:00.000Z'),
  ('login',  'captchaSecret',         1, '',                                          '2026-11-01T00:00:00.000Z'),
  ('ai',     'chatEnabled',           2, '0',                                       '2026-11-01T00:00:00.000Z');

-- 个人资料与联系方式
INSERT INTO profile (id, name, title, avatar, city, career_start_year, home_intro, about_md, updated_at) VALUES
  (1, 'LY', '全栈开发工程师', '', '深圳', 2020,
   '专注 Web 前端与 Node.js，也喜欢写小工具和折腾硬件。',
   '你好，我是 LY。

这里记录我做过的项目、写过的文章和踩过的坑。',
   '2026-11-01T00:00:00.000Z');

INSERT INTO contact (id, type, label, value, visible, sort_order) VALUES
  (1, 'github', 'GitHub', 'https://github.com/',  1, 1),
  (2, 'email',  '邮箱',   'hello@example.com',    1, 2),
  (3, 'rss',    'RSS',    '/rss.xml',             1, 3);

-- 技术栈：home_sort 不为空的条目显示在首页，按 home_sort 升序
INSERT INTO skill_group (id, name, sort_order) VALUES
  (1, '前端', 1),
  (2, '后端', 2),
  (3, '工程', 3);

INSERT INTO skill (id, group_id, name, mark, level, sort_order, home_sort, home_category) VALUES
  (1,  1, 'Vue',        'V',  'main',     1, 1,    '前端'),
  (2,  1, 'TypeScript', 'TS', 'main',     2, 2,    '语言'),
  (3,  1, 'Nuxt',       'N',  'main',     3, 3,    '前端'),
  (4,  1, 'React',      'R',  'familiar', 4, NULL, ''),
  (5,  2, 'Node.js',    'JS', 'main',     1, 4,    '后端'),
  (6,  2, 'Java',       'J',  'main',     2, 5,    '后端'),
  (7,  2, 'Go',         'Go', 'familiar', 3, NULL, ''),
  (8,  2, 'MySQL',      'M',  'main',     4, 8,    '数据库'),
  (9,  3, 'Vite',       'Vi', 'main',     1, 6,    '构建'),
  (10, 3, 'Docker',     'D',  'main',     2, 7,    '部署'),
  (11, 3, 'Nginx',      'Ng', 'familiar', 3, NULL, '');

-- 工作经历：items、tags 为 JSON 数组
INSERT INTO experience (id, company, role, start_month, end_month, items, tags) VALUES
  (1, '某互联网公司', '前端工程师', '2020-07', '2023-02',
   '["参与电商 H5 与小程序开发","搭建前端监控与埋点平台"]', '["Vue 2","Node.js","小程序"]'),
  (2, '某科技公司', '高级前端工程师', '2023-03', NULL,
   '["负责中后台前端架构与组件库建设","推动项目迁移到 Vue 3 + Vite"]', '["Vue 3","TypeScript","Vite"]');

-- 文章分类、标签、文章
INSERT INTO category (id, name, slug, sort_order, created_at) VALUES
  (1, '前端', 'frontend', 1, '2025-12-01T00:00:00.000Z'),
  (2, '后端', 'backend',  2, '2025-12-01T00:00:00.000Z'),
  (3, '随笔', 'essay',    3, '2025-12-01T00:00:00.000Z');

INSERT INTO tag (id, name, slug, created_at) VALUES
  (1, 'Vue',     'vue',    '2025-12-01T00:00:00.000Z'),
  (2, 'Nuxt',    'nuxt',   '2025-12-01T00:00:00.000Z'),
  (3, 'Node.js', 'nodejs', '2025-12-01T00:00:00.000Z'),
  (4, 'Docker',  'docker', '2025-12-01T00:00:00.000Z');

INSERT INTO post (id, slug, title, summary, content, cover, category_id, status, is_top, read_minutes, views, published_at, created_at, updated_at) VALUES
  (1, 'hello-nuxt', '用 Nuxt 重写个人网站', '为什么从 Vue CLI 换到 Nuxt，以及 SSR 对 SEO 的帮助。',
   '## 为什么换 Nuxt

搜索引擎更容易抓取服务端渲染的页面。

## 技术选型

### 组件库

Naive UI，主题可在 TS 里配置。

### 样式

SCSS，颜色统一走主题变量。
',
   '/covers/hello-nuxt.svg', 1, 'published', 1, 3, 128,
   '2026-11-01T02:00:00.000Z', '2026-11-01T02:00:00.000Z', '2026-11-02T01:00:00.000Z'),
  (2, 'docker-deploy-node', '用 Docker 部署 Node 服务', '从 Dockerfile 到 docker compose 的一次完整部署记录。',
   '## 编写 Dockerfile

使用多阶段构建减小镜像体积。

## 使用 compose

把服务和数据库编排在一起。
',
   '/covers/docker-deploy-node.svg', 2, 'published', 0, 5, 86,
   '2026-10-20T12:30:00.000Z', '2026-10-20T12:30:00.000Z', '2026-10-20T12:30:00.000Z'),
  (3, 'year-end-2025', '2025 年终总结', '这一年做过的项目、读过的书和一些想法。',
   '## 项目

今年完成了三个小项目。

## 读书

读了十来本书。
',
   '/covers/year-end-2025.svg', 3, 'published', 0, 4, 230,
   '2025-12-31T14:00:00.000Z', '2025-12-31T14:00:00.000Z', '2025-12-31T14:00:00.000Z');

INSERT INTO post_tag (post_id, tag_id) VALUES
  (1, 1), (1, 2),
  (2, 4), (2, 3);

-- 项目：tech_tags 为 JSON 数组，post_id 指向“项目复盘”文章
INSERT INTO project (id, name, description, cover, icon, category, status, tech_tags, repo_url, demo_url, post_id, featured, sort_order, created_at, updated_at) VALUES
  (1, '个人网站', '基于 Nuxt 与 Naive UI 的个人网站，支持中英文与暗黑模式。', NULL, 'web', 'web', 'doing',
   '["Nuxt","Naive UI","TypeScript"]', 'https://github.com/', NULL, 1, 1, 1, '2026-11-01T00:00:00.000Z', '2026-11-01T00:00:00.000Z'),
  (2, '剪贴板同步工具', '局域网内多设备剪贴板同步的小工具。', NULL, 'tool', 'tool', 'maintaining',
   '["Go","WebSocket"]', 'https://github.com/', NULL, NULL, 1, 2, '2026-11-01T00:00:00.000Z', '2026-11-01T00:00:00.000Z'),
  (3, '桌面温湿度屏', 'ESP32 驱动的桌面温湿度显示屏，数据上报到自建服务。', NULL, 'chip', 'hw', 'done',
   '["ESP32","MQTT"]', NULL, NULL, NULL, 1, 3, '2026-11-01T00:00:00.000Z', '2026-11-01T00:00:00.000Z'),
  (4, '记账小程序', '和家人共用的简易记账小程序。', NULL, 'mobile', 'mobile', 'done',
   '["uni-app","Vue"]', NULL, NULL, NULL, 0, 4, '2026-11-01T00:00:00.000Z', '2026-11-01T00:00:00.000Z');

-- 已通过的友链
INSERT INTO friend_link (id, name, url, avatar, description, status, sort_order, created_at, reviewed_at) VALUES
  (1, 'Vue',  'https://vuejs.org', NULL, '渐进式 JavaScript 框架', 'approved', 1, '2026-11-01T00:00:00.000Z', '2026-11-01T00:00:00.000Z'),
  (2, 'Nuxt', 'https://nuxt.com',  NULL, '基于 Vue 的全栈框架',     'approved', 2, '2026-11-01T00:00:00.000Z', '2026-11-01T00:00:00.000Z');

-- 文章详情样例：包含标题目录、列表和代码块；草稿用于验证公开接口只返回已发布文章
INSERT INTO post (id, slug, title, summary, content, cover, category_id, status, is_top, read_minutes, views, published_at, created_at, updated_at) VALUES
  (4, 'sqlite-backup-notes', 'SQLite 本地备份笔记', '记录备份前的检查事项及恢复验证。',
   '## 备份前检查

- 确认数据库文件所在目录。
- 为备份选择独立的输出路径。

### 验证恢复结果

```sql
PRAGMA integrity_check;
```

在副本上检查完整性，再核对文章和友链记录。',
   NULL, 2, 'published', 0, 3, 12,
   '2026-11-03T02:00:00.000Z', '2026-11-03T02:00:00.000Z', '2026-11-04T01:00:00.000Z'),
  (5, 'private-draft-example', '未发布的样例草稿', '这篇草稿不会出现在公开接口。',
   '## 写作提纲

补充部署记录和排查过程。',
   NULL, 3, 'draft', 0, 1, 0,
   NULL, '2026-11-04T02:00:00.000Z', '2026-11-04T02:00:00.000Z');

INSERT INTO post_tag (post_id, tag_id) VALUES (4, 3), (5, 2);

-- 友链样例：公开列表仅显示已通过记录，待审核和已拒绝记录用于校验状态筛选
INSERT INTO friend_link (id, name, url, avatar, description, email, backlink_url, status, sort_order, review_note, created_at, reviewed_at) VALUES
  (3, '开发随记', 'https://notes.example.com', NULL, '记录日常开发中的问题和解决过程。', NULL, NULL,
   'approved', 3, NULL, '2026-11-02T01:00:00.000Z', '2026-11-02T03:00:00.000Z'),
  (4, '工具手记', 'https://tools.example.com', NULL, '分享实用的小工具。', 'hello@tools.example.com', 'https://tools.example.com/links',
   'pending', 0, NULL, '2026-11-03T01:00:00.000Z', NULL),
  (5, '部署笔记', 'https://deploy.example.com', NULL, '记录自托管服务的配置。', 'hello@deploy.example.com', NULL,
   'rejected', 0, '暂未找到本站链接', '2026-11-03T02:00:00.000Z', '2026-11-04T02:00:00.000Z');

-- 页足折叠测试：20 条已通过的示例友链，排在常规友链之后
INSERT INTO friend_link (name, url, status, sort_order, created_at, reviewed_at) VALUES
  ('GitHub', 'https://github.com/', 'approved', 101, '2026-11-20T00:00:00.000Z', '2026-11-20T00:00:00.000Z'),
  ('掘金', 'https://juejin.cn/', 'approved', 102, '2026-11-20T00:00:00.000Z', '2026-11-20T00:00:00.000Z'),
  ('MDN Web Docs', 'https://developer.mozilla.org/zh-CN/', 'approved', 103, '2026-11-20T00:00:00.000Z', '2026-11-20T00:00:00.000Z'),
  ('阮一峰的网络日志', 'https://www.ruanyifeng.com/blog/', 'approved', 104, '2026-11-20T00:00:00.000Z', '2026-11-20T00:00:00.000Z'),
  ('npm', 'https://www.npmjs.com/', 'approved', 105, '2026-11-20T00:00:00.000Z', '2026-11-20T00:00:00.000Z'),
  ('TypeScript 官方手册', 'https://www.typescriptlang.org/docs/', 'approved', 106, '2026-11-20T00:00:00.000Z', '2026-11-20T00:00:00.000Z'),
  ('Stack Overflow', 'https://stackoverflow.com/', 'approved', 107, '2026-11-20T00:00:00.000Z', '2026-11-20T00:00:00.000Z'),
  ('开源中国', 'https://www.oschina.net/', 'approved', 108, '2026-11-20T00:00:00.000Z', '2026-11-20T00:00:00.000Z'),
  ('Node.js', 'https://nodejs.org/zh-cn', 'approved', 109, '2026-11-20T00:00:00.000Z', '2026-11-20T00:00:00.000Z'),
  ('中国科学技术大学开源软件镜像', 'https://mirrors.ustc.edu.cn/', 'approved', 110, '2026-11-20T00:00:00.000Z', '2026-11-20T00:00:00.000Z'),
  ('Docker Documentation', 'https://docs.docker.com/', 'approved', 111, '2026-11-20T00:00:00.000Z', '2026-11-20T00:00:00.000Z'),
  ('Vite', 'https://vite.dev/', 'approved', 112, '2026-11-20T00:00:00.000Z', '2026-11-20T00:00:00.000Z'),
  ('Rust 程序设计语言中文版', 'https://rustwiki.org/zh-CN/book/', 'approved', 113, '2026-11-20T00:00:00.000Z', '2026-11-20T00:00:00.000Z'),
  ('Git Documentation', 'https://git-scm.com/doc', 'approved', 114, '2026-11-20T00:00:00.000Z', '2026-11-20T00:00:00.000Z'),
  ('少数派', 'https://sspai.com/', 'approved', 115, '2026-11-20T00:00:00.000Z', '2026-11-20T00:00:00.000Z'),
  ('Python 3 中文文档', 'https://docs.python.org/zh-cn/3/', 'approved', 116, '2026-11-20T00:00:00.000Z', '2026-11-20T00:00:00.000Z'),
  ('PostgreSQL Documentation', 'https://www.postgresql.org/docs/', 'approved', 117, '2026-11-20T00:00:00.000Z', '2026-11-20T00:00:00.000Z'),
  ('Kubernetes 中文文档', 'https://kubernetes.io/zh-cn/docs/', 'approved', 118, '2026-11-20T00:00:00.000Z', '2026-11-20T00:00:00.000Z'),
  ('Chrome for Developers', 'https://developer.chrome.com/', 'approved', 119, '2026-11-20T00:00:00.000Z', '2026-11-20T00:00:00.000Z'),
  ('Cloudflare Developer Docs', 'https://developers.cloudflare.com/', 'approved', 120, '2026-11-20T00:00:00.000Z', '2026-11-20T00:00:00.000Z');
