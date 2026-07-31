export interface User {
  id: string
  name: string
  email: string
  password?: string
  grade: number
  avatar?: string
  streak: number
  totalXp: number
  registeredAt: string
  role: 'student' | 'parent'
  children?: string[]
}

export interface Grade {
  id: number
  name: string
  description: string
  theme: string
  totalUnits: number
}

export interface Unit {
  id: string
  gradeId: number
  title: string
  description: string
  order: number
  lessons: Lesson[]
}

export interface Lesson {
  id: string
  unitId: string
  title: string
  type: 'vocabulary' | 'grammar' | 'speaking' | 'listening'
  duration: number
  xp: number
}

export interface VocabularyItem {
  word: string
  phonetic: string
  meaning: string
  example: string
  translation: string
}

export interface GrammarQuestion {
  id: string
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

export interface SpeakingItem {
  sentence: string
  phonetic: string
  meaning: string
}

export interface ListeningItem {
  audioText: string
  options: string[]
  correctIndex: number
}

export interface ProgressRecord {
  lessonId: string
  completedAt: string
  score: number
  xpEarned: number
}

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlockedAt?: string
}

export interface Post {
  id: string
  authorId: string
  authorName: string
  authorAvatar?: string
  content: string
  likes: number
  comments: number
  createdAt: string
}

export interface DailyGoal {
  target: number
  completed: number
}
