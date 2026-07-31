import { useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Flame, Target, TrendingUp, Award, ArrowRight } from 'lucide-react'
import { useUserStore, useProgressStore } from '@/store'
import { grades, generateUnits } from '@/data/courses'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import './Progress.css'

export default function Progress() {
  const { user, isAuthenticated } = useUserStore()
  const { records, dailyGoal, loadForUser } = useProgressStore()

  // 进入页面时从服务端拉取最新进度，确保跨设备数据一致
  useEffect(() => {
    if (isAuthenticated && user) void loadForUser(user.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id])

  const weekData = useMemo(() => {
    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    return days.map((day, i) => ({
      day,
      xp: Math.max(0, records.filter(r => {
        const d = new Date(r.completedAt)
        return d.getDay() === (i + 1) % 7
      }).reduce((sum, r) => sum + r.xpEarned, 0)),
    }))
  }, [records])

  const completedLessons = records.length
  const wordsLearned = records.filter(r => r.lessonId.endsWith('-vocab')).length * 30
  const completedSet = new Set(records.map(r => r.lessonId))
  const recommended = useMemo(() => {
    if (!user) return null
    const units = generateUnits(user.grade)
    for (const unit of units) {
      for (const lesson of unit.lessons) {
        if (!completedSet.has(lesson.id)) return { lesson, unit, grade: grades.find(g => g.id === user.grade) }
      }
    }
    return null
  }, [user, completedSet])

  const typeStats = useMemo(() => {
    const counts: Record<string, number> = { vocabulary: 0, grammar: 0, speaking: 0, listening: 0 }
    records.forEach(r => {
      const type = r.lessonId.split('-').pop()
      if (type && type in counts) counts[type]++
    })
    return [
      { name: '单词', value: counts.vocabulary, color: '#6366f1' },
      { name: '语法', value: counts.grammar, color: '#8b5cf6' },
      { name: '口语', value: counts.speaking, color: '#22c55e' },
      { name: '听力', value: counts.listening, color: '#f59e0b' },
    ]
  }, [records])

  return (
    <div className="page progress-page">
      <div className="container">
        <div className="page-header">
          <h1>学习进度</h1>
          <p>追踪你的每一步成长，发现下一次突破的方向。</p>
        </div>

        {!isAuthenticated && (
          <div className="guest-notice">
            登录后即可保存并查看你的完整学习进度。
            <Link to="/login" className="btn btn-primary" style={{ marginLeft: 16 }}>登录</Link>
          </div>
        )}

        <div className="stats-grid">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="stat-card">
            <Flame className="stat-icon" style={{ color: 'var(--warning)' }} />
            <div className="stat-value">{user?.streak || 0}</div>
            <div className="stat-label">连续学习天数</div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="stat-card">
            <Target className="stat-icon" style={{ color: 'var(--accent)' }} />
            <div className="stat-value">{completedLessons}</div>
            <div className="stat-label">已完成课程</div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="stat-card">
            <TrendingUp className="stat-icon" style={{ color: 'var(--success)' }} />
            <div className="stat-value">{wordsLearned}</div>
            <div className="stat-label">已背单词</div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="stat-card">
            <Award className="stat-icon" style={{ color: 'var(--accent-2)' }} />
            <div className="stat-value">{Math.round((dailyGoal.completed / dailyGoal.target) * 100)}%</div>
            <div className="stat-label">今日目标</div>
          </motion.div>
        </div>

        <div className="progress-grid">
          <div className="progress-panel">
            <h2>本周学习热力</h2>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={weekData}>
                  <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: 'var(--surface-2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }}
                    itemStyle={{ color: 'var(--text)' }}
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  />
                  <Bar dataKey="xp" radius={[6, 6, 0, 0]}>
                    {weekData.map((_, i) => (
                      <Cell key={i} fill={weekData[i].xp > 0 ? 'var(--accent)' : 'var(--surface-3)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="progress-panel">
            <h2>能力分布</h2>
            <div className="type-stats">
              {typeStats.map(t => (
                <div key={t.name} className="type-stat">
                  <div className="type-dot" style={{ background: t.color }} />
                  <div className="type-info">
                    <div className="type-name">{t.name}</div>
                    <div className="type-value">{t.value} 次</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {recommended && (
          <div className="recommendation">
            <div>
              <div className="rec-label">为你推荐</div>
              <h3>{recommended.lesson.title}</h3>
              <p>{recommended.grade?.name} · {recommended.unit.title} · {recommended.lesson.duration} 分钟</p>
            </div>
            <Link to={`/lesson/${recommended.lesson.id}`} className="btn btn-primary">
              开始学习 <ArrowRight size={18} />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
