import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, BookOpen, Mic, Headphones, Brain, BarChart2, Users, Trophy } from 'lucide-react'
import './Home.css'

const features = [
  { icon: BookOpen, title: '分级课程', desc: '1-9 年级完整体系，循序渐进掌握英语。' },
  { icon: Brain, title: '单词记忆', desc: '科学的间隔重复，让词汇真正留在大脑。' },
  { icon: Mic, title: '口语跟读', desc: '语音合成与识别，随时练习地道发音。' },
  { icon: Headphones, title: '听力训练', desc: '沉浸式听力素材，提升理解反应速度。' },
  { icon: BarChart2, title: '进度追踪', desc: '可视化数据，清晰看见每一次进步。' },
  { icon: Users, title: '学习社区', desc: '与同学交流心得，互相激励共同成长。' },
]

const stats = [
  { value: '1-9', label: '年级覆盖' },
  { value: '50+', label: '学习单元' },
  { value: '4', label: '互动模块' },
  { value: '∞', label: '成长可能' },
]

export default function Home() {
  return (
    <div className="home">
      <section className="hero">
        <div className="hero-glow" />
        <div className="container hero-content">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="hero-text"
          >
            <span className="eyebrow">沉浸式英语学习平台</span>
            <h1>
              让每一次学习<br />
              都像<span className="gradient-text">探索世界</span>
            </h1>
            <p>
              为 1-9 年级学生打造的英语成长系统，融合单词、语法、口语、听力，
              用科学路径点燃持续学习的热情。
            </p>
            <div className="hero-actions">
              <Link to="/register" className="btn btn-primary">
                开始学习 <ArrowRight size={18} />
              </Link>
              <Link to="/courses" className="btn btn-secondary">
                浏览课程
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="hero-visual"
          >
            <div className="hero-card">
              <div className="hero-card-header">
                <div className="pulse-dot" />
                <span>今日学习推荐</span>
              </div>
              <div className="hero-card-body">
                <div className="mini-lesson">
                  <BookOpen size={20} />
                  <div>
                    <div className="mini-lesson-title">Unit 3 · 我的爱好</div>
                    <div className="mini-lesson-meta">预计 10 分钟 · 20 XP</div>
                  </div>
                </div>
                <div className="progress-line">
                  <div className="progress-fill" style={{ width: '65%' }} />
                </div>
                <div className="hero-stats">
                  {stats.map((s, i) => (
                    <div key={i} className="hero-stat">
                      <div className="hero-stat-value">{s.value}</div>
                      <div className="hero-stat-label">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="features">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">全方位语言能力训练</h2>
            <p className="section-subtitle">
              不只是课程，更是一套围绕听、说、读、用设计的完整学习闭环。
            </p>
          </div>
          <div className="grid-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="feature-card card-hover"
              >
                <div className="feature-icon">
                  <f.icon size={24} />
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="path">
        <div className="container path-inner">
          <div className="path-text">
            <h2 className="section-title">个性化学习路径</h2>
            <p className="section-subtitle">
              根据年级水平与学习记录，智能推荐下一项任务，让每一步都恰到好处。
            </p>
            <ul className="path-list">
              <li>
                <Trophy size={18} />
                基于能力诊断的起点定位
              </li>
              <li>
                <BarChart2 size={18} />
                动态调整难度与复习节奏
              </li>
              <li>
                <Users size={18} />
                弱项专项突破与巩固
              </li>
            </ul>
            <Link to="/progress" className="btn btn-primary">
              查看我的路径
            </Link>
          </div>
          <div className="path-visual">
            <div className="path-node active">诊断</div>
            <div className="path-line" />
            <div className="path-node active">词汇</div>
            <div className="path-line" />
            <div className="path-node active">语法</div>
            <div className="path-line dashed" />
            <div className="path-node">听力</div>
            <div className="path-line dashed" />
            <div className="path-node">口语</div>
          </div>
        </div>
      </section>

      <section className="cta">
        <div className="container">
          <div className="cta-card">
            <h2>准备好开始了吗？</h2>
            <p>加入 EnglishMind，开启属于你的英语成长之旅。</p>
            <Link to="/register" className="btn btn-primary">
              免费注册 <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
