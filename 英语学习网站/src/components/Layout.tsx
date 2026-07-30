import { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, BarChart2, Users, Trophy, User, Menu, X, LogOut, Flame, Shield } from 'lucide-react'
import { useUserStore } from '@/store'
import './Layout.css'

const studentNavItems = [
  { path: '/courses', label: '课程', icon: BookOpen },
  { path: '/progress', label: '进度', icon: BarChart2 },
  { path: '/community', label: '社区', icon: Users },
  { path: '/achievements', label: '成就', icon: Trophy },
]

const parentNavItems = [
  { path: '/parent', label: '家长后台', icon: Shield },
]

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useUserStore()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navItems = user?.role === 'parent' ? parentNavItems : studentNavItems

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="layout">
      <header className="header glass">
        <div className="container header-inner">
          <Link to="/" className="brand">
            <span className="brand-mark">E</span>
            <span className="brand-text">EnglishMind</span>
          </Link>

          <nav className="desktop-nav">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${location.pathname.startsWith(item.path) ? 'active' : ''}`}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="header-actions">
            {isAuthenticated ? (
              <>
                {user?.role === 'student' && (
                  <div className="mini-stat">
                    <Flame size={16} className="flame-icon" />
                    <span>{user?.streak}</span>
                  </div>
                )}
                <Link to="/profile" className="user-chip">
                  <div className="avatar">{user?.name?.[0] || 'U'}</div>
                  <span className="user-name">{user?.name}</span>
                </Link>
                <button className="btn btn-ghost logout-btn" onClick={handleLogout}>
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost">登录</Link>
                <Link to="/register" className="btn btn-primary">注册</Link>
              </>
            )}
            <button className="mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mobile-nav glass"
          >
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`mobile-nav-link ${location.pathname.startsWith(item.path) ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <item.icon size={20} />
                {item.label}
              </Link>
            ))}
            {isAuthenticated ? (
              <button className="mobile-nav-link" onClick={handleLogout}>
                <LogOut size={20} /> 退出登录
              </button>
            ) : (
              <Link to="/login" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>
                <User size={20} /> 登录 / 注册
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
