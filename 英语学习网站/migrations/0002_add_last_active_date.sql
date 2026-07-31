-- 记录用户最近一次活跃日期，用于在服务端正确计算连续学习天数 (streak)
-- 这样无论用户在手机端还是电脑端完成课程，streak 都能跨设备保持一致
ALTER TABLE users ADD COLUMN last_active_date TEXT;
