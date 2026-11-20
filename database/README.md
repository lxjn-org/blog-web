# 数据库表结构文档

个人网站（用户端 blog-web、管理端 blog-admin）共用一个数据库。本文档是表结构的唯一说明，管理端开发时基于本文档增改；改表时同步修改本文档、两份建表脚本，并增加表结构版本号。

| 文件 | 用途 |
| --- | --- |
| `schema.sqlite.sql` | SQLite 建表脚本（默认数据库） |
| `schema.mysql.sql` | MySQL 8.0.16+ 建表脚本，与 SQLite 版字段一一对应 |
| `seed.sql` | 样例数据，两种数据库通用，仅用于开发和首次体验 |
| `version.json` | 当前建表脚本对应的目标数据库版本 |

> 表结构的初始化与升级最终由管理端负责，用户端只读写数据、不建表。管理端项目建好后，这几个文件迁移过去维护。

## 通用约定

| 项 | 约定 |
| --- | --- |
| 命名 | 表名、字段名小写下划线（`published_at`），表名用单数；接口层再转成小驼峰 |
| 主键 | 自增整数 `id`；关联表用联合主键 |
| 时间 | UTC 的 ISO 8601 字符串，固定格式 `YYYY-MM-DDTHH:mm:ss.sssZ`（如 `2026-11-01T02:00:00.000Z`）。两种数据库都用字符串存储，排序和比较行为一致；接口返回时按站点时区转成带偏移的时间（如 `+08:00`） |
| 时间写入 | 不依赖数据库默认值，由程序写入，`created_at`、`updated_at` 必填 |
| 布尔 | 整数 0 / 1（MySQL 为 `TINYINT(1)`） |
| 数组 / 对象 | JSON 文本，如 `["Vue","Nuxt"]`；读出后由程序解析 |
| 枚举 | 字符串 + `CHECK` 约束，可选值见各表说明 |
| 排序 | `sort_order` 升序，相同时按 `id` 升序 |
| 敏感数据 | 密码、令牌、验证码、API Key 只存哈希；第三方密钥（对象存储、AI、人机验证）加密后保存，接口不回传明文 |
| 字符集 | MySQL 使用 `utf8mb4` / `utf8mb4_unicode_ci` |

## 表一览

| 表 | 说明 | 用户端 | 管理端 |
| --- | --- | --- | --- |
| [component_version](#component_version) | 模块的当前版本与最新版本 | 读数据库版本，写用户端版本 | 读写 |
| [setting](#setting) | 站点设置（键值） | 读 | 读写 |
| [profile](#profile) | 个人资料（单行） | 读 | 读写 |
| [contact](#contact) | 联系方式 | 读 | 读写 |
| [skill_group](#skill_group) / [skill](#skill) | 技术栈 | 读 | 读写 |
| [experience](#experience) | 工作经历 | 读 | 读写 |
| [category](#category) / [tag](#tag) | 文章分类、标签 | 读 | 读写 |
| [post](#post) / [post_tag](#post_tag) | 文章及标签关联 | 读，写 `views` | 读写 |
| [project](#project) | 项目 | 读 | 读写 |
| [friend_link](#friend_link) | 友链与友链申请 | 读，写申请 | 读写 |
| [comment](#comment) | 留言与评论 | 读，写留言 | 读写 |
| [visit_log](#visit_log) | 访问记录 | 写 | 读 |
| [admin_user](#admin_user) | 管理员账号 | — | 读写 |
| [user_oauth](#user_oauth) | 第三方登录绑定 | — | 读写 |
| [auth_token](#auth_token) | 刷新令牌 | — | 读写 |
| [login_log](#login_log) | 登录日志 | — | 读写 |
| [verify_code](#verify_code) | 验证码 | — | 读写 |
| [api_key](#api_key) | 开发者 API Key | — | 读写 |
| [storage_repo](#storage_repo) / [file](#file) | 存储仓库与上传文件 | — | 读写 |
| [ai_provider](#ai_provider) | AI 服务商 | — | 读写 |
| [backup](#backup) | 备份记录 | — | 读写 |

## 关系

```
category 1 ── n post n ── n tag            （经 post_tag）
post     1 ── n comment（post_id 为空 = 留言板）
post     1 ── n project（项目复盘文章，可空）
skill_group 1 ── n skill
admin_user  1 ── n user_oauth / auth_token / login_log
storage_repo 1 ── n file
```

删除规则：删除分类时若仍有文章则拒绝（`RESTRICT`）；删除文章时一并删除其标签关联和评论，关联项目的 `post_id` 置空；删除技术栈分组时一并删除其条目。

---

## 系统

### component_version

每个模块一行。版本号由大版本、发版号和小修改号组成，每段最多三位。计算方式为 `大版本 × 1000000 + 发版号 × 1000 + 小修改号`，例如 `v1.0.1` 存为 `1000001`。同批发布的模块通常共享大版本和发版号。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | 整数 | 是 | 自增主键 |
| module | 整数 | 是 | 唯一。0 数据库、1 用户端、2 管理端 UI、3 管理端后台 |
| current_version | 整数 | 是 | 实际生效的版本，范围 0–999999999，初始为 0 |
| latest_version | 整数 | 否 | 发布渠道提供的最新版本，范围 0–999999999，初始为 NULL |
| updated_at | 时间 | 是 | 任一版本值实际变化的时间 |

管理端在数据库初始化或升级成功后更新模块 0，并读取部署的管理端 UI 和后台版本文件登记模块 2、3。用户端在数据库就绪后，从 `server/assets/version.json` 登记模块 1，启动和切库时立即检查，此后每分钟核对。最新版本由后续发布检查更新。版本记录表留待管理端开发时定义，旧数据库的 `schema_version` 仅保留为历史迁移记录。

### setting

站点设置按分组存键值。`type` 指定 `value` 的编码，用户端读不到某项或格式无效时使用程序内置的默认值。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| group_key | 文本 | 是 | 分组，与管理端设置页一致：`basic` / `look` / `footer` / `login` / `api` / `ai` |
| item_key | 文本 | 是 | 配置项，小驼峰 |
| type | 整数 | 是 | `0` 数字、`1` 字符串、`2` 布尔、`3` JSON，默认为 `1` |
| value | 文本 | 是 | 数字存 `3`，字符串原样存 `LY`，布尔存 `1` 或 `0`，JSON 存合法 JSON 文本 |
| updated_at | 时间 | 是 | 最后修改时间 |

主键 `(group_key, item_key)`。已用到的配置项：

| 分组 | 配置项 | 类型 | 默认值 | 说明 | 对应 `/api/site` 字段 |
| --- | --- | --- | --- | --- | --- |
| basic | siteName | string | `""` | 站点名 | `name` |
| basic | slogan | string | `""` | 一句话介绍 | `slogan` |
| basic | domain | string | `""` | 站点域名 | `domain` |
| basic | timezone | string | `"Asia/Shanghai"` | 时间显示所用时区（IANA 名称） | — |
| look | background | object | `{"mode":"plain","image":null,"overlay":0.7}` | 背景：`mode` 为 plain / glow / image，`overlay` 0.6–0.8 | `background` |
| look | fullPageScroll | boolean | `true` | 首页整屏滚动 | `fullPageScroll` |
| footer | copyright | string | `""` | 版权声明 | `footer.copyright` |
| footer | icp | string | `""` | 备案号 | `footer.icp` |
| footer | showAdminEntry | boolean | `false` | 页足显示后台入口 | `footer.showAdminEntry` |
| footer | friendLinkApplyEnabled | boolean | `true` | 开放友链申请 | `friendLinkApply.enabled` |
| footer | friendLinkReviewDays | number | `3` | 审核天数提示 | `friendLinkApply.reviewDays` |
| login | captchaProvider | string | `"turnstile"` | 人机验证服务商：turnstile / geetest / tencent | `captcha.provider` |
| login | captchaSiteKey | string | `""` | 人机验证公开 key | `captcha.siteKey` |
| login | captchaSecret | string | `""` | 管理端预留的加密配置。当前用户端从环境变量 `NUXT_TURNSTILE_SECRET` 读取密钥 | — |
| ai | chatEnabled | boolean | `false` | 访客 AI 问答开关（二期） | `chatEnabled` |

### visit_log

访问记录，供管理端仪表盘统计。用户端在内存里攒一批后批量写入，不保证每次访问都实时落库。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | 整数 | 是 | 主键 |
| path | 文本 | 是 | 访问的页面路径，不含查询参数 |
| post_id | 整数 | 否 | 访问文章详情页时记录文章 id |
| ip_hash | 文本 | 是 | 访客 IP 的哈希（16 位十六进制），不存原始 IP |
| user_agent | 文本 | 否 | 浏览器标识，截断到 500 字 |
| referer | 文本 | 否 | 来源页 |
| created_at | 时间 | 是 | 访问时间，有索引 |

### backup

数据库备份记录，备份文件本身存放在磁盘或存储仓库中。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | 整数 | 是 | 主键 |
| file_name | 文本 | 是 | 备份文件名 |
| size | 整数 | 是 | 文件大小（字节） |
| note | 文本 | 否 | 备注，如“升级前手动备份” |
| created_at | 时间 | 是 | 备份时间 |

## 个人资料

### profile

个人资料，只有一行，`id` 固定为 1。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | 整数 | 是 | 固定为 1 |
| name | 文本 | 是 | 名字 |
| title | 文本 | 是 | 头衔，如“全栈开发工程师” |
| avatar | 文本 | 是 | 头像地址，空串表示用名字首字代替 |
| city | 文本 | 是 | 所在城市 |
| career_start_year | 整数 | 否 | 开始工作的年份；接口返回的 `years`（工作年限）= 当前年份 − 此值，为空时返回 0 |
| home_intro | 文本 | 是 | 首页简介 |
| about_md | 长文本 | 是 | 关于页正文（Markdown） |
| updated_at | 时间 | 是 | 最后修改时间 |

### contact

联系方式，`/api/profile` 只返回 `visible = 1` 的项。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | 整数 | 是 | 主键 |
| type | 枚举 | 是 | `github` / `email` / `rss` / `custom`，决定图标 |
| label | 文本 | 是 | 显示名称 |
| value | 文本 | 是 | 链接或邮箱地址 |
| visible | 布尔 | 是 | 是否公开，默认 1 |
| sort_order | 整数 | 是 | 排序 |

### skill_group

技术栈分组（关于页按组显示）。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | 整数 | 是 | 主键 |
| name | 文本 | 是 | 分组名，如“前端” |
| sort_order | 整数 | 是 | 排序 |

### skill

技术栈条目。`home_sort` 不为空的条目显示在首页，按 `home_sort` 升序，最多取 8 个。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | 整数 | 是 | 主键 |
| group_id | 整数 | 是 | 所属分组，删除分组时级联删除 |
| name | 文本 | 是 | 技术名称 |
| mark | 文本 | 是 | 首页卡片上的缩写，如 `TS` |
| level | 枚举 | 是 | `main` 主力 / `familiar` 了解 |
| sort_order | 整数 | 是 | 组内排序 |
| home_sort | 整数 | 否 | 首页排序，为空表示不在首页显示 |
| home_category | 文本 | 是 | 首页卡片下方的小字，如“构建” |

### experience

工作经历，接口按 `start_month` 倒序返回。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | 整数 | 是 | 主键 |
| company | 文本 | 是 | 公司 |
| role | 文本 | 是 | 职位 |
| start_month | 文本 | 是 | 开始月份 `YYYY-MM` |
| end_month | 文本 | 否 | 结束月份 `YYYY-MM`，为空表示至今 |
| items | JSON 数组 | 是 | 工作内容，每项一句话 |
| tags | JSON 数组 | 是 | 相关技术 |

## 文章

### category

文章分类。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | 整数 | 是 | 主键 |
| name | 文本 | 是 | 分类名 |
| slug | 文本 | 是 | 地址标识，唯一，小写字母、数字、连字符 |
| sort_order | 整数 | 是 | 排序 |
| created_at | 时间 | 是 | 创建时间 |

### tag

文章标签。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | 整数 | 是 | 主键 |
| name | 文本 | 是 | 标签名 |
| slug | 文本 | 是 | 地址标识，唯一 |
| created_at | 时间 | 是 | 创建时间 |

### post

文章。用户端只读取 `status = 'published'` 且 `published_at` 不为空的文章。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | 整数 | 是 | 主键 |
| slug | 文本 | 是 | 地址标识，唯一，用于 `/blog/:slug` |
| title | 文本 | 是 | 标题 |
| summary | 文本 | 是 | 摘要，列表页显示 |
| content | 长文本 | 是 | 正文（Markdown） |
| cover | 文本 | 否 | 封面图地址，为空时列表不显示封面 |
| category_id | 整数 | 是 | 所属分类；分类下有文章时不能删除分类 |
| status | 枚举 | 是 | `draft` 草稿 / `published` 已发布 |
| is_top | 布尔 | 是 | 置顶，列表中排在最前 |
| read_minutes | 整数 | 是 | 预计阅读分钟数，保存时按正文字数估算（中文约 400 字 / 分钟），至少 1 |
| views | 整数 | 是 | 阅读量，用户端打开详情页时 +1（同一访客 30 分钟内只计一次） |
| published_at | 时间 | 否 | 首次发布时间；列表按它倒序，上下篇也按它排序 |
| created_at | 时间 | 是 | 创建时间 |
| updated_at | 时间 | 是 | 最后修改时间 |

### post_tag

文章与标签的多对多关联，主键 `(post_id, tag_id)`，删除文章或标签时级联删除。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| post_id | 整数 | 是 | 文章 id |
| tag_id | 整数 | 是 | 标签 id |

## 项目

### project

项目，接口按 `sort_order` 返回；首页精选取 `featured = 1` 的前 3 个。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | 整数 | 是 | 主键 |
| name | 文本 | 是 | 项目名 |
| description | 文本 | 是 | 一句话介绍 |
| cover | 文本 | 否 | 封面图地址 |
| icon | 文本 | 是 | 首页卡片图标名：web / tool / mobile / chip 等，对应前端 AppIcon |
| category | 枚举 | 是 | `web` / `tool` / `mobile` / `hw` |
| status | 枚举 | 是 | `doing` 进行中 / `maintaining` 维护中 / `done` 已完成 |
| tech_tags | JSON 数组 | 是 | 技术标签 |
| repo_url | 文本 | 否 | 源码地址 |
| demo_url | 文本 | 否 | 演示地址 |
| post_id | 整数 | 否 | “项目复盘”文章；接口返回该文章的 slug，文章未发布时返回 null |
| featured | 布尔 | 是 | 首页精选 |
| sort_order | 整数 | 是 | 排序 |
| created_at | 时间 | 是 | 创建时间 |
| updated_at | 时间 | 是 | 最后修改时间 |

## 互动

### friend_link

友情链接。访客提交的申请和已通过的友链共用一张表，按 `status` 区分；管理端也可以直接新增 `approved` 状态的友链。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | 整数 | 是 | 主键 |
| name | 文本 | 是 | 网站名称，1–30 字 |
| url | 文本 | 是 | 网站地址；同一地址处于 pending 或 approved 时不允许重复申请 |
| avatar | 文本 | 否 | 头像 / Logo 地址 |
| description | 文本 | 否 | 简介，≤ 50 字 |
| email | 文本 | 否 | 申请人邮箱，用于通知审核结果，不公开 |
| backlink_url | 文本 | 否 | 对方放置本站链接的页面 |
| status | 枚举 | 是 | `pending` 待审核 / `approved` 已通过 / `rejected` 已拒绝 |
| sort_order | 整数 | 是 | 页足显示顺序 |
| apply_ip | 文本 | 否 | 申请人 IP，用于限流（同一 IP 每小时最多 3 次） |
| review_note | 文本 | 否 | 审核备注，如拒绝原因 |
| created_at | 时间 | 是 | 申请（或创建）时间 |
| reviewed_at | 时间 | 否 | 审核时间 |

### comment

留言与评论。`post_id` 为空表示留言板留言，否则是文章评论；`parent_id` 为空表示顶层留言，否则是回复。新留言默认待审核，审核通过后才对外显示。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | 整数 | 是 | 主键 |
| post_id | 整数 | 否 | 所属文章，删除文章时级联删除 |
| parent_id | 整数 | 否 | 回复的留言，删除父留言时级联删除 |
| nickname | 文本 | 是 | 昵称 |
| email | 文本 | 否 | 邮箱，不公开，用于显示头像和接收回复通知 |
| website | 文本 | 否 | 个人网站 |
| content | 文本 | 是 | 内容（纯文本） |
| is_admin | 布尔 | 是 | 是否为站长在管理端发出的回复 |
| status | 枚举 | 是 | `pending` / `approved` / `rejected` |
| ip | 文本 | 否 | 留言者 IP，用于限流和屏蔽 |
| user_agent | 文本 | 否 | 浏览器标识 |
| created_at | 时间 | 是 | 留言时间 |

> 留言接口尚未写入接口文档，字段先按上表预留。

## 账号与安全（管理端）

### admin_user

管理员账号。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | 整数 | 是 | 主键 |
| username | 文本 | 是 | 登录名，唯一 |
| password_hash | 文本 | 是 | 密码哈希（建议 argon2id 或 bcrypt） |
| nickname | 文本 | 是 | 显示名 |
| email | 文本 | 否 | 绑定邮箱，唯一，可用于验证码登录 |
| phone | 文本 | 否 | 绑定手机号，唯一 |
| avatar | 文本 | 否 | 头像 |
| last_login_at | 时间 | 否 | 最近登录时间 |
| created_at | 时间 | 是 | 创建时间 |
| updated_at | 时间 | 是 | 最后修改时间 |

### user_oauth

第三方登录绑定，`(provider, open_id)` 唯一。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | 整数 | 是 | 主键 |
| user_id | 整数 | 是 | 管理员 id |
| provider | 文本 | 是 | 第三方平台，如 github / gitee / wechat |
| open_id | 文本 | 是 | 第三方用户标识 |
| nickname | 文本 | 否 | 第三方昵称，便于在绑定列表中辨认 |
| created_at | 时间 | 是 | 绑定时间 |

### auth_token

刷新令牌（Refresh Token）。Access Token 为短期 JWT 不落库；刷新令牌只存 SHA-256 哈希，退出登录或修改密码时写入 `revoked_at`。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | 整数 | 是 | 主键 |
| user_id | 整数 | 是 | 管理员 id |
| token_hash | 文本 | 是 | 令牌哈希，唯一 |
| user_agent | 文本 | 否 | 登录设备 |
| ip | 文本 | 否 | 登录 IP |
| expires_at | 时间 | 是 | 过期时间 |
| revoked_at | 时间 | 否 | 作废时间 |
| created_at | 时间 | 是 | 签发时间 |

### login_log

登录日志，成功和失败都记录。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | 整数 | 是 | 主键 |
| user_id | 整数 | 否 | 管理员 id，用户名不存在时为空 |
| method | 枚举 | 是 | `password` / `code` / `qr` / `oauth` / `api_key` |
| success | 布尔 | 是 | 是否成功 |
| message | 文本 | 否 | 失败原因 |
| ip | 文本 | 否 | 登录 IP |
| user_agent | 文本 | 否 | 浏览器标识 |
| created_at | 时间 | 是 | 登录时间 |

### verify_code

短信 / 邮箱验证码，只存哈希。同一目标发送间隔与有效期由管理端控制，`attempts` 超过上限后作废。扫码登录的二维码状态是短期数据，放在内存中，不建表。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | 整数 | 是 | 主键 |
| target | 文本 | 是 | 手机号或邮箱 |
| purpose | 枚举 | 是 | `login` 登录 / `bind` 绑定 / `reset` 重置密码 |
| code_hash | 文本 | 是 | 验证码哈希 |
| attempts | 整数 | 是 | 已尝试次数 |
| expires_at | 时间 | 是 | 过期时间 |
| used_at | 时间 | 否 | 使用时间 |
| created_at | 时间 | 是 | 发送时间 |

### api_key

开发者 API Key。明文只在创建时显示一次，库里只存哈希和前几位前缀。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | 整数 | 是 | 主键 |
| name | 文本 | 是 | 用途说明 |
| key_prefix | 文本 | 是 | 明文前缀，如 `sk_ab12`，用于列表中辨认 |
| key_hash | 文本 | 是 | 哈希，唯一 |
| scopes | JSON 数组 | 是 | 权限范围，如 `["posts:write"]` |
| last_used_at | 时间 | 否 | 最近使用时间 |
| expires_at | 时间 | 否 | 过期时间，为空表示长期有效 |
| revoked_at | 时间 | 否 | 作废时间 |
| created_at | 时间 | 是 | 创建时间 |

## 文件与集成（管理端）

### storage_repo

存储仓库：本地磁盘或对象存储。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | 整数 | 是 | 主键 |
| name | 文本 | 是 | 显示名称 |
| type | 枚举 | 是 | `local` / `s3` / `oss` / `cos` / `qiniu` |
| config | JSON 对象 | 是 | 连接参数（bucket、region、域名等），其中的密钥加密保存 |
| is_default | 布尔 | 是 | 默认上传位置，同时只能有一个为 1 |
| created_at | 时间 | 是 | 创建时间 |
| updated_at | 时间 | 是 | 最后修改时间 |

### file

上传的文件。文件被哪些文章、项目引用（`/api/admin/files/:id/refs`）通过在内容中搜索 `url` 实时得出，不单独建关联表。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | 整数 | 是 | 主键 |
| repo_id | 整数 | 否 | 所在存储仓库，仓库删除后置空 |
| original_name | 文本 | 是 | 原始文件名 |
| storage_key | 文本 | 是 | 在仓库中的路径 |
| url | 文本 | 是 | 访问地址 |
| mime | 文本 | 是 | 文件类型 |
| size | 整数 | 是 | 大小（字节） |
| hash | 文本 | 否 | SHA-256，用于秒传去重 |
| width / height | 整数 | 否 | 图片尺寸 |
| created_at | 时间 | 是 | 上传时间 |

### ai_provider

AI 服务商配置。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | 整数 | 是 | 主键 |
| name | 文本 | 是 | 显示名称 |
| type | 文本 | 是 | 接口类型，如 anthropic / openai-compatible |
| base_url | 文本 | 否 | 自定义接口地址 |
| api_key | 文本 | 否 | 密钥，加密保存 |
| model | 文本 | 是 | 默认模型 |
| config | JSON 对象 | 是 | 其他参数（温度、最大长度等） |
| is_default | 布尔 | 是 | 默认服务商，同时只能有一个为 1 |
| created_at | 时间 | 是 | 创建时间 |
| updated_at | 时间 | 是 | 最后修改时间 |

---

## 数据库连接配置

用户端和管理端读同一个配置文件来连接数据库，查找顺序：

1. 环境变量 `NUXT_DB_CONFIG_PATH`（对应 `nuxt.config.ts` 中的 `runtimeConfig.dbConfigPath`）
2. 为空时使用项目运行目录下的 `data/data.config`

配置文件内容为 JSON：

```json
{ "type": "sqlite", "filename": "data/blog.db" }
```

```json
{
  "type": "mysql",
  "host": "127.0.0.1",
  "port": 3306,
  "user": "blog",
  "password": "******",
  "database": "blog"
}
```

| 情况 | 用户端行为 |
| --- | --- |
| 配置文件不存在 | 使用 SQLite `data/blog.db` |
| 配置文件格式错误、字段不完整 | 记录警告，使用 SQLite `data/blog.db` |
| 配置正确但连接失败 | 记录错误，接口返回 50000，服务不退出；已有连接时继续使用旧连接 |
| SQLite 数据库文件不存在 | 不自动创建空库，接口返回 50000，提示先初始化 |
| 模块版本表缺失或数据库版本不足 | 显示维护页并定期重试，等待管理端完成初始化或升级 |
| 配置文件被修改 | 自动用新配置重新连接，成功后切换，失败则保留原连接 |

相对路径都以项目运行目录（启动服务时所在目录）为基准。`data/` 目录含数据库和密码，不提交到仓库。

## 初始化与升级

本地开发可手动初始化 SQLite，样例数据按需导入。正式环境由管理端完成初始化及版本登记。

```bash
sqlite3 data/blog.db < database/schema.sqlite.sql
sqlite3 data/blog.db < database/seed.sql
```

MySQL 手动初始化：

```bash
mysql -u root -p blog < database/schema.mysql.sql
mysql -u root -p blog < database/seed.sql
```

初始化 SQL 完成后四个模块的当前版本仍为 `0`。手动初始化时，确认建库已成功，再按 `database/version.json` 登记模块 0。当前建表脚本对应 `1000001`。将下列时间占位值换成实际 UTC 时间。

```sql
UPDATE component_version
SET current_version = 1000001, updated_at = '<实际 UTC ISO 时间>'
WHERE module = 0 AND current_version = 0;
```

旧库升级时，旧版 `schema_version` 为 1 的库先执行对应数据库的 `0002-setting-type` 脚本。已达到旧版 2 的库直接执行对应的 `1000001-component-version` 脚本。该脚本建立模块版本表并登记数据库版本 `1000001`，保留旧迁移历史与业务数据。MySQL 的 DDL 会隐式提交，升级前应备份。

以后修改表结构时，同步更新本文档、两份建表脚本和 `database/version.json`，并提供对应目标版本的升级 SQL。管理端应在初始化、切换数据库和升级时检查迁移结果，成功后才登记数据库当前版本。
