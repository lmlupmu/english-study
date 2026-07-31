import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mic, Volume2, ArrowRight, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { speakingData, defaultSpeaking } from '@/data/speaking'
import { useProgressStore } from '@/store'

interface Props {
  lessonId: string
  xp: number
  gradeId: number
  unitOrder: number
}

export default function SpeakingLesson({ lessonId, xp }: Props) {
  const navigate = useNavigate()
  const { completeLesson } = useProgressStore()
  const items = speakingData[lessonId.replace('-speaking', '')] || defaultSpeaking
  const [index, setIndex] = useState(0)
  const [listening, setListening] = useState(false)
  const [result, setResult] = useState<'idle' | 'success' | 'error'>('idle')
  const [heard, setHeard] = useState('')
  const [finished, setFinished] = useState(false)

  const item = items[index]

  const speak = (text: string) => {
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = 'en-US'
    utter.rate = 0.85
    window.speechSynthesis.speak(utter)
  }

  const normalize = (text: string) => text.toLowerCase().replace(/[^a-z]/g, '').trim()

  const startListen = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      setHeard('')
      setResult('success')
      return
    }
    setHeard('')
    setResult('idle')
    const rec = new SR()
    rec.lang = 'en-US'
    rec.interimResults = false
    rec.maxAlternatives = 1
    rec.onstart = () => setListening(true)
    rec.onend = () => setListening(false)
    rec.onresult = (e: SpeechRecognitionEvent) => {
      const saidRaw = e.results[0][0].transcript
      const said = normalize(saidRaw)
      const target = normalize(item.sentence)
      const confidence = e.results[0][0].confidence
      setHeard(saidRaw)

      if (!said || said.length < 2) {
        setResult('error')
        return
      }

      const exactMatch = said === target
      const contained = target.includes(said) && said.length >= target.length * 0.7
      const highConfidence = confidence >= 0.75

      setResult(exactMatch || (contained && highConfidence) ? 'success' : 'error')
    }
    rec.onerror = () => {
      setListening(false)
      setHeard('')
      setResult('error')
    }
    rec.start()
  }

  const next = async () => {
    if (index < items.length - 1) {
      setIndex(i => i + 1)
      setResult('idle')
      setHeard('')
    } else {
      setFinished(true)
      await completeLesson(lessonId, 100, xp)
    }
  }

  if (finished) {
    return (
      <div className="result-card">
        <CheckCircle2 size={64} color="var(--success)" style={{ margin: '0 auto 20px' }} />
        <div className="result-score">100</div>
        <div className="result-label">口语跟读完成</div>
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
          <div className="speak-display">{item.sentence}</div>
          <div className="speak-phonetic">{item.phonetic}</div>
          <div className="speak-meaning">{item.meaning}</div>

          <button className={`mic-btn ${listening ? 'listening' : ''}`} onClick={startListen} disabled={listening}>
            <Mic size={32} />
          </button>
          <div style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
            {listening ? '正在聆听...' : '点击麦克风跟读'}
          </div>

          {result !== 'idle' && (
            <div className={`feedback ${result === 'success' ? 'success' : 'error'}`}>
              <div>{result === 'success' ? '发音正确，很棒！' : '再试一次，注意语调和节奏。'}</div>
              {heard && <div style={{ marginTop: 8, fontSize: '0.9rem', opacity: 0.85 }}>识别到：{heard}</div>}
            </div>
          )}

          <div className="lesson-actions">
            <button className="btn btn-secondary" onClick={() => speak(item.sentence)}>
              <Volume2 size={18} /> 播放原声
            </button>
            {result === 'success' && (
              <button className="btn btn-primary" onClick={next}>
                {index < items.length - 1 ? '下一个' : '完成'} <ArrowRight size={18} />
              </button>
            )}
            {result === 'error' && (
              <button className="btn btn-secondary" onClick={() => setResult('idle')}>
                重试
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
