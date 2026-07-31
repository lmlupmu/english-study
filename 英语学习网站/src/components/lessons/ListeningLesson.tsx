import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Headphones, ArrowRight, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { listeningData } from '@/data/listening'
import { useProgressStore } from '@/store'

interface Props {
  lessonId: string
  xp: number
  gradeId: number
  unitOrder: number
}

export default function ListeningLesson({ lessonId, xp }: Props) {
  const navigate = useNavigate()
  const { completeLesson } = useProgressStore()
  const items = listeningData[lessonId.replace('-listening', '')] || listeningData['g1-u1']
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [finished, setFinished] = useState(false)

  const item = items[index]

  const play = () => {
    const utter = new SpeechSynthesisUtterance(item.audioText)
    utter.lang = 'en-US'
    utter.rate = 0.8
    window.speechSynthesis.speak(utter)
  }

  const choose = (i: number) => {
    if (answered) return
    setSelected(i)
    setAnswered(true)
    if (i === item.correctIndex) setCorrectCount(c => c + 1)
  }

  const next = async () => {
    if (index < items.length - 1) {
      setIndex(i => i + 1)
      setSelected(null)
      setAnswered(false)
    } else {
      setFinished(true)
      const score = Math.round((correctCount / items.length) * 100)
      await completeLesson(lessonId, score, xp)
    }
  }

  if (finished) {
    const score = Math.round((correctCount / items.length) * 100)
    return (
      <div className="result-card">
        <CheckCircle2 size={64} color="var(--success)" style={{ margin: '0 auto 20px' }} />
        <div className="result-score">{score}</div>
        <div className="result-label">听力训练得分</div>
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
        <div className="lesson-progress-fill" style={{ width: `${((index + 1) / items.length) * 100}%` }} />
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="lesson-card-inner"
        >
          <button className="btn btn-secondary" onClick={play} style={{ marginBottom: 32 }}>
            <Headphones size={18} /> 播放音频
          </button>

          <h2 style={{ fontSize: '1.2rem', marginBottom: 20 }}>你听到了什么？</h2>
          <div className="option-grid">
            {item.options.map((opt, i) => (
              <button
                key={i}
                className={`option-btn ${answered ? (i === item.correctIndex ? 'correct' : i === selected ? 'wrong' : '') : ''}`}
                onClick={() => choose(i)}
                disabled={answered}
              >
                <span className="option-index">{String.fromCharCode(65 + i)}</span>
                {opt}
              </button>
            ))}
          </div>
          {answered && (
            <div className={`feedback ${selected === item.correctIndex ? 'success' : 'error'}`}>
              {selected === item.correctIndex ? '回答正确！' : '回答错误。'}
              <div style={{ marginTop: 8, fontSize: '0.95rem', opacity: 0.9 }}>原文：{item.audioText}</div>
            </div>
          )}
          {answered && (
            <button className="btn btn-primary" onClick={next}>
              {index < items.length - 1 ? '下一题' : '完成'} <ArrowRight size={18} />
            </button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
