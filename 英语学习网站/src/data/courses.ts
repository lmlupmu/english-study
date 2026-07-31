import type { Grade, Unit, VocabularyItem, GrammarQuestion, SpeakingItem, ListeningItem } from '@/types'
import { vocabGrades1to3 } from './vocab/grades1-3'
import { vocabGrades4to6 } from './vocab/grades4-6'
import { vocabGrades7to9 } from './vocab/grades7-9'
import { grammarData, defaultGrammar } from './grammar'
import { speakingData, defaultSpeaking } from './speaking'
import { listeningData } from './listening'

export const grades: Grade[] = [
  { id: 1, name: '一年级', description: '启蒙英语，培养兴趣与基础语感', theme: '#f59e0b', totalUnits: 4 },
  { id: 2, name: '二年级', description: '简单句型与日常对话入门', theme: '#10b981', totalUnits: 4 },
  { id: 3, name: '三年级', description: '词汇扩展与基础语法建立', theme: '#3b82f6', totalUnits: 5 },
  { id: 4, name: '四年级', description: '时态启蒙与阅读理解起步', theme: '#8b5cf6', totalUnits: 5 },
  { id: 5, name: '五年级', description: '综合语法与短篇写作训练', theme: '#ec4899', totalUnits: 6 },
  { id: 6, name: '六年级', description: '小升初衔接与综合能力提升', theme: '#06b6d4', totalUnits: 6 },
  { id: 7, name: '七年级', description: '初中基础语法与听说读写并重', theme: '#6366f1', totalUnits: 6 },
  { id: 8, name: '八年级', description: '复杂句型与阅读理解深化', theme: '#f97316', totalUnits: 7 },
  { id: 9, name: '九年级', description: '中考冲刺与综合语言运用', theme: '#ef4444', totalUnits: 7 },
]

const unitDescriptions: Record<number, string[]> = {
  1: ['打招呼与自我介绍', '数字与颜色', '家庭成员', '常见动物'],
  2: ['我的学校', '日常活动', '食物与饮料', '季节与天气'],
  3: ['我的爱好', '购物与价格', '旅行计划', '健康习惯', '节日文化'],
  4: ['过去的故事', '未来的梦想', '自然世界', '规则与安全', '友谊与合作'],
  5: ['难忘的旅行', '科技与改变', '环境保护', '职业规划', '文化传承', '健康生活'],
  6: ['世界大观', '问题解决', '志愿精神', '创意表达', '批判思考', '毕业展望'],
  7: ['新学期新目标', '我的日常生活', '旅行见闻', '学校生活', '兴趣爱好', '健康饮食'],
  8: ['成长故事', '科技创新', '社会责任', '文学艺术', '环境保护', '职业规划', '健康生活'],
  9: ['中考高频词汇', '语法总复习', '阅读理解策略', '听力冲刺', '写作提升', '模拟训练', '考前冲刺'],
}

export const generateUnits = (gradeId: number): Unit[] => {
  const grade = grades.find(g => g.id === gradeId)
  const count = grade?.totalUnits || 4
  return Array.from({ length: count }, (_, i) => ({
    id: `g${gradeId}-u${i + 1}`,
    gradeId,
    title: `Unit ${i + 1}`,
    description: unitDescriptions[gradeId]?.[i] || `核心单元 ${i + 1}`,
    order: i + 1,
    lessons: [
      { id: `g${gradeId}-u${i + 1}-vocab`, unitId: `g${gradeId}-u${i + 1}`, title: '单词记忆', type: 'vocabulary', duration: 10, xp: 20 },
      { id: `g${gradeId}-u${i + 1}-grammar`, unitId: `g${gradeId}-u${i + 1}`, title: '语法练习', type: 'grammar', duration: 12, xp: 25 },
      { id: `g${gradeId}-u${i + 1}-speaking`, unitId: `g${gradeId}-u${i + 1}`, title: '口语跟读', type: 'speaking', duration: 8, xp: 20 },
      { id: `g${gradeId}-u${i + 1}-listening`, unitId: `g${gradeId}-u${i + 1}`, title: '听力训练', type: 'listening', duration: 10, xp: 20 },
    ],
  }))
}

// 合并所有年级词库
const allVocabByGrade: Record<number, VocabularyItem[]> = {
  ...vocabGrades1to3,
  ...vocabGrades4to6,
  ...vocabGrades7to9,
}

// 根据年级获取词汇总数
const vocabPerGrade: Record<number, number> = {
  1: 400, 2: 400, 3: 400, 4: 400, 5: 400, 6: 400,
  7: 600, 8: 600, 9: 600,
}

// 智能分配：根据unitId获取对应年级的30个单词
export function getVocabForUnit(unitId: string, gradeId: number): VocabularyItem[] {
  const unitMatch = unitId.match(/g(\d+)-u(\d+)/)
  if (!unitMatch) return allVocabByGrade[gradeId]?.slice(0, 30) || []

  const grade = parseInt(unitMatch[1])
  const unitNum = parseInt(unitMatch[2])
  const totalUnits = grades.find(g => g.id === grade)?.totalUnits || 4
  const totalWords = vocabPerGrade[grade] || 400

  const pool = allVocabByGrade[grade] || []
  const perUnit = Math.floor(totalWords / totalUnits)
  const start = (unitNum - 1) * perUnit

  return pool.slice(start, start + 30)
}

// 导出所有数据源
export { grammarData, defaultGrammar, speakingData, defaultSpeaking, listeningData }

// 向后兼容的类型导出
export type { VocabularyItem, GrammarQuestion, SpeakingItem, ListeningItem }