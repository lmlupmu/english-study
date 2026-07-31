-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  grade INTEGER NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('student', 'parent')),
  streak INTEGER DEFAULT 0,
  total_xp INTEGER DEFAULT 0,
  registered_at TEXT NOT NULL,
  children TEXT DEFAULT '[]'
);

-- Progress records
CREATE TABLE IF NOT EXISTS progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  completed_at TEXT NOT NULL,
  score INTEGER NOT NULL,
  xp_earned INTEGER NOT NULL,
  UNIQUE(user_id, lesson_id)
);

-- Unlocked achievements
CREATE TABLE IF NOT EXISTS achievements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  achievement_id TEXT NOT NULL,
  unlocked_at TEXT NOT NULL,
  UNIQUE(user_id, achievement_id)
);

-- Community posts
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
);

-- Daily goals per user per date
CREATE TABLE IF NOT EXISTS daily_goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  target INTEGER NOT NULL DEFAULT 60,
  completed INTEGER DEFAULT 0,
  goal_date TEXT NOT NULL,
  UNIQUE(user_id, goal_date)
);
