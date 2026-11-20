-- 前置条件：旧库已执行到 schema_version 2。保留旧迁移记录。
BEGIN IMMEDIATE;

CREATE TABLE component_version (
  id              INTEGER PRIMARY KEY,
  module          INTEGER NOT NULL UNIQUE CHECK (module BETWEEN 0 AND 3),
  current_version INTEGER NOT NULL DEFAULT 0 CHECK (current_version BETWEEN 0 AND 999999999),
  latest_version  INTEGER CHECK (latest_version BETWEEN 0 AND 999999999),
  updated_at      TEXT NOT NULL
) STRICT;

INSERT INTO component_version (module, current_version, updated_at)
SELECT module, CASE WHEN module <> 0 THEN 0
                    WHEN (SELECT MAX(version) FROM schema_version) = 2 THEN 1000001 END,
       strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
FROM (SELECT 0 AS module UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3);

COMMIT;
