import type { ComponentType } from 'react'
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Rocket, Flame, BookOpen, Brain, MessageCircle, Trophy, Lock, type LucideProps } from 'lucide-react'
import { achievements } from '@/data/courses'
import { useProgressStore, useUserStore } from '@/store'
import './Achievements.css'

const iconMap: Record<string, ComponentType<LucideProps>> = {
  Rocket,
  Flame,
  BookOpen,
  Brain,
  MessageCircle,
  Trophy,
}

export default function Achievements() {
  const { unlockedAchievements, loadForUser } = useProgressStore()
  const { user, isAuthenticated } = useUserStore()

  // 进入页面时刷新成就解锁状态，保证跨设备一致
  useEffect(() => {
    if (isAuthenticated && user) void loadForUser(user.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id])

  const unlockedCount = unlockedAchievements.length

  return (
    <div className="page achievements-page">
      <div className="container">
        <div className="page-header">
          <h1>成就激励</h1>
          <p>完成学习目标，解锁属于你的荣誉徽章。</p>
        </div>

        <div className="achievement-summary">
          <div className="summary-value">{unlockedCount}</div>
          <div className="summary-label">已解锁 / {achievements.length} 个成就</div>
          <div className="summary-bar">
            <div className="summary-fill" style={{ width: `${(unlockedCount / achievements.length) * 100}%` }} />
          </div>
        </div>

        <div className="achievements-grid">
          {achievements.map((ach, i) => {
            const unlocked = unlockedAchievements.includes(ach.id)
            const Icon = iconMap[ach.icon] || Trophy
            return (
              <motion.div
                key={ach.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className={`achievement-card ${unlocked ? 'unlocked' : 'locked'}`}
              >
                <div className="achievement-icon">
                  <Icon size={28} />
                </div>
                <h3>{ach.title}</h3>
                <p>{ach.description}</p>
                {!unlocked && <Lock size={16} className="lock" />}
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
