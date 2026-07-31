import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { grammarData, defaultGrammar } from '@/data/courses'
import { useProgressStore } from '@/store'

interface Props {
  lessonId: string
  xp: number
  gradeId: number
  unitOrder: number
}

export default function GrammarLesson({ lessonId, xp }: Props) {
  const navigate = useNavigate()
  const { completeLesson } = useProgressStore()
  const questions = grammarData[lessonId.replace('-grammar', '')] || defaultGrammar
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [finished, setFinished] = useState(false)

  const q = questions[index]

  const choose = (i: number) => {
    if (answered) return
    setSelected(i)
    setAnswered(true)
    if (i === q.correctIndex) setCorrectCount(c => c + 1)
  }

  const next = async () => {
    if (index < questions.length - 1) {
      setIndex(i => i + 1)
      setSelected(null)
      setAnswered(false)
    } else {
      setFinished(true)
      const score = Math.round((correctCount / questions.length) * 100)
      await completeLesson(lessonId, score, xp)
    }
  }

  if (finished) {
    const score = Math.round((correctCount / questions.length) * 100)
    return (
      <div className="result-card">
        <CheckCircle2 size={64} color="var(--success)" style={{ margin: '0 auto 20px' }} />
        <div className="result-score">{score}</div>
        <div className="result-label">语法练习得分</div>
        <div className="result-xp">+{xp} XP</div>
        <button className="btn btn-primary" onClick={() => navigate('/courses')}>
          返回课程
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="lesson-progress">
        <div className="lesson-progress-fill" style={{ width: `${((index + 1) / questions.length) * 100}%` }} />
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="lesson-card-inner"
        >
          <h2>{q.question}</h2>
          <div className="option-grid">
            {q.options.map((opt, i) => (
              <button
                key={i}
                className={`option-btn ${answered ? (i === q.correctIndex ? 'correct' : i === selected ? 'wrong' : '') : ''}`}
                onClick={() => choose(i)}
                disabled={answered}
              >
                <span className="option-index">{String.fromCharCode(65 + i)}</span>
                {opt}
              </button>
            ))}
          </div>
          {answered && (
            <div className={`feedback ${selected === q.correctIndex ? 'success' : 'error'}`}>
              {selected === q.correctIndex ? '回答正确！' : '回答错误。'}
              <div style={{ marginTop: 8, fontSize: '0.95rem', opacity: 0.9 }}>{q.explanation}</div>
            </div>
          )}
          {answered && (
            <button className="btn btn-primary" onClick={next}>
              {index < questions.length - 1 ? '下一题' : '完成'} <ArrowRight size={18} />
            </button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
