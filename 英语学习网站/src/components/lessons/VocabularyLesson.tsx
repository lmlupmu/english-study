import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Volume2, ArrowRight, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { vocabData, defaultVocab } from '@/data/courses'
import { useProgressStore } from '@/store'

interface Props {
  lessonId: string
  xp: number
  gradeId: number
  unitOrder: number
}

export default function VocabularyLesson({ lessonId, xp, gradeId: _gradeId, unitOrder: _unitOrder }: Props) {
  const navigate = useNavigate()
  const { completeLesson } = useProgressStore()
  const items = vocabData[lessonId.replace('-vocab', '')] || defaultVocab
  const [index, setIndex] = useState(0)
  const [showExample, setShowExample] = useState(false)
  const [finished, setFinished] = useState(false)

  const item = items[index]

  const speak = (text: string) => {
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = 'en-US'
    utter.rate = 0.85
    window.speechSynthesis.speak(utter)
  }

  const next = () => {
    if (index < items.length - 1) {
      setIndex(i => i + 1)
      setShowExample(false)
    } else {
      setFinished(true)
      completeLesson(lessonId, 100, xp)
    }
  }

  if (finished) {
    return (
      <div className="result-card">
        <CheckCircle2 size={64} color="var(--success)" style={{ margin: '0 auto 20px' }} />
        <div className="result-score">100</div>
        <div className="result-label">单词记忆完成</div>
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
          <h2>{item.word}</h2>
          <div className="phonetic">{item.phonetic}</div>
          <div className="meaning">{item.meaning}</div>
          {showExample && (
            <>
              <div className="example">{item.example}</div>
              <div className="translation">{item.translation}</div>
            </>
          )}
          <div className="lesson-actions">
            <button className="btn btn-secondary" onClick={() => speak(item.word)}>
              <Volume2 size={18} /> 朗读
            </button>
            {!showExample ? (
              <button className="btn btn-secondary" onClick={() => setShowExample(true)}>
                查看例句
              </button>
            ) : (
              <button className="btn btn-primary" onClick={next}>
                {index < items.length - 1 ? '下一个' : '完成'} <ArrowRight size={18} />
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
