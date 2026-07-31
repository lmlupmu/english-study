import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, ArrowRight } from 'lucide-react'
import { useUserStore } from '@/store'
import './Auth.css'

export default function Login() {
  const navigate = useNavigate()
  const { login, error: storeError } = useUserStore()
  const [email, setEmail] = useState('learner@example.com')
  const [password, setPassword] = useState('123456')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const ok = await login(email, password)
    setLoading(false)
    if (ok) {
      const user = useUserStore.getState().user
      navigate(user?.role === 'parent' ? '/parent' : '/courses')
    } else {
      setError(storeError || '邮箱或密码错误')
    }
  }

  return (
    <div className="auth-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="auth-card"
      >
        <div className="auth-header">
          <h1>欢迎回来</h1>
          <p>登录后继续你的英语学习之旅</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
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
                placeholder="••••••••"
                required
              />
            </div>
          </div>
          {error && <div className="auth-error">{error}</div>}
          <button type="submit" className="btn btn-primary submit-btn" disabled={loading}>
            {loading ? '登录中...' : '登录'} <ArrowRight size={18} />
          </button>
        </form>
        <div className="auth-footer">
          还没有账号？ <Link to="/register">立即注册</Link>
        </div>
        <div className="demo-tip">
          学生演示：learner@example.com / 123456<br />
          家长演示：parent@example.com / 123456<br />
          其他孩子：child1/child2/child3@example.com / 123456
        </div>
      </motion.div>
    </div>
  )
}
