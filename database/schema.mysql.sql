-- =====================================================================
-- 个人网站数据库表结构（MySQL 8.0.16+ 版）
-- 版本：1
-- 说明：与 schema.sqlite.sql 保持一致，字段含义见 database/README.md。
-- 约定：
--   1. 时间统一存 UTC 的 ISO 8601 字符串（VARCHAR(24)），格式 YYYY-MM-DDTHH:mm:ss.sssZ，
--      与 SQLite 版行为一致，由程序写入
--   2. 布尔值存 TINYINT(1) 的 0 / 1
--   3. 数组、对象类字段存 JSON 文本（TEXT）
-- 执行前先建库：CREATE DATABASE blog DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- =====================================================================

SET NAMES utf8mb4;

CREATE TABLE schema_version (
  version     INT UNSIGNED NOT NULL PRIMARY KEY,
  description VARCHAR(200) NOT NULL,
  applied_at  VARCHAR(24)  NOT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '表结构版本';

CREATE TABLE setting (
  group_key  VARCHAR(32) NOT NULL,
  item_key   VARCHAR(64) NOT NULL,
  value      TEXT        NOT NULL,
  updated_at VARCHAR(24) NOT NULL,
  PRIMARY KEY (group_key, item_key)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '站点设置';

CREATE TABLE profile (
  id                INT UNSIGNED NOT NULL PRIMARY KEY CHECK (id = 1),
  name              VARCHAR(50)  NOT NULL,
  title             VARCHAR(100) NOT NULL DEFAULT '',
  avatar            VARCHAR(500) NOT NULL DEFAULT '',
  city              VARCHAR(50)  NOT NULL DEFAULT '',
  career_start_year SMALLINT UNSIGNED NULL,
  home_intro        VARCHAR(500) NOT NULL DEFAULT '',
  about_md          MEDIUMTEXT   NOT NULL,
  updated_at        VARCHAR(24)  NOT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '个人资料';

CREATE TABLE contact (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  type       VARCHAR(16)  NOT NULL CHECK (type IN ('github', 'email', 'rss', 'custom')),
  label      VARCHAR(50)  NOT NULL,
  value      VARCHAR(500) NOT NULL,
  visible    TINYINT(1)   NOT NULL DEFAULT 1,
  sort_order INT          NOT NULL DEFAULT 0
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '联系方式';

CREATE TABLE skill_group (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(50)  NOT NULL,
  sort_order INT          NOT NULL DEFAULT 0
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '技术栈分组';

CREATE TABLE skill (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  group_id      INT UNSIGNED NOT NULL,
  name          VARCHAR(50)  NOT NULL,
  mark          VARCHAR(8)   NOT NULL DEFAULT '',
  level         VARCHAR(16)  NOT NULL DEFAULT 'familiar' CHECK (level IN ('main', 'familiar')),
  sort_order    INT          NOT NULL DEFAULT 0,
  home_sort     INT          NULL,
  home_category VARCHAR(20)  NOT NULL DEFAULT '',
  KEY idx_skill_group (group_id, sort_order),
  CONSTRAINT fk_skill_group FOREIGN KEY (group_id) REFERENCES skill_group (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '技术栈条目';

CREATE TABLE experience (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  company     VARCHAR(100) NOT NULL,
  role        VARCHAR(100) NOT NULL,
  start_month CHAR(7)      NOT NULL,
  end_month   CHAR(7)      NULL,
  items       TEXT         NOT NULL,
  tags        TEXT         NOT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '工作经历';

CREATE TABLE category (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(50)  NOT NULL,
  slug       VARCHAR(100) NOT NULL,
  sort_order INT          NOT NULL DEFAULT 0,
  created_at VARCHAR(24)  NOT NULL,
  UNIQUE KEY uk_category_slug (slug)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '文章分类';

CREATE TABLE tag (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(50)  NOT NULL,
  slug       VARCHAR(100) NOT NULL,
  created_at VARCHAR(24)  NOT NULL,
  UNIQUE KEY uk_tag_slug (slug)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '文章标签';

CREATE TABLE post (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  slug         VARCHAR(150) NOT NULL,
  title        VARCHAR(200) NOT NULL,
  summary      VARCHAR(500) NOT NULL DEFAULT '',
  content      MEDIUMTEXT   NOT NULL,
  cover        VARCHAR(500) NULL,
  category_id  INT UNSIGNED NOT NULL,
  status       VARCHAR(16)  NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  is_top       TINYINT(1)   NOT NULL DEFAULT 0,
  read_minutes INT UNSIGNED NOT NULL DEFAULT 1,
  views        INT UNSIGNED NOT NULL DEFAULT 0,
  published_at VARCHAR(24)  NULL,
  created_at   VARCHAR(24)  NOT NULL,
  updated_at   VARCHAR(24)  NOT NULL,
  UNIQUE KEY uk_post_slug (slug),
  KEY idx_post_list (status, is_top, published_at),
  KEY idx_post_category (category_id),
  CONSTRAINT fk_post_category FOREIGN KEY (category_id) REFERENCES category (id) ON DELETE RESTRICT
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '文章';

CREATE TABLE post_tag (
  post_id INT UNSIGNED NOT NULL,
  tag_id  INT UNSIGNED NOT NULL,
  PRIMARY KEY (post_id, tag_id),
  KEY idx_post_tag_tag (tag_id),
  CONSTRAINT fk_post_tag_post FOREIGN KEY (post_id) REFERENCES post (id) ON DELETE CASCADE,
  CONSTRAINT fk_post_tag_tag FOREIGN KEY (tag_id) REFERENCES tag (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '文章与标签关联';

CREATE TABLE project (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  description VARCHAR(500) NOT NULL DEFAULT '',
  cover       VARCHAR(500) NULL,
  icon        VARCHAR(32)  NOT NULL DEFAULT 'web',
  category    VARCHAR(16)  NOT NULL CHECK (category IN ('web', 'tool', 'mobile', 'hw')),
  status      VARCHAR(16)  NOT NULL DEFAULT 'done' CHECK (status IN ('doing', 'maintaining', 'done')),
  tech_tags   TEXT         NOT NULL,
  repo_url    VARCHAR(500) NULL,
  demo_url    VARCHAR(500) NULL,
  post_id     INT UNSIGNED NULL,
  featured    TINYINT(1)   NOT NULL DEFAULT 0,
  sort_order  INT          NOT NULL DEFAULT 0,
  created_at  VARCHAR(24)  NOT NULL,
  updated_at  VARCHAR(24)  NOT NULL,
  CONSTRAINT fk_project_post FOREIGN KEY (post_id) REFERENCES post (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '项目';

CREATE TABLE friend_link (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(50)  NOT NULL,
  url          VARCHAR(500) NOT NULL,
  avatar       VARCHAR(500) NULL,
  description  VARCHAR(100) NULL,
  email        VARCHAR(200) NULL,
  backlink_url VARCHAR(500) NULL,
  status       VARCHAR(16)  NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  sort_order   INT          NOT NULL DEFAULT 0,
  apply_ip     VARCHAR(64)  NULL,
  review_note  VARCHAR(200) NULL,
  created_at   VARCHAR(24)  NOT NULL,
  reviewed_at  VARCHAR(24)  NULL,
  KEY idx_friend_link_status (status, sort_order),
  KEY idx_friend_link_url (url(191)),
  KEY idx_friend_link_ip (apply_ip, created_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '友情链接与申请';

CREATE TABLE comment (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  post_id    INT UNSIGNED NULL,
  parent_id  INT UNSIGNED NULL,
  nickname   VARCHAR(50)  NOT NULL,
  email      VARCHAR(200) NULL,
  website    VARCHAR(500) NULL,
  content    TEXT         NOT NULL,
  is_admin   TINYINT(1)   NOT NULL DEFAULT 0,
  status     VARCHAR(16)  NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  ip         VARCHAR(64)  NULL,
  user_agent VARCHAR(500) NULL,
  created_at VARCHAR(24)  NOT NULL,
  KEY idx_comment_post (post_id, status, created_at),
  KEY idx_comment_ip (ip, created_at),
  CONSTRAINT fk_comment_post FOREIGN KEY (post_id) REFERENCES post (id) ON DELETE CASCADE,
  CONSTRAINT fk_comment_parent FOREIGN KEY (parent_id) REFERENCES comment (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '留言与评论';

CREATE TABLE visit_log (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  path       VARCHAR(500) NOT NULL,
  post_id    INT UNSIGNED NULL,
  ip_hash    CHAR(16)     NOT NULL,
  user_agent VARCHAR(500) NULL,
  referer    VARCHAR(500) NULL,
  created_at VARCHAR(24)  NOT NULL,
  KEY idx_visit_log_time (created_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '访问记录';

-- =====================================================================
-- 以下为管理端使用的表，用户端不读写
-- =====================================================================

CREATE TABLE admin_user (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(50)  NOT NULL,
  password_hash VARCHAR(200) NOT NULL,
  nickname      VARCHAR(50)  NOT NULL DEFAULT '',
  email         VARCHAR(200) NULL,
  phone         VARCHAR(20)  NULL,
  avatar        VARCHAR(500) NULL,
  last_login_at VARCHAR(24)  NULL,
  created_at    VARCHAR(24)  NOT NULL,
  updated_at    VARCHAR(24)  NOT NULL,
  UNIQUE KEY uk_admin_user_username (username),
  UNIQUE KEY uk_admin_user_email (email),
  UNIQUE KEY uk_admin_user_phone (phone)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '管理员账号';

CREATE TABLE user_oauth (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  provider   VARCHAR(32)  NOT NULL,
  open_id    VARCHAR(128) NOT NULL,
  nickname   VARCHAR(100) NULL,
  created_at VARCHAR(24)  NOT NULL,
  UNIQUE KEY uk_user_oauth (provider, open_id),
  CONSTRAINT fk_user_oauth_user FOREIGN KEY (user_id) REFERENCES admin_user (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '第三方登录绑定';

CREATE TABLE auth_token (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  token_hash CHAR(64)     NOT NULL,
  user_agent VARCHAR(500) NULL,
  ip         VARCHAR(64)  NULL,
  expires_at VARCHAR(24)  NOT NULL,
  revoked_at VARCHAR(24)  NULL,
  created_at VARCHAR(24)  NOT NULL,
  UNIQUE KEY uk_auth_token_hash (token_hash),
  CONSTRAINT fk_auth_token_user FOREIGN KEY (user_id) REFERENCES admin_user (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '刷新令牌';

CREATE TABLE login_log (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NULL,
  method     VARCHAR(16)  NOT NULL CHECK (method IN ('password', 'code', 'qr', 'oauth', 'api_key')),
  success    TINYINT(1)   NOT NULL,
  message    VARCHAR(200) NULL,
  ip         VARCHAR(64)  NULL,
  user_agent VARCHAR(500) NULL,
  created_at VARCHAR(24)  NOT NULL,
  KEY idx_login_log_user (user_id, created_at),
  CONSTRAINT fk_login_log_user FOREIGN KEY (user_id) REFERENCES admin_user (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '登录日志';

CREATE TABLE verify_code (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  target     VARCHAR(200) NOT NULL,
  purpose    VARCHAR(16)  NOT NULL CHECK (purpose IN ('login', 'bind', 'reset')),
  code_hash  CHAR(64)     NOT NULL,
  attempts   INT UNSIGNED NOT NULL DEFAULT 0,
  expires_at VARCHAR(24)  NOT NULL,
  used_at    VARCHAR(24)  NULL,
  created_at VARCHAR(24)  NOT NULL,
  KEY idx_verify_code_target (target, purpose, created_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '验证码';

CREATE TABLE api_key (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(50)  NOT NULL,
  key_prefix   VARCHAR(16)  NOT NULL,
  key_hash     CHAR(64)     NOT NULL,
  scopes       TEXT         NOT NULL,
  last_used_at VARCHAR(24)  NULL,
  expires_at   VARCHAR(24)  NULL,
  revoked_at   VARCHAR(24)  NULL,
  created_at   VARCHAR(24)  NOT NULL,
  UNIQUE KEY uk_api_key_hash (key_hash)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '开发者 API Key';

CREATE TABLE storage_repo (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(50)  NOT NULL,
  type       VARCHAR(16)  NOT NULL CHECK (type IN ('local', 's3', 'oss', 'cos', 'qiniu')),
  config     TEXT         NOT NULL,
  is_default TINYINT(1)   NOT NULL DEFAULT 0,
  created_at VARCHAR(24)  NOT NULL,
  updated_at VARCHAR(24)  NOT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '存储仓库';

CREATE TABLE file (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  repo_id       INT UNSIGNED NULL,
  original_name VARCHAR(255) NOT NULL,
  storage_key   VARCHAR(500) NOT NULL,
  url           VARCHAR(500) NOT NULL,
  mime          VARCHAR(100) NOT NULL,
  size          BIGINT UNSIGNED NOT NULL,
  hash          CHAR(64)     NULL,
  width         INT UNSIGNED NULL,
  height        INT UNSIGNED NULL,
  created_at    VARCHAR(24)  NOT NULL,
  KEY idx_file_hash (hash),
  CONSTRAINT fk_file_repo FOREIGN KEY (repo_id) REFERENCES storage_repo (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '上传文件';

CREATE TABLE ai_provider (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(50)  NOT NULL,
  type       VARCHAR(32)  NOT NULL,
  base_url   VARCHAR(500) NULL,
  api_key    VARCHAR(1000) NULL,
  model      VARCHAR(100) NOT NULL,
  config     TEXT         NOT NULL,
  is_default TINYINT(1)   NOT NULL DEFAULT 0,
  created_at VARCHAR(24)  NOT NULL,
  updated_at VARCHAR(24)  NOT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'AI 服务商';

CREATE TABLE backup (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  file_name  VARCHAR(255) NOT NULL,
  size       BIGINT UNSIGNED NOT NULL,
  note       VARCHAR(200) NULL,
  created_at VARCHAR(24)  NOT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '数据库备份记录';

INSERT INTO schema_version (version, description, applied_at)
VALUES (1, '初始表结构', CONCAT(LEFT(DATE_FORMAT(UTC_TIMESTAMP(3), '%Y-%m-%dT%H:%i:%s.%f'), 23), 'Z'));
