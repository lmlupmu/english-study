import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, User, Mail, Lock, Key, ArrowRight } from 'lucide-react'
import { useUserStore } from '@/store'
import './Auth.css'

export default function AdminSetup() {
  const navigate = useNavigate()
  const { setupAdmin, error: storeError } = useUserStore()
  const [setupKey, setSetupKey] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!setupKey.trim()) {
      setError('请输入初始化密钥')
      return
    }
    if (password.length < 6) {
      setError('密码至少需要 6 位')
      return
    }
    setLoading(true)
    const ok = await setupAdmin(setupKey.trim(), name, email, password)
    setLoading(false)
    if (ok) navigate('/admin')
    else setError(storeError || '创建管理员失败')
  }

  return (
    <div className="auth-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="auth-card"
      >
        <div className="auth-header">
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#1e293b', marginBottom: 16 }}>
            <Shield size={28} />
          </div>
          <h1>创建管理员账号</h1>
          <p>仅可执行一次，需提供初始化密钥</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field">
            <label>初始化密钥</label>
            <div className="input-wrap">
              <Key size={18} />
              <input
                type="password"
                placeholder="ADMIN_SETUP_KEY"
                value={setupKey}
                onChange={e => setSetupKey(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="field">
            <label>管理员昵称</label>
            <div className="input-wrap">
              <User size={18} />
              <input
                type="text"
                placeholder="例如：站长"
                value={name}
                onChange={e => setName(e.target.value)}
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
                placeholder="admin@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
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
                placeholder="至少 6 位"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? '创建中...' : <>创建管理员 <ArrowRight size={18} /></>}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
