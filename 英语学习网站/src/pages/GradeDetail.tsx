import { useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, BookOpen, Brain, Mic, Headphones, CheckCircle2 } from 'lucide-react'
import { grades, generateUnits, getVocabForUnit } from '@/data/courses'
import { useProgressStore } from '@/store'
import './GradeDetail.css'

const typeIcons = {
  vocabulary: BookOpen,
  grammar: Brain,
  speaking: Mic,
  listening: Headphones,
}

const typeLabels = {
  vocabulary: '单词',
  grammar: '语法',
  speaking: '口语',
  listening: '听力',
}

export default function GradeDetail() {
  const { gradeId } = useParams<{ gradeId: string }>()
  const grade = grades.find(g => g.id === Number(gradeId))
  const units = useMemo(() => generateUnits(Number(gradeId)), [gradeId])
  const { records } = useProgressStore()

  if (!grade) return <div className="container page">年级不存在</div>

  const isCompleted = (lessonId: string) => records.some(r => r.lessonId === lessonId)

  return (
    <div className="page grade-detail">
      <div className="container">
        <Link to="/courses" className="back-link">
          <ArrowLeft size={18} /> 返回课程列表
        </Link>

        <div className="page-header" style={{ borderLeftColor: grade.theme }}>
          <h1>{grade.name}</h1>
          <p>{grade.description}</p>
        </div>

        <div className="units-list">
          {units.map((unit, ui) => (
            <motion.div
              key={unit.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: ui * 0.08 }}
              className="unit-card"
            >
              <div className="unit-header">
                <div className="unit-number" style={{ background: grade.theme }}>{unit.order}</div>
                <div>
                  <h2 className="unit-title">{unit.title}</h2>
                  <p className="unit-desc">{unit.description}</p>
                </div>
              </div>
              <div className="lessons-grid">
                {unit.lessons.map(lesson => {
                  const Icon = typeIcons[lesson.type]
                  const completed = isCompleted(lesson.id)
                  return (
                    <Link
                      key={lesson.id}
                      to={`/lesson/${lesson.id}`}
                      className={`lesson-card card-hover ${completed ? 'completed' : ''}`}
                    >
                      <div className="lesson-icon">
                        <Icon size={20} />
                      </div>
                      <div className="lesson-info">
                        <div className="lesson-title">{lesson.title}</div>
                        <div className="lesson-meta">
                          {lesson.type === 'vocabulary'
                            ? `${getVocabForUnit(unit.id, Number(gradeId)).length} 单词 · ${lesson.duration} 分钟 · ${lesson.xp} XP`
                            : `${typeLabels[lesson.type]} · ${lesson.duration} 分钟 · ${lesson.xp} XP`}
                        </div>
                      </div>
                      {completed && <CheckCircle2 size={20} className="completed-icon" />}
                    </Link>
                  )
                })}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
