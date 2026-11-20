-- 从版本 1 升级，保留各配置项及其更新时间。
SET NAMES utf8mb4;

ALTER TABLE setting ADD COLUMN type TINYINT UNSIGNED NOT NULL DEFAULT 1 CHECK (type IN (0, 1, 2, 3));

START TRANSACTION;

UPDATE setting SET type = CASE
  WHEN NOT JSON_VALID(value) THEN 1
  WHEN JSON_TYPE(value) IN ('INTEGER', 'DOUBLE', 'DECIMAL', 'UNSIGNED INTEGER') THEN 0
  WHEN JSON_TYPE(value) = 'STRING' THEN 1
  WHEN JSON_TYPE(value) = 'BOOLEAN' THEN 2
  ELSE 3
END;

UPDATE setting SET value = CASE
  WHEN type = 2 THEN CASE WHEN JSON_UNQUOTE(value) = 'true' THEN '1' ELSE '0' END
  WHEN type = 1 AND JSON_VALID(value) THEN JSON_UNQUOTE(value)
  ELSE value
END;

INSERT INTO schema_version (version, description, applied_at)
VALUES (2, '站点设置按类型存储', CONCAT(LEFT(DATE_FORMAT(UTC_TIMESTAMP(3), '%Y-%m-%dT%H:%i:%s.%f'), 23), 'Z'));

COMMIT;
