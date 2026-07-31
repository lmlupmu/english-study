import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Shield, Users, GraduationCap, UserCog, BookOpen, MessageSquare, Search, Trash2, KeyRound, X } from 'lucide-react'
import { useUserStore } from '@/store'
import { api } from '@/api/client'
import type { BackendUser } from '@/api/client'
import { grades } from '@/data/courses'
import './AdminDashboard.css'

type Stats = {
  totalUsers: number
  students: number
  parents: number
  completedLessons: number
  posts: number
}

type Toast = { type: 'success' | 'error'; msg: string } | null

const roleLabel: Record<BackendUser['role'], string> = {
  student: '学生',
  parent: '家长',
  admin: '管理员',
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useUserStore()

  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<BackendUser[]>([])
  const [keyword, setKeyword] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<Toast>(null)

  const [deleteTarget, setDeleteTarget] = useState<BackendUser | null>(null)
  const [resetTarget, setResetTarget] = useState<BackendUser | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 2500)
  }

  const loadStats = useCallback(async () => {
    try {
      const data = await api.adminStats()
      setStats(data)
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : '加载统计失败')
    }
  }, [])

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.adminListUsers({ keyword, role: roleFilter })
      setUsers(data.users)
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : '加载用户列表失败')
    } finally {
      setLoading(false)
    }
  }, [keyword, roleFilter])

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    if (user && user.role !== 'admin') {
      return
    }
    void loadStats()
  }, [isAuthenticated, user, navigate, loadStats])

  useEffect(() => {
    if (user?.role !== 'admin') return
    const t = setTimeout(() => void loadUsers(), 300)
    return () => clearTimeout(t)
  }, [keyword, roleFilter, user?.role, loadUsers])

  // 权限校验
  if (!isAuthenticated) return null
  if (user && user.role !== 'admin') {
    return (
      <div className="admin-forbidden">
        <div className="admin-forbidden-card">
          <h2>无权访问</h2>
          <p>该页面仅限管理员账号访问。</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>返回首页</button>
        </div>
      </div>
    )
  }
  if (!user) return null

  const gradeName = (g: number) => (g === 0 ? '-' : grades.find(x => x.id === g)?.name || `${g}年级`)

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setSubmitting(true)
    try {
      await api.adminDeleteUser(deleteTarget.id)
      showToast('success', `已删除账号 ${deleteTarget.name}`)
      setDeleteTarget(null)
      await Promise.all([loadUsers(), loadStats()])
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : '删除失败')
    } finally {
      setSubmitting(false)
    }
  }

  const confirmReset = async () => {
    if (!resetTarget) return
    if (newPassword.length < 6) {
      showToast('error', '密码至少 6 位')
      return
    }
    setSubmitting(true)
    try {
      await api.adminResetPassword(resetTarget.id, newPassword)
      showToast('success', `已重置 ${resetTarget.name} 的密码`)
      setResetTarget(null)
      setNewPassword('')
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : '重置失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="container admin-header-inner">
          <div>
            <h1>
              <Shield size={28} className="shield-icon" />
              管理员后台
            </h1>
            <p>管理所有用户账号、查看系统数据</p>
          </div>
          <div className="admin-user-cell">
            <div className="admin-user-avatar">{user.name[0]}</div>
            <div>
              <div className="admin-user-name">{user.name}</div>
              <div className="admin-user-email">{user.email}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="container admin-content">
        {/* 统计卡片 */}
        <div className="admin-stats">
          <div className="admin-stat-card">
            <div className="stat-icon"><Users size={20} /></div>
            <div className="admin-stat-value">{stats?.totalUsers ?? '-'}</div>
            <div className="admin-stat-label">总用户数</div>
          </div>
          <div className="admin-stat-card">
            <div className="stat-icon"><GraduationCap size={20} /></div>
            <div className="admin-stat-value">{stats?.students ?? '-'}</div>
            <div className="admin-stat-label">学生</div>
          </div>
          <div className="admin-stat-card">
            <div className="stat-icon"><UserCog size={20} /></div>
            <div className="admin-stat-value">{stats?.parents ?? '-'}</div>
            <div className="admin-stat-label">家长</div>
          </div>
          <div className="admin-stat-card">
            <div className="stat-icon"><BookOpen size={20} /></div>
            <div className="admin-stat-value">{stats?.completedLessons ?? '-'}</div>
            <div className="admin-stat-label">完成课程数</div>
          </div>
          <div className="admin-stat-card">
            <div className="stat-icon"><MessageSquare size={20} /></div>
            <div className="admin-stat-value">{stats?.posts ?? '-'}</div>
            <div className="admin-stat-label">社区帖子</div>
          </div>
        </div>

        {/* 工具栏 */}
        <div className="admin-toolbar">
          <Search size={18} style={{ color: 'var(--text-secondary)' }} />
          <input
            placeholder="搜索姓名或邮箱..."
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
          />
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="">全部角色</option>
            <option value="student">学生</option>
            <option value="parent">家长</option>
            <option value="admin">管理员</option>
          </select>
          <span className="result-count">{loading ? '加载中...' : `共 ${users.length} 条`}</span>
        </div>

        {/* 用户表格 */}
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>用户</th>
                <th>角色</th>
                <th>年级</th>
                <th>XP</th>
                <th>连续天数</th>
                <th>注册时间</th>
                <th style={{ textAlign: 'right' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && !loading ? (
                <tr>
                  <td colSpan={7} className="admin-empty">暂无用户数据</td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="admin-user-cell">
                        <div className="admin-user-avatar">{u.name[0] || 'U'}</div>
                        <div>
                          <div className="admin-user-name">{u.name}</div>
                          <div className="admin-user-email">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`role-badge ${u.role}`}>{roleLabel[u.role]}</span>
                    </td>
                    <td>{gradeName(u.grade)}</td>
                    <td>{u.total_xp}</td>
                    <td>{u.streak}</td>
                    <td>{new Date(u.registered_at).toLocaleDateString('zh-CN')}</td>
                    <td>
                      <div className="admin-actions">
                        <button
                          className="btn-warn"
                          disabled={u.role === 'admin'}
                          onClick={() => { setResetTarget(u); setNewPassword('') }}
                          title="重置密码"
                        >
                          <KeyRound size={14} /> 重置密码
                        </button>
                        <button
                          className="btn-danger"
                          disabled={u.role === 'admin'}
                          onClick={() => setDeleteTarget(u)}
                          title="删除账号"
                        >
                          <Trash2 size={14} /> 删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 删除确认弹窗 */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="admin-modal-mask" onClick={() => !submitting && setDeleteTarget(null)}>
            <div className="admin-modal" onClick={e => e.stopPropagation()}>
              <h3>确认删除账号</h3>
              <p>
                将永久删除 <strong>{deleteTarget.name}</strong>（{deleteTarget.email}）的账号，
                以及该账号的所有学习进度、成就、每日目标和社区帖子。<br />
                <span style={{ color: '#f87171' }}>此操作不可撤销。</span>
              </p>
              <div className="admin-modal-actions">
                <button className="btn btn-ghost" disabled={submitting} onClick={() => setDeleteTarget(null)}>取消</button>
                <button className="btn btn-primary" disabled={submitting} onClick={confirmDelete}>
                  {submitting ? '删除中...' : '确认删除'}
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* 重置密码弹窗 */}
      <AnimatePresence>
        {resetTarget && (
          <div className="admin-modal-mask" onClick={() => !submitting && setResetTarget(null)}>
            <div className="admin-modal" onClick={e => e.stopPropagation()}>
              <h3>重置密码</h3>
              <p>为 <strong>{resetTarget.name}</strong>（{resetTarget.email}）设置新密码，至少 6 位。</p>
              <input
                type="text"
                placeholder="输入新密码"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                autoFocus
              />
              <div className="admin-modal-actions">
                <button className="btn btn-ghost" disabled={submitting} onClick={() => setResetTarget(null)}>取消</button>
                <button className="btn btn-primary" disabled={submitting || newPassword.length < 6} onClick={confirmReset}>
                  {submitting ? '提交中...' : '确认重置'}
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <div className={`admin-toast ${toast.type}`}>
            {toast.type === 'success' ? '✓' : <X size={14} />} {toast.msg}
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
