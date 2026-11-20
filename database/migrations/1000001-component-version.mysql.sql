-- 前置条件：旧库已执行到 schema_version 2。保留旧迁移记录。
CREATE TABLE IF NOT EXISTS component_version (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  module          TINYINT UNSIGNED NOT NULL UNIQUE CHECK (module BETWEEN 0 AND 3),
  current_version INT UNSIGNED NOT NULL DEFAULT 0 CHECK (current_version <= 999999999),
  latest_version  INT UNSIGNED NULL CHECK (latest_version <= 999999999),
  updated_at      VARCHAR(24) NOT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '模块版本';

INSERT INTO component_version (module, current_version, updated_at)
SELECT module, CASE WHEN module <> 0 THEN 0
                    WHEN (SELECT MAX(version) FROM schema_version) = 2 THEN 1000001 END,
       CONCAT(LEFT(DATE_FORMAT(UTC_TIMESTAMP(3), '%Y-%m-%dT%H:%i:%s.%f'), 23), 'Z')
FROM (SELECT 0 AS module UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3) AS modules;
