import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { grades } from '@/data/courses'
import { useUserStore } from '@/store'
import './Courses.css'

export default function Courses() {
  const { user, isAuthenticated } = useUserStore()

  return (
    <div className="page courses">
      <div className="container">
        <div className="page-header">
          <h1>分级课程体系</h1>
          <p>从一年级到九年级，每个阶段都有清晰的学习目标与配套单元。</p>
        </div>

        {isAuthenticated && (
          <div className="my-grade-banner">
            <div>
              <div className="my-grade-label">当前年级</div>
              <div className="my-grade-name">{grades.find(g => g.id === user?.grade)?.name}</div>
            </div>
            <Link to={`/courses/${user?.grade}`} className="btn btn-primary">
              继续学习 <ArrowRight size={18} />
            </Link>
          </div>
        )}

        <div className="grades-grid">
          {grades.map((grade, i) => {
            const isCurrent = user?.grade === grade.id
            return (
              <motion.div
                key={grade.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to={`/courses/${grade.id}`}
                  className={`grade-card card-hover ${isCurrent ? 'current' : ''}`}
                >
                  <div className="grade-color" style={{ background: grade.theme }} />
                  <div className="grade-info">
                    <h3>{grade.name}</h3>
                    <p>{grade.description}</p>
                    <div className="grade-meta">
                      <span>{grade.totalUnits} 个单元</span>
                      <span>·</span>
                      <span>{grade.totalUnits * 4} 节课程</span>
                    </div>
                  </div>
                  {isCurrent && <span className="current-badge">当前</span>}
                </Link>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
