import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Users, Plus, BookOpen, Target, Calendar, ArrowRight, LogOut, GraduationCap, TrendingUp, Trophy } from 'lucide-react'
import { useUserStore, useProgressStore } from '@/store'
import type { User, ProgressRecord } from '@/types'
import './ParentDashboard.css'

interface ChildStats {
  user: User
  records: ProgressRecord[]
  totalXp: number
  wordsLearned: number
  completedLessons: number
  studyDays: number
  avgScore: number
  streak: number
}

export default function ParentDashboard() {
  const navigate = useNavigate()
  const { user, isAuthenticated, logout, bindChild, children, loadChildren, error: storeError } = useUserStore()
  const { getChildProgress } = useProgressStore()
  const [childEmail, setChildEmail] = useState('')
  const [bindError, setBindError] = useState('')
  const [bindSuccess, setBindSuccess] = useState(false)
  const [selectedChild, setSelectedChild] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthenticated && user?.role === 'parent') {
      loadChildren()
    }
  }, [isAuthenticated, user?.role, loadChildren])

  if (!isAuthenticated || !user) {
    return (
      <div className="parent-page">
        <div className="parent-card">
          <h2>请先登录家长账号</h2>
          <button className="btn btn-primary" onClick={() => navigate('/login')}>去登录</button>
        </div>
      </div>
    )
  }

  if (user.role !== 'parent') {
    return (
      <div className="parent-page">
        <div className="parent-card">
          <h2>当前账号不是家长账号</h2>
          <button className="btn btn-primary" onClick={() => navigate('/courses')}>返回学习</button>
        </div>
      </div>
    )
  }

  const [progressMap, setProgressMap] = useState<Record<string, ProgressRecord[]>>({})
  useEffect(() => {
    let cancelled = false
    async function load() {
      const map: Record<string, ProgressRecord[]> = {}
      for (const child of children) {
        const data = await getChildProgress(child.id)
        map[child.id] = data.records
      }
      if (!cancelled) setProgressMap(map)
    }
    load()
    return () => { cancelled = true }
  }, [children, getChildProgress])

  const childrenStats: ChildStats[] = useMemo(() => {
    return (children || [])
      .filter(Boolean)
      .map(child => {
        const records = progressMap[child.id] || []
        const dates = new Set(records.map(r => r.completedAt.slice(0, 10)))
        const avgScore = records.length ? Math.round(records.reduce((s, r) => s + r.score, 0) / records.length) : 0
        return {
          user: child,
          records,
          totalXp: child.totalXp,
          wordsLearned: records.filter(r => r.lessonId.endsWith('-vocab')).length * 30,
          completedLessons: records.length,
          studyDays: dates.size,
          avgScore,
          streak: child.streak,
        }
      })
  }, [children, progressMap])

  const handleBind = async (e: React.FormEvent) => {
    e.preventDefault()
    setBindError('')
    setBindSuccess(false)
    if (!childEmail.trim()) return
    const ok = await bindChild(childEmail.trim())
    if (ok) {
      setBindSuccess(true)
      setChildEmail('')
      setTimeout(() => setBindSuccess(false), 2000)
    } else {
      setBindError(storeError || '未找到该学生账号，请确认邮箱正确')
    }
  }

  const selectedStats = childrenStats.find(c => c.user.id === selectedChild)

  return (
    <div className="parent-page">
      <div className="parent-header">
        <div className="container">
          <div className="parent-header-inner">
            <div>
              <h1><Users size={24} /> 家长监督中心</h1>
              <p>绑定孩子账号，实时了解学习动态</p>
            </div>
            <button className="btn btn-ghost" onClick={() => { logout(); navigate('/login') }}>
              <LogOut size={18} /> 退出登录
            </button>
          </div>
        </div>
      </div>

      <div className="container parent-content">
        <div className="parent-grid">
          <motion.div
            className="parent-card bind-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h3>绑定孩子账号</h3>
            <p>输入孩子的注册邮箱，将其添加到监督列表</p>
            <form onSubmit={handleBind} className="bind-form">
              <input
                type="email"
                value={childEmail}
                onChange={e => setChildEmail(e.target.value)}
                placeholder="孩子的邮箱地址"
                required
              />
              <button type="submit" className="btn btn-primary">
                <Plus size={18} /> 绑定
              </button>
            </form>
            {bindError && <div className="bind-error">{bindError}</div>}
            {bindSuccess && <div className="bind-success">绑定成功</div>}
          </motion.div>

          {childrenStats.length === 0 && (
            <motion.div className="parent-card empty-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <p>还没有绑定孩子账号，请在上方添加。</p>
            </motion.div>
          )}

          {childrenStats.map((child, idx) => (
            <motion.div
              key={child.user.id}
              className={`parent-card child-card ${selectedChild === child.user.id ? 'active' : ''}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => setSelectedChild(selectedChild === child.user.id ? null : child.user.id)}
            >
              <div className="child-header">
                <div className="child-avatar">{child.user.name[0]}</div>
                <div className="child-info">
                  <h3>{child.user.name}</h3>
                  <span className="child-grade"><GraduationCap size={14} /> {child.user.grade} 年级</span>
                </div>
                <ArrowRight size={18} className="child-arrow" />
              </div>
              <div className="child-stats">
                <div className="stat">
                  <Trophy size={18} />
                  <span className="stat-value">{child.totalXp}</span>
                  <span className="stat-label">总 XP</span>
                </div>
                <div className="stat">
                  <BookOpen size={18} />
                  <span className="stat-value">{child.wordsLearned}</span>
                  <span className="stat-label">已背单词</span>
                </div>
                <div className="stat">
                  <BookOpen size={18} />
                  <span className="stat-value">{child.completedLessons}</span>
                  <span className="stat-label">完成课程</span>
                </div>
                <div className="stat">
                  <Calendar size={18} />
                  <span className="stat-value">{child.studyDays}</span>
                  <span className="stat-label">学习天数</span>
                </div>
                <div className="stat">
                  <TrendingUp size={18} />
                  <span className="stat-value">{child.avgScore}</span>
                  <span className="stat-label">平均分</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {selectedStats && (
          <motion.div
            className="parent-card detail-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="detail-header">
              <h3>{selectedStats.user.name} 的学习详情</h3>
              <span className="child-grade"><GraduationCap size={14} /> {selectedStats.user.grade} 年级</span>
            </div>

            <div className="detail-overview">
              <div className="overview-item">
                <Target size={20} />
                <div>
                  <div className="overview-value">{selectedStats.avgScore}%</div>
                  <div className="overview-label">平均正确率</div>
                </div>
              </div>
              <div className="overview-item">
                <BookOpen size={20} />
                <div>
                  <div className="overview-value">{selectedStats.completedLessons}</div>
                  <div className="overview-label">完成课程数</div>
                </div>
              </div>
              <div className="overview-item">
                <Trophy size={20} />
                <div>
                  <div className="overview-value">{selectedStats.totalXp}</div>
                  <div className="overview-label">累计 XP</div>
                </div>
              </div>
              <div className="overview-item">
                <BookOpen size={20} />
                <div>
                  <div className="overview-value">{selectedStats.wordsLearned}</div>
                  <div className="overview-label">已背单词</div>
                </div>
              </div>
              <div className="overview-item">
                <Calendar size={20} />
                <div>
                  <div className="overview-value">{selectedStats.streak}</div>
                  <div className="overview-label">连续学习</div>
                </div>
              </div>
            </div>

            <h4 className="detail-section-title">最近学习记录</h4>
            {selectedStats.records.length === 0 ? (
              <p className="empty-records">该孩子还没有学习记录</p>
            ) : (
              <div className="records-list">
                {selectedStats.records.slice().reverse().slice(0, 20).map((record, i) => (
                  <div key={i} className="record-item">
                    <div className="record-lesson">{formatLessonName(record.lessonId)}</div>
                    <div className="record-meta">
                      <span className={`record-score ${record.score >= 80 ? 'good' : record.score >= 60 ? 'ok' : 'poor'}`}>
                        {record.score} 分
                      </span>
                      <span className="record-xp">+{record.xpEarned} XP</span>
                      <span className="record-time">{new Date(record.completedAt).toLocaleString('zh-CN')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}

function formatLessonName(lessonId: string) {
  const parts = lessonId.split('-')
  const typeMap: Record<string, string> = {
    vocab: '单词记忆',
    grammar: '语法练习',
    speaking: '口语跟读',
    listening: '听力训练',
  }
  const type = typeMap[parts[parts.length - 1]] || '课程'
  return `${type} · ${lessonId}`
}
