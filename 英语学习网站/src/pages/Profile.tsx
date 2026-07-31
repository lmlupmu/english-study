import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Calendar, Flame, Star, LogOut } from 'lucide-react'
import { useUserStore } from '@/store'
import { grades } from '@/data/courses'
import './Profile.css'

export default function Profile() {
  const navigate = useNavigate()
  const { user, isAuthenticated, logout, updateUser } = useUserStore()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(user?.name || '')

  if (!isAuthenticated || !user) {
    return (
      <div className="container page">
        <h1>请先登录</h1>
      </div>
    )
  }

  const saveName = async () => {
    await updateUser({ name })
    setEditing(false)
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="page profile-page">
      <div className="container profile-container">
        <div className="profile-card">
          <div className="profile-avatar">{user.name[0]}</div>
          <div className="profile-info">
            {editing ? (
              <div className="edit-name">
                <input value={name} onChange={e => setName(e.target.value)} />
                <button className="btn btn-primary" onClick={saveName}>保存</button>
              </div>
            ) : (
              <h1 onClick={() => setEditing(true)}>{user.name}</h1>
            )}
            <div className="profile-meta">
              <span><Mail size={14} /> {user.email}</span>
              <span><Calendar size={14} /> 加入于 {new Date(user.registeredAt).toLocaleDateString('zh-CN')}</span>
              {user.role === 'parent' && <span>家长账号</span>}
            </div>
          </div>
          <button className="btn btn-ghost logout-btn" onClick={handleLogout}>
            <LogOut size={18} /> 退出登录
          </button>
        </div>

        <div className="profile-stats">
          <div className="profile-stat">
            <Flame size={24} style={{ color: 'var(--warning)' }} />
            <div className="profile-stat-value">{user.streak}</div>
            <div className="profile-stat-label">连续天数</div>
          </div>
          <div className="profile-stat">
            <Star size={24} style={{ color: 'var(--accent)' }} />
            <div className="profile-stat-value">{user.totalXp}</div>
            <div className="profile-stat-label">累计 XP</div>
          </div>
          <div className="profile-stat">
            <div className="profile-grade-badge">
              {user.role === 'parent' ? '家长' : grades.find(g => g.id === user.grade)?.name || '-'}
            </div>
            <div className="profile-stat-label">{user.role === 'parent' ? '账号类型' : '当前年级'}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
