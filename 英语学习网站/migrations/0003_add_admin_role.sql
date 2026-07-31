-- 新增 admin 角色，用于网站所有者管理所有用户账号
-- SQLite 不支持直接修改 CHECK 约束，需要重建 users 表

-- 1. 创建带新约束的临时表
CREATE TABLE IF NOT EXISTS users_new (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  grade INTEGER NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('student', 'parent', 'admin')),
  streak INTEGER DEFAULT 0,
  total_xp INTEGER DEFAULT 0,
  registered_at TEXT NOT NULL,
  children TEXT DEFAULT '[]',
  last_active_date TEXT
);

-- 2. 复制现有数据
INSERT OR IGNORE INTO users_new (id, name, email, password_hash, grade, role, streak, total_xp, registered_at, children, last_active_date)
SELECT id, name, email, password_hash, grade, role, streak, total_xp, registered_at, children, last_active_date
FROM users;

-- 3. 替换旧表
DROP TABLE users;
ALTER TABLE users_new RENAME TO users;
