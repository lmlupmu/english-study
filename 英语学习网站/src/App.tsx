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
import Achievements from '@/pages/Achievements'
import Profile from '@/pages/Profile'
import ParentDashboard from '@/pages/ParentDashboard'

function App() {
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
        <Route path="achievements" element={<Achievements />} />
        <Route path="profile" element={<Profile />} />
        <Route path="parent" element={<ParentDashboard />} />
      </Route>
    </Routes>
  )
}

export default App
