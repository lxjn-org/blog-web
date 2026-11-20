-- 从版本 1 升级，保留各配置项及其更新时间。
BEGIN IMMEDIATE;

ALTER TABLE setting ADD COLUMN type INTEGER NOT NULL DEFAULT 1 CHECK (type IN (0, 1, 2, 3));

UPDATE setting SET type = CASE
  WHEN NOT json_valid(value) THEN 1
  WHEN json_type(value) IN ('integer', 'real') THEN 0
  WHEN json_type(value) = 'text' THEN 1
  WHEN json_type(value) IN ('true', 'false') THEN 2
  ELSE 3
END;

UPDATE setting SET value = CASE
  WHEN type = 2 THEN CASE WHEN json_type(value) = 'true' THEN '1' ELSE '0' END
  WHEN type = 1 AND json_valid(value) THEN json_extract(value, '$')
  ELSE value
END;

INSERT INTO schema_version (version, description, applied_at)
VALUES (2, '站点设置按类型存储', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));

COMMIT;
