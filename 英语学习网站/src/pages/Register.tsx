import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { User, Mail, Lock, GraduationCap, ArrowRight, Users } from 'lucide-react'
import { useUserStore } from '@/store'
import './Auth.css'

export default function Register() {
  const navigate = useNavigate()
  const { register } = useUserStore()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [grade, setGrade] = useState(3)
  const [role, setRole] = useState<'student' | 'parent'>('student')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('密码至少需要 6 位')
      return
    }
    setLoading(true)
    setTimeout(() => {
      const ok = register(name, email, password, role === 'student' ? grade : 0, role)
      setLoading(false)
      if (ok) navigate(role === 'parent' ? '/parent' : '/courses')
      else setError('该邮箱已被注册')
    }, 500)
  }

  return (
    <div className="auth-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="auth-card"
      >
        <div className="auth-header">
          <h1>创建账号</h1>
          <p>选择适合的年级，开启个性化学习</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field">
            <label>昵称</label>
            <div className="input-wrap">
              <User size={18} />
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="你的名字"
                required
              />
            </div>
          </div>
          <div className="field">
            <label>邮箱</label>
            <div className="input-wrap">
              <Mail size={18} />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
          </div>
          <div className="field">
            <label>密码</label>
            <div className="input-wrap">
              <Lock size={18} />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="至少 6 位"
                required
              />
            </div>
          </div>
          <div className="field">
            <label>账号类型</label>
            <div className="input-wrap role-select">
              <Users size={18} />
              <select value={role} onChange={e => setRole(e.target.value as 'student' | 'parent')}>
                <option value="student">学生账号</option>
                <option value="parent">家长账号</option>
              </select>
            </div>
          </div>
          {role === 'student' && (
            <div className="field">
              <label>当前年级</label>
              <div className="input-wrap">
                <GraduationCap size={18} />
                <select value={grade} onChange={e => setGrade(Number(e.target.value))}>
                  {Array.from({ length: 9 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>小学/初中 {i + 1} 年级</option>
                  ))}
                </select>
              </div>
            </div>
          )}
          {error && <div className="auth-error">{error}</div>}
          <button type="submit" className="btn btn-primary submit-btn" disabled={loading}>
            {loading ? '创建中...' : '注册'} <ArrowRight size={18} />
          </button>
        </form>
        <div className="auth-footer">
          已有账号？ <Link to="/login">立即登录</Link>
        </div>
      </motion.div>
    </div>
  )
}
