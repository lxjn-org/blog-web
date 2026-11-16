-- =====================================================================
-- 个人网站数据库表结构（SQLite 版）
-- 版本：1
-- 说明：字段含义、取值约定见 database/README.md；MySQL 版见 schema.mysql.sql，两者保持一致。
-- 约定：
--   1. 时间统一存 UTC 的 ISO 8601 字符串，格式 YYYY-MM-DDTHH:mm:ss.sssZ，由程序写入，不依赖数据库默认值
--   2. 布尔值存 0 / 1
--   3. 数组、对象类字段存 JSON 文本
-- 执行方式：sqlite3 data/blog.db < database/schema.sqlite.sql，或 npm run db:init
-- =====================================================================

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------
-- 表结构版本：每次执行升级脚本插入一行，程序据此判断数据库是否需要升级
-- ---------------------------------------------------------------------
CREATE TABLE schema_version (
  version     INTEGER PRIMARY KEY,
  description TEXT    NOT NULL,
  applied_at  TEXT    NOT NULL
) STRICT;

-- ---------------------------------------------------------------------
-- 站点设置：按分组存键值，value 为 JSON 文本
-- ---------------------------------------------------------------------
CREATE TABLE setting (
  group_key  TEXT NOT NULL,
  item_key   TEXT NOT NULL,
  value      TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (group_key, item_key)
) STRICT;

-- ---------------------------------------------------------------------
-- 个人资料（只有一行，id 固定为 1）
-- ---------------------------------------------------------------------
CREATE TABLE profile (
  id                INTEGER PRIMARY KEY CHECK (id = 1),
  name              TEXT    NOT NULL,
  title             TEXT    NOT NULL DEFAULT '',
  avatar            TEXT    NOT NULL DEFAULT '',
  city              TEXT    NOT NULL DEFAULT '',
  career_start_year INTEGER,
  home_intro        TEXT    NOT NULL DEFAULT '',
  about_md          TEXT    NOT NULL DEFAULT '',
  updated_at        TEXT    NOT NULL
) STRICT;

-- 联系方式
CREATE TABLE contact (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  type       TEXT    NOT NULL CHECK (type IN ('github', 'email', 'rss', 'custom')),
  label      TEXT    NOT NULL,
  value      TEXT    NOT NULL,
  visible    INTEGER NOT NULL DEFAULT 1 CHECK (visible IN (0, 1)),
  sort_order INTEGER NOT NULL DEFAULT 0
) STRICT;

-- 技术栈分组
CREATE TABLE skill_group (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
) STRICT;

-- 技术栈条目
CREATE TABLE skill (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id      INTEGER NOT NULL REFERENCES skill_group (id) ON DELETE CASCADE,
  name          TEXT    NOT NULL,
  mark          TEXT    NOT NULL DEFAULT '',
  level         TEXT    NOT NULL DEFAULT 'familiar' CHECK (level IN ('main', 'familiar')),
  sort_order    INTEGER NOT NULL DEFAULT 0,
  home_sort     INTEGER,
  home_category TEXT    NOT NULL DEFAULT ''
) STRICT;
CREATE INDEX idx_skill_group ON skill (group_id, sort_order);

-- 工作经历
CREATE TABLE experience (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  company     TEXT    NOT NULL,
  role        TEXT    NOT NULL,
  start_month TEXT    NOT NULL,
  end_month   TEXT,
  items       TEXT    NOT NULL DEFAULT '[]',
  tags        TEXT    NOT NULL DEFAULT '[]'
) STRICT;

-- ---------------------------------------------------------------------
-- 文章
-- ---------------------------------------------------------------------
CREATE TABLE category (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL,
  slug       TEXT    NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT    NOT NULL
) STRICT;

CREATE TABLE tag (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL,
  slug       TEXT    NOT NULL UNIQUE,
  created_at TEXT    NOT NULL
) STRICT;

CREATE TABLE post (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  slug         TEXT    NOT NULL UNIQUE,
  title        TEXT    NOT NULL,
  summary      TEXT    NOT NULL DEFAULT '',
  content      TEXT    NOT NULL DEFAULT '',
  cover        TEXT,
  category_id  INTEGER NOT NULL REFERENCES category (id) ON DELETE RESTRICT,
  status       TEXT    NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  is_top       INTEGER NOT NULL DEFAULT 0 CHECK (is_top IN (0, 1)),
  read_minutes INTEGER NOT NULL DEFAULT 1,
  views        INTEGER NOT NULL DEFAULT 0,
  published_at TEXT,
  created_at   TEXT    NOT NULL,
  updated_at   TEXT    NOT NULL
) STRICT;
CREATE INDEX idx_post_list ON post (status, is_top, published_at);
CREATE INDEX idx_post_category ON post (category_id);

CREATE TABLE post_tag (
  post_id INTEGER NOT NULL REFERENCES post (id) ON DELETE CASCADE,
  tag_id  INTEGER NOT NULL REFERENCES tag (id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
) STRICT;
CREATE INDEX idx_post_tag_tag ON post_tag (tag_id);

-- ---------------------------------------------------------------------
-- 项目
-- ---------------------------------------------------------------------
CREATE TABLE project (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  description TEXT    NOT NULL DEFAULT '',
  cover       TEXT,
  icon        TEXT    NOT NULL DEFAULT 'web',
  category    TEXT    NOT NULL CHECK (category IN ('web', 'tool', 'mobile', 'hw')),
  status      TEXT    NOT NULL DEFAULT 'done' CHECK (status IN ('doing', 'maintaining', 'done')),
  tech_tags   TEXT    NOT NULL DEFAULT '[]',
  repo_url    TEXT,
  demo_url    TEXT,
  post_id     INTEGER REFERENCES post (id) ON DELETE SET NULL,
  featured    INTEGER NOT NULL DEFAULT 0 CHECK (featured IN (0, 1)),
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT    NOT NULL,
  updated_at  TEXT    NOT NULL
) STRICT;

-- ---------------------------------------------------------------------
-- 友情链接（申请与已通过的友链共用一张表，按 status 区分）
-- ---------------------------------------------------------------------
CREATE TABLE friend_link (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT    NOT NULL,
  url          TEXT    NOT NULL,
  avatar       TEXT,
  description  TEXT,
  email        TEXT,
  backlink_url TEXT,
  status       TEXT    NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  sort_order   INTEGER NOT NULL DEFAULT 0,
  apply_ip     TEXT,
  review_note  TEXT,
  created_at   TEXT    NOT NULL,
  reviewed_at  TEXT
) STRICT;
CREATE INDEX idx_friend_link_status ON friend_link (status, sort_order);
CREATE INDEX idx_friend_link_url ON friend_link (url);
CREATE INDEX idx_friend_link_ip ON friend_link (apply_ip, created_at);

-- ---------------------------------------------------------------------
-- 留言 / 评论：post_id 为空表示留言板留言，parent_id 为空表示顶层留言
-- ---------------------------------------------------------------------
CREATE TABLE comment (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id    INTEGER REFERENCES post (id) ON DELETE CASCADE,
  parent_id  INTEGER REFERENCES comment (id) ON DELETE CASCADE,
  nickname   TEXT    NOT NULL,
  email      TEXT,
  website    TEXT,
  content    TEXT    NOT NULL,
  is_admin   INTEGER NOT NULL DEFAULT 0 CHECK (is_admin IN (0, 1)),
  status     TEXT    NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  ip         TEXT,
  user_agent TEXT,
  created_at TEXT    NOT NULL
) STRICT;
CREATE INDEX idx_comment_post ON comment (post_id, status, created_at);
CREATE INDEX idx_comment_ip ON comment (ip, created_at);

-- ---------------------------------------------------------------------
-- 访问记录：用户端批量写入，供仪表盘统计
-- ---------------------------------------------------------------------
CREATE TABLE visit_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  path       TEXT    NOT NULL,
  post_id    INTEGER,
  ip_hash    TEXT    NOT NULL,
  user_agent TEXT,
  referer    TEXT,
  created_at TEXT    NOT NULL
) STRICT;
CREATE INDEX idx_visit_log_time ON visit_log (created_at);

-- =====================================================================
-- 以下为管理端使用的表，用户端不读写
-- =====================================================================

-- 管理员账号
CREATE TABLE admin_user (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT    NOT NULL UNIQUE,
  password_hash TEXT    NOT NULL,
  nickname      TEXT    NOT NULL DEFAULT '',
  email         TEXT    UNIQUE,
  phone         TEXT    UNIQUE,
  avatar        TEXT,
  last_login_at TEXT,
  created_at    TEXT    NOT NULL,
  updated_at    TEXT    NOT NULL
) STRICT;

-- 第三方登录绑定
CREATE TABLE user_oauth (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES admin_user (id) ON DELETE CASCADE,
  provider   TEXT    NOT NULL,
  open_id    TEXT    NOT NULL,
  nickname   TEXT,
  created_at TEXT    NOT NULL,
  UNIQUE (provider, open_id)
) STRICT;

-- 刷新令牌：只存哈希
CREATE TABLE auth_token (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES admin_user (id) ON DELETE CASCADE,
  token_hash TEXT    NOT NULL UNIQUE,
  user_agent TEXT,
  ip         TEXT,
  expires_at TEXT    NOT NULL,
  revoked_at TEXT,
  created_at TEXT    NOT NULL
) STRICT;

-- 登录日志
CREATE TABLE login_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER REFERENCES admin_user (id) ON DELETE SET NULL,
  method     TEXT    NOT NULL CHECK (method IN ('password', 'code', 'qr', 'oauth', 'api_key')),
  success    INTEGER NOT NULL CHECK (success IN (0, 1)),
  message    TEXT,
  ip         TEXT,
  user_agent TEXT,
  created_at TEXT    NOT NULL
) STRICT;
CREATE INDEX idx_login_log_user ON login_log (user_id, created_at);

-- 验证码：只存哈希
CREATE TABLE verify_code (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  target     TEXT    NOT NULL,
  purpose    TEXT    NOT NULL CHECK (purpose IN ('login', 'bind', 'reset')),
  code_hash  TEXT    NOT NULL,
  attempts   INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT    NOT NULL,
  used_at    TEXT,
  created_at TEXT    NOT NULL
) STRICT;
CREATE INDEX idx_verify_code_target ON verify_code (target, purpose, created_at);

-- 开发者 API Key：只存哈希，前缀用于在列表中辨认
CREATE TABLE api_key (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT    NOT NULL,
  key_prefix   TEXT    NOT NULL,
  key_hash     TEXT    NOT NULL UNIQUE,
  scopes       TEXT    NOT NULL DEFAULT '[]',
  last_used_at TEXT,
  expires_at   TEXT,
  revoked_at   TEXT,
  created_at   TEXT    NOT NULL
) STRICT;

-- 存储仓库：本地磁盘或对象存储，config 为 JSON，其中的密钥加密后保存
CREATE TABLE storage_repo (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL,
  type       TEXT    NOT NULL CHECK (type IN ('local', 's3', 'oss', 'cos', 'qiniu')),
  config     TEXT    NOT NULL DEFAULT '{}',
  is_default INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0, 1)),
  created_at TEXT    NOT NULL,
  updated_at TEXT    NOT NULL
) STRICT;

-- 上传的文件
CREATE TABLE file (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  repo_id       INTEGER REFERENCES storage_repo (id) ON DELETE SET NULL,
  original_name TEXT    NOT NULL,
  storage_key   TEXT    NOT NULL,
  url           TEXT    NOT NULL,
  mime          TEXT    NOT NULL,
  size          INTEGER NOT NULL,
  hash          TEXT,
  width         INTEGER,
  height        INTEGER,
  created_at    TEXT    NOT NULL
) STRICT;
CREATE INDEX idx_file_hash ON file (hash);

-- AI 服务商：api_key 加密后保存
CREATE TABLE ai_provider (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL,
  type       TEXT    NOT NULL,
  base_url   TEXT,
  api_key    TEXT,
  model      TEXT    NOT NULL,
  config     TEXT    NOT NULL DEFAULT '{}',
  is_default INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0, 1)),
  created_at TEXT    NOT NULL,
  updated_at TEXT    NOT NULL
) STRICT;

-- 数据库备份记录
CREATE TABLE backup (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  file_name  TEXT    NOT NULL,
  size       INTEGER NOT NULL,
  note       TEXT,
  created_at TEXT    NOT NULL
) STRICT;

-- ---------------------------------------------------------------------
-- 记录当前版本
-- ---------------------------------------------------------------------
INSERT INTO schema_version (version, description, applied_at)
VALUES (1, '初始表结构', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));
