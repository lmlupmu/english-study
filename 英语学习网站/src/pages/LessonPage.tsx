import { useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { grades, generateUnits } from '@/data/courses'
import VocabularyLesson from '@/components/lessons/VocabularyLesson'
import GrammarLesson from '@/components/lessons/GrammarLesson'
import SpeakingLesson from '@/components/lessons/SpeakingLesson'
import ListeningLesson from '@/components/lessons/ListeningLesson'
import './LessonPage.css'

export default function LessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>()

  const { lesson, grade, unit } = useMemo(() => {
    if (!lessonId) return { lesson: undefined, grade: undefined, unit: undefined }
    const parts = lessonId.split('-')
    const gradeId = Number(parts[0].slice(1))
    const unitOrder = Number(parts[1].slice(1))
    const grade = grades.find(g => g.id === gradeId)
    const units = generateUnits(gradeId)
    const unit = units.find(u => u.order === unitOrder)
    const lesson = unit?.lessons.find(l => l.id === lessonId)
    return { lesson, grade, unit }
  }, [lessonId])

  if (!lesson || !grade || !unit) {
    return (
      <div className="container page">
        <h1>课程不存在</h1>
        <Link to="/courses">返回课程列表</Link>
      </div>
    )
  }

  return (
    <div className="page lesson-page">
      <div className="container lesson-container">
        <Link to={`/courses/${grade.id}`} className="back-link">
          <ArrowLeft size={18} /> 返回 {grade.name}
        </Link>

        <div className="lesson-header">
          <div className="lesson-breadcrumb">
            {grade.name} / {unit.title} / {lesson.title}
          </div>
          <h1>{lesson.title}</h1>
          <p>预计 {lesson.duration} 分钟 · 完成可获得 {lesson.xp} XP</p>
        </div>

        <div className="lesson-stage">
          {lesson.type === 'vocabulary' && <VocabularyLesson lessonId={lesson.id} xp={lesson.xp} gradeId={grade.id} unitOrder={unit.order} />}
          {lesson.type === 'grammar' && <GrammarLesson lessonId={lesson.id} xp={lesson.xp} gradeId={grade.id} unitOrder={unit.order} />}
          {lesson.type === 'speaking' && <SpeakingLesson lessonId={lesson.id} xp={lesson.xp} gradeId={grade.id} unitOrder={unit.order} />}
          {lesson.type === 'listening' && <ListeningLesson lessonId={lesson.id} xp={lesson.xp} gradeId={grade.id} unitOrder={unit.order} />}
        </div>
      </div>
    </div>
  )
}
