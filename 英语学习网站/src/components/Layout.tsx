import { useState, useEffect } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, BarChart2, Users, Sparkles, User, Menu, X, LogOut, Flame, Shield, WifiOff, Download } from 'lucide-react'
import { useUserStore } from '@/store'
import './Layout.css'

// PWA 安装事件类型
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const studentNavItems = [
  { path: '/courses', label: '课程', icon: BookOpen },
  { path: '/progress', label: '进度', icon: BarChart2 },
  { path: '/community', label: '社区', icon: Users },
  { path: '/daily', label: '每日一句', icon: Sparkles },
]

const parentNavItems = [
  { path: '/parent', label: '家长后台', icon: Shield },
]

const adminNavItems = [
  { path: '/admin', label: '管理后台', icon: Shield },
]

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useUserStore()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallBanner, setShowInstallBanner] = useState(false)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // 监听 PWA 安装提示事件
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
      // 用户未安装过才显示横幅
      if (!localStorage.getItem('pwa-installed')) {
        setShowInstallBanner(true)
      }
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return
    await installPrompt.prompt()
    const choice = await installPrompt.userChoice
    if (choice.outcome === 'accepted') {
      localStorage.setItem('pwa-installed', 'true')
    }
    setInstallPrompt(null)
    setShowInstallBanner(false)
  }

  const dismissInstall = () => {
    setShowInstallBanner(false)
    localStorage.setItem('pwa-install-dismissed', 'true')
  }

  const navItems = user?.role === 'admin' ? adminNavItems : user?.role === 'parent' ? parentNavItems : studentNavItems

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="layout">
      {/* 离线提示横幅 */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ y: -60 }}
            animate={{ y: 0 }}
            exit={{ y: -60 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              background: '#f59e0b',
              color: '#000',
              textAlign: 'center',
              padding: '10px 16px',
              fontSize: '14px',
              fontWeight: 500,
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <WifiOff size={16} />
            <span>当前处于离线模式，已缓存的内容仍可查看</span>
          </motion.div>
        )}
      </AnimatePresence>

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
            {installPrompt && (
              <button className="btn btn-install" onClick={handleInstall} title="安装到桌面">
                <Download size={16} />
                <span className="install-label">安装</span>
              </button>
            )}
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

      {/* PWA 安装横幅 */}
      <AnimatePresence>
        {showInstallBanner && installPrompt && !localStorage.getItem('pwa-install-dismissed') && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="install-banner"
          >
            <div className="install-banner-content">
              <div className="install-banner-icon">
                <Download size={24} />
              </div>
              <div className="install-banner-text">
                <strong>安装 EnglishMind 到桌面</strong>
                <span>随时打开，离线可用，体验更佳</span>
              </div>
              <div className="install-banner-actions">
                <button className="btn btn-primary btn-sm" onClick={handleInstall}>
                  安装
                </button>
                <button className="btn btn-ghost btn-sm" onClick={dismissInstall}>
                  稍后
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
