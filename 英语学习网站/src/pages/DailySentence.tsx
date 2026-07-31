import { useEffect, useState } from 'react'
import { Volume2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { getDailySentence } from '@/data/dailySentences'
import type { SpeakingItem } from '@/types'
import './DailySentence.css'

export default function DailySentence() {
  const [sentence, setSentence] = useState<SpeakingItem | null>(null)

  useEffect(() => {
    setSentence(getDailySentence())
  }, [])

  const speak = () => {
    if (!sentence) return
    const utter = new SpeechSynthesisUtterance(sentence.sentence)
    utter.lang = 'en-US'
    utter.rate = 0.85
    window.speechSynthesis.speak(utter)
  }

  if (!sentence) return null

  return (
    <div className="daily-sentence-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sentence-card"
      >
        <div className="sentence-header">
          <span className="sentence-badge">每日一句</span>
        </div>
        <div className="sentence-content">
          <h2 className="sentence-en">{sentence.sentence}</h2>
          <div className="sentence-phonetic">{sentence.phonetic}</div>
          <div className="sentence-cn">{sentence.meaning}</div>
        </div>
        <div className="sentence-actions">
          <button className="btn btn-secondary" onClick={speak}>
            <Volume2 size={18} /> 朗读
          </button>
        </div>
      </motion.div>
    </div>
  )
}