import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Volume2, ArrowRight, CheckCircle2, Eye, Brain, RotateCw, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { getVocabForUnit } from '@/data/courses'
import { useProgressStore } from '@/store'
import type { VocabularyItem } from '@/types'

interface Props {
  lessonId: string
  xp: number
  gradeId: number
  unitOrder: number
}

type Mode = 'learn' | 'recognize' | 'spell' | 'review'
type Phase = 'intro' | 'practice' | 'done'

// 打乱数组（Fisher-Yates）
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// 生成选择题干扰项
function makeDistractors(correct: string, pool: string[], count = 3): string[] {
  const others = pool.filter(w => w !== correct)
  return shuffle(others).slice(0, count)
}

export default function VocabularyLesson({ lessonId, xp, gradeId }: Props) {
  const navigate = useNavigate()
  const { completeLesson } = useProgressStore()
  const unitId = lessonId.replace('-vocab', '')
  const baseItems = useMemo(() => getVocabForUnit(unitId, gradeId), [unitId, gradeId])

  const [mode, setMode] = useState<Mode>('learn')
  const [phase, setPhase] = useState<Phase>('intro')
  const [index, setIndex] = useState(0)
  const [showExample, setShowExample] = useState(false)
  const [showMeaning, setShowMeaning] = useState(false)

  // 练习阶段状态
  const [options, setOptions] = useState<string[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)
  const [spellInput, setSpellInput] = useState('')
  const [spellFeedback, setSpellFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [correctCount, setCorrectCount] = useState(0)
  const [wrongItems, setWrongItems] = useState<VocabularyItem[]>([])

  // 生成练习题序（打乱）
  const practiceOrder = useMemo(() => shuffle(baseItems), [baseItems])
  const allWords = useMemo(() => baseItems.map(i => i.meaning), [baseItems])

  const item =
    mode === 'learn' ? baseItems[index] :
    mode === 'review' ? wrongItems[index] :
    practiceOrder[index]

  // 朗读
  const speak = (text: string) => {
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = 'en-US'
    utter.rate = 0.85
    window.speechSynthesis.speak(utter)
  }

  // 进入新模式时重置状态
  useEffect(() => {
    setIndex(0)
    setSelected(null)
    setAnswered(false)
    setShowExample(false)
    setShowMeaning(false)
    setSpellInput('')
    setSpellFeedback('idle')
  }, [mode])

  // 生成认词选项（仅在认词模式或复习模式下生成）
  useEffect(() => {
    if ((mode === 'recognize' || mode === 'review') && item && phase === 'practice') {
      const correctMeaning = item.meaning
      const distract = makeDistractors(correctMeaning, allWords, 3)
      setOptions(shuffle([correctMeaning, ...distract]))
      setSelected(null)
      setAnswered(false)
    }
  }, [mode, phase, item, allWords])

  // ========== 学习模式（卡片浏览） ==========
  const handleLearnNext = () => {
    if (index < baseItems.length - 1) {
      setIndex(i => i + 1)
      setShowExample(false)
      setShowMeaning(false)
    } else {
      setMode('recognize')
      setPhase('practice')
    }
  }

  // ========== 认词模式（选择题） ==========
  const chooseOption = (i: number) => {
    if (answered) return
    setSelected(i)
    setAnswered(true)
    const correctIdx = options.indexOf(item.meaning)
    if (i === correctIdx) setCorrectCount(c => c + 1)
    else setWrongItems(prev => prev.includes(item) ? prev : [...prev, item])
  }

  const handleRecognizeNext = () => {
    if (index < practiceOrder.length - 1) {
      setIndex(i => i + 1)
    } else {
      setMode('spell')
      setIndex(0)
      setPhase('practice')
    }
  }

  // ========== 拼写模式 ==========
  const checkSpell = () => {
    if (!spellInput.trim()) return
    const normalized = spellInput.trim().toLowerCase()
    const target = item.word.toLowerCase()
    if (normalized === target) {
      setSpellFeedback('correct')
      setCorrectCount(c => c + 1)
    } else {
      setSpellFeedback('wrong')
      setWrongItems(prev => prev.includes(item) ? prev : [...prev, item])
    }
  }

  const handleSpellNext = () => {
    if (index < practiceOrder.length - 1) {
      setIndex(i => i + 1)
      setSpellInput('')
      setSpellFeedback('idle')
    } else {
      // 有错题进入复习，否则完成
      if (wrongItems.length > 0) {
        setMode('review')
        setIndex(0)
      } else {
        finishLesson()
      }
    }
  }

  // ========== 复习模式 ==========
  const handleReviewNext = () => {
    if (index < wrongItems.length - 1) {
      setIndex(i => i + 1)
      setShowExample(false)
      setShowMeaning(false)
    } else {
      finishLesson()
    }
  }

  const finishLesson = async () => {
    setPhase('done')
    const total = baseItems.length * 3 // 学习+认词+拼写
    const score = Math.min(100, Math.round((correctCount / total) * 100))
    await completeLesson(lessonId, Math.max(60, score), xp)
  }

  // ========== 渲染：完成页 ==========
  if (phase === 'done') {
    const total = baseItems.length * 3
    const score = Math.min(100, Math.round((correctCount / total) * 100))
    return (
      <div className="result-card">
        <CheckCircle2 size={64} color="var(--success)" style={{ margin: '0 auto 20px' }} />
        <div className="result-score">{Math.max(60, score)}</div>
        <div className="result-label">单词记忆完成</div>
        <div className="result-stats">
          <span><Brain size={14} /> 掌握 {baseItems.length} 词</span>
          <span><Sparkles size={14} /> 正确 {correctCount}/{total}</span>
        </div>
        <div className="result-xp">+{xp} XP</div>
        <button className="btn btn-primary" onClick={() => navigate('/courses')}>
          返回课程
        </button>
      </div>
    )
  }

  // ========== 渲染：学习模式介绍页 ==========
  if (phase === 'intro' && mode === 'learn') {
    return (
      <div className="mode-intro">
        <div className="mode-intro-icon"><Brain size={48} /></div>
        <h2>单词记忆</h2>
        <p className="mode-intro-desc">共 {baseItems.length} 个单词，分 4 个阶段学习</p>
        <div className="mode-steps">
          <div className="mode-step"><span className="step-num">1</span> 卡片学习：浏览单词、释义、例句</div>
          <div className="mode-step"><span className="step-num">2</span> 认词练习：看英文选中文释义</div>
          <div className="mode-step"><span className="step-num">3</span> 拼写测试：根据中文拼写英文</div>
          <div className="mode-step"><span className="step-num">4</span> 错题复习：巩固未掌握的单词</div>
        </div>
        <button className="btn btn-primary" onClick={() => setPhase('practice')}>
          开始学习 <ArrowRight size={18} />
        </button>
      </div>
    )
  }

  // ========== 渲染：学习模式（卡片） ==========
  if (mode === 'learn') {
    return (
      <div>
        <div className="mode-badge">阶段 1/4 · 卡片学习</div>
        <div className="lesson-progress">
          <div className="lesson-progress-fill" style={{ width: `${((index + 1) / baseItems.length) * 100}%` }} />
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={`learn-${index}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="lesson-card-inner"
          >
            <div className="word-card">
              <div className="word-text">{item.word}</div>
              <button className="phonetic-btn" onClick={() => speak(item.word)}>
                <Volume2 size={16} /> {item.phonetic}
              </button>
              <div className="pos-badge">{item.partOfSpeech}</div>

              {showMeaning ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="meaning-block">
                  <div className="meaning">{item.meaning}</div>
                </motion.div>
              ) : (
                <button className="btn btn-ghost reveal-btn" onClick={() => setShowMeaning(true)}>
                  <Eye size={16} /> 点击显示释义
                </button>
              )}

              {showExample && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="example-block">
                  <div className="example">{item.example}</div>
                  <div className="translation">{item.translation}</div>
                </motion.div>
              )}

              {item.synonyms && item.synonyms.length > 0 && showMeaning && (
                <div className="word-relations">
                  <span className="relation-label">近义词：</span>
                  {item.synonyms.map(s => <span key={s} className="relation-tag">{s}</span>)}
                </div>
              )}
              {item.antonyms && item.antonyms.length > 0 && showMeaning && (
                <div className="word-relations">
                  <span className="relation-label">反义词：</span>
                  {item.antonyms.map(s => <span key={s} className="relation-tag">{s}</span>)}
                </div>
              )}
              {item.collocations && item.collocations.length > 0 && showMeaning && (
                <div className="word-relations">
                  <span className="relation-label">搭配：</span>
                  {item.collocations.map(s => <span key={s} className="relation-tag">{s}</span>)}
                </div>
              )}
            </div>

            <div className="lesson-actions">
              <button className="btn btn-secondary" onClick={() => speak(item.word)}>
                <Volume2 size={18} /> 朗读
              </button>
              {!showExample ? (
                <button className="btn btn-secondary" onClick={() => setShowExample(true)}>
                  查看例句
                </button>
              ) : (
                <button className="btn btn-primary" onClick={handleLearnNext}>
                  {index < baseItems.length - 1 ? '下一个' : '进入认词练习'} <ArrowRight size={18} />
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    )
  }

  // ========== 渲染：认词模式（选择题） ==========
  if (mode === 'recognize') {
    const correctIdx = options.indexOf(item.meaning)
    return (
      <div>
        <div className="mode-badge">阶段 2/4 · 认词练习</div>
        <div className="lesson-progress">
          <div className="lesson-progress-fill" style={{ width: `${((index + 1) / practiceOrder.length) * 100}%` }} />
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={`rec-${index}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="lesson-card-inner"
          >
            <div className="prompt-text">这个单词是什么意思？</div>
            <h2 className="word-prompt">
              {item.word}
              <button className="phonetic-btn-inline" onClick={() => speak(item.word)}>
                <Volume2 size={18} />
              </button>
            </h2>
            <div className="phonetic-hint">{item.phonetic}</div>

            <div className="option-grid">
              {options.map((opt, i) => (
                <button
                  key={i}
                  className={`option-btn ${answered ? (i === correctIdx ? 'correct' : i === selected ? 'wrong' : '') : ''}`}
                  onClick={() => chooseOption(i)}
                  disabled={answered}
                >
                  <span className="option-index">{String.fromCharCode(65 + i)}</span>
                  {opt}
                </button>
              ))}
            </div>

            {answered && (
              <div className={`feedback ${selected === correctIdx ? 'success' : 'error'}`}>
                {selected === correctIdx ? '回答正确！' : `正确答案：${item.meaning}`}
                <div className="feedback-example">{item.example}</div>
              </div>
            )}
            {answered && (
              <button className="btn btn-primary" onClick={handleRecognizeNext}>
                {index < practiceOrder.length - 1 ? '下一个' : '进入拼写测试'} <ArrowRight size={18} />
              </button>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    )
  }

  // ========== 渲染：拼写模式 ==========
  if (mode === 'spell') {
    return (
      <div>
        <div className="mode-badge">阶段 3/4 · 拼写测试</div>
        <div className="lesson-progress">
          <div className="lesson-progress-fill" style={{ width: `${((index + 1) / practiceOrder.length) * 100}%` }} />
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={`spell-${index}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="lesson-card-inner"
          >
            <div className="prompt-text">请拼写这个单词</div>
            <h2 className="meaning-prompt">{item.meaning}</h2>
            <div className="phonetic-hint">{item.phonetic}</div>
            <div className="pos-hint">{item.partOfSpeech}</div>

            {spellFeedback !== 'correct' && (
              <button className="btn btn-ghost hint-btn" onClick={() => speak(item.word)}>
                <Volume2 size={16} /> 听发音提示
              </button>
            )}

            <input
              type="text"
              className={`spell-input ${spellFeedback !== 'idle' ? spellFeedback : ''}`}
              value={spellInput}
              onChange={e => setSpellInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && spellFeedback === 'idle') checkSpell() }}
              placeholder="输入英文单词..."
              disabled={spellFeedback !== 'idle'}
              autoFocus
            />

            {spellFeedback === 'wrong' && (
              <div className="spell-reveal">
                正确答案：<strong>{item.word}</strong>
              </div>
            )}

            {spellFeedback !== 'idle' && (
              <div className={`feedback ${spellFeedback}`}>
                {spellFeedback === 'correct' ? '拼写正确！' : '拼写错误，加油！'}
              </div>
            )}

            <div className="lesson-actions">
              {spellFeedback === 'idle' ? (
                <button className="btn btn-primary" onClick={checkSpell} disabled={!spellInput.trim()}>
                  确认 <ArrowRight size={18} />
                </button>
              ) : (
                <button className="btn btn-primary" onClick={handleSpellNext}>
                  {index < practiceOrder.length - 1 ? '下一个' : (wrongItems.length > 0 ? '进入错题复习' : '完成')} <ArrowRight size={18} />
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    )
  }

  // ========== 渲染：复习模式 ==========
  if (mode === 'review' && item) {
    return (
      <div>
        <div className="mode-badge review-badge"><RotateCw size={12} /> 阶段 4/4 · 错题复习</div>
        <div className="lesson-progress">
          <div className="lesson-progress-fill" style={{ width: `${((index + 1) / wrongItems.length) * 100}%` }} />
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={`review-${index}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="lesson-card-inner"
          >
            <div className="word-card">
              <div className="word-text">{item.word}</div>
              <button className="phonetic-btn" onClick={() => speak(item.word)}>
                <Volume2 size={16} /> {item.phonetic}
              </button>
              <div className="pos-badge">{item.partOfSpeech}</div>

              {showMeaning ? (
                <div className="meaning-block">
                  <div className="meaning">{item.meaning}</div>
                </div>
              ) : (
                <button className="btn btn-ghost reveal-btn" onClick={() => setShowMeaning(true)}>
                  <Eye size={16} /> 点击显示释义
                </button>
              )}

              {showExample && (
                <div className="example-block">
                  <div className="example">{item.example}</div>
                  <div className="translation">{item.translation}</div>
                </div>
              )}
            </div>

            <div className="lesson-actions">
              <button className="btn btn-secondary" onClick={() => speak(item.word)}>
                <Volume2 size={18} /> 朗读
              </button>
              {!showExample ? (
                <button className="btn btn-secondary" onClick={() => setShowExample(true)}>
                  查看例句
                </button>
              ) : (
                <button className="btn btn-primary" onClick={handleReviewNext}>
                  {index < wrongItems.length - 1 ? '下一个' : '完成复习'} <ArrowRight size={18} />
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    )
  }

  // 复习模式但无错题
  if (mode === 'review' && wrongItems.length === 0) {
    finishLesson()
  }

  return null
}
