import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout'
import Home from '@/pages/Home'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Courses from '@/pages/Courses'
import GradeDetail from '@/pages/GradeDetail'
import LessonPage from '@/pages/LessonPage'
import Progress from '@/pages/Progress'
import Community from '@/pages/Community'
import DailySentence from '@/pages/DailySentence'
import Profile from '@/pages/Profile'
import ParentDashboard from '@/pages/ParentDashboard'
import AdminDashboard from '@/pages/AdminDashboard'
import AdminSetup from '@/pages/AdminSetup'

function App() {
  useEffect(() => {
    // 注册 Service Worker 并监听版本更新
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(registration => {
          // 当检测到新版本时，自动激活
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // 新版本已安装，提示用户刷新
                  newWorker.postMessage('SKIP_WAITING')
                }
              })
            }
          })
        })
        .catch(err => console.error('SW registration failed:', err))

      // 当 SW 切换控制权时，刷新页面
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload()
      })
    }
  }, [])

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="courses" element={<Courses />} />
        <Route path="courses/:gradeId" element={<GradeDetail />} />
        <Route path="lesson/:lessonId" element={<LessonPage />} />
        <Route path="progress" element={<Progress />} />
        <Route path="community" element={<Community />} />
        <Route path="daily" element={<DailySentence />} />
        <Route path="profile" element={<Profile />} />
        <Route path="parent" element={<ParentDashboard />} />
        <Route path="admin" element={<AdminDashboard />} />
        <Route path="admin/setup" element={<AdminSetup />} />
      </Route>
    </Routes>
  )
}

export default App
