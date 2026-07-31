import { create } from 'zustand'
import type { User, ProgressRecord, Post, DailyGoal } from '@/types'
import { achievements as allAchievements } from '@/data/courses'
import { mockPosts } from '@/data/community'
import { api, setToken, clearToken, toFrontendUser } from '@/api/client'

interface ProgressData {
  records: ProgressRecord[]
  unlockedAchievements: string[]
  dailyGoal: DailyGoal
}

const toProgressData = (data: {
  records: { lesson_id: string; completed_at: string; score: number; xp_earned: number }[]
  unlockedAchievements: string[]
  dailyGoal: { target: number; completed: number }
}): ProgressData => ({
  records: data.records.map(r => ({
    lessonId: r.lesson_id,
    completedAt: r.completed_at,
    score: r.score,
    xpEarned: r.xp_earned,
  })),
  unlockedAchievements: data.unlockedAchievements,
  dailyGoal: data.dailyGoal,
})

const toPosts = (data: { posts: { id: string; author_id: string; author_name: string; content: string; likes: number; created_at: string }[] }): Post[] =>
  data.posts.map(p => ({
    id: p.id,
    authorId: p.author_id,
    authorName: p.author_name,
    content: p.content,
    likes: p.likes,
    createdAt: p.created_at,
  }))

interface UserState {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  error: string
  children: User[]
  login: (email: string, password: string) => Promise<boolean>
  register: (name: string, email: string, password: string, grade: number, role?: 'student' | 'parent') => Promise<boolean>
  logout: () => void
  updateUser: (updates: Partial<User>) => Promise<void>
  bindChild: (childEmail: string) => Promise<boolean>
  loadChildren: () => Promise<void>
  refreshUser: () => Promise<void>
  clearError: () => void
  restoreSession: () => Promise<void>
}

export const useUserStore = create<UserState>()((set, get) => ({
  user: null,
  isAuthenticated: false,
  loading: false,
  error: '',
  children: [],

  restoreSession: async () => {
    set({ loading: true })
    try {
      const { user } = await api.getMe()
      set({ user: toFrontendUser(user), isAuthenticated: true, loading: false })
      await useProgressStore.getState().loadForUser(user.id)
      if (user.role === 'parent') await get().loadChildren()
    } catch {
      clearToken()
      set({ user: null, isAuthenticated: false, loading: false })
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: '' })
    try {
      const { token, user } = await api.login({ email, password })
      setToken(token)
      set({ user: toFrontendUser(user), isAuthenticated: true, loading: false })
      await useProgressStore.getState().loadForUser(user.id)
      if (user.role === 'parent') await get().loadChildren()
      return true
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '登录失败', loading: false })
      return false
    }
  },

  register: async (name, email, password, grade, role = 'student') => {
    set({ loading: true, error: '' })
    try {
      const { token, user } = await api.register({ name, email, password, grade, role })
      setToken(token)
      set({ user: toFrontendUser(user), isAuthenticated: true, loading: false })
      await useProgressStore.getState().loadForUser(user.id)
      if (user.role === 'parent') await get().loadChildren()
      return true
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '注册失败', loading: false })
      return false
    }
  },

  logout: () => {
    clearToken()
    set({ user: null, isAuthenticated: false })
    useProgressStore.setState({ records: [], unlockedAchievements: [], dailyGoal: { target: 60, completed: 0 } })
  },

  updateUser: async updates => {
    const current = get().user
    if (!current) return
    try {
      const backendUpdates: Partial<{ name: string; grade: number; total_xp: number; streak: number; children: string[] }> = {}
      if (updates.name !== undefined) backendUpdates.name = updates.name
      if (updates.grade !== undefined) backendUpdates.grade = updates.grade
      if (updates.totalXp !== undefined) backendUpdates.total_xp = updates.totalXp
      if (updates.streak !== undefined) backendUpdates.streak = updates.streak
      if (updates.children !== undefined) backendUpdates.children = updates.children

      const { user } = await api.updateMe(backendUpdates)
      set({ user: toFrontendUser(user) })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '更新失败' })
    }
  },

  bindChild: async childEmail => {
    try {
      const { user } = await api.bindChild(childEmail)
      set({ user: toFrontendUser(user) })
      await get().loadChildren()
      return true
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '绑定失败' })
      return false
    }
  },

  loadChildren: async () => {
    try {
      const { children } = await api.getChildren()
      set({ children: children.map(toFrontendUser) })
    } catch {
      set({ children: [] })
    }
  },

  refreshUser: async () => {
    try {
      const { user } = await api.getMe()
      set({ user: toFrontendUser(user) })
    } catch {
      // ignore
    }
  },

  clearError: () => set({ error: '' }),
}))

interface ProgressState {
  records: ProgressRecord[]
  unlockedAchievements: string[]
  dailyGoal: DailyGoal
  completeLesson: (lessonId: string, score: number, xp: number) => Promise<void>
  checkAchievements: () => string[]
  unlockAchievement: (id: string) => Promise<void>
  resetDailyGoal: () => Promise<void>
  loadForUser: (userId: string) => Promise<void>
  getChildProgress: (userId: string) => Promise<ProgressData>
}

export const useProgressStore = create<ProgressState>()((set, get) => ({
  records: [],
  unlockedAchievements: [],
  dailyGoal: { target: 60, completed: 0 },

  completeLesson: async (lessonId, score, xp) => {
    await api.completeLesson({ lessonId, score, xp })

    const userStore = useUserStore.getState()
    const user = userStore.user
    const currentUserId = user?.id
    if (currentUserId) {
      await get().loadForUser(currentUserId)
      await userStore.refreshUser()
    }
    const newlyUnlocked = get().checkAchievements()
    for (const id of newlyUnlocked) {
      await get().unlockAchievement(id)
    }
  },

  checkAchievements: () => {
    const { records, unlockedAchievements } = get()
    const user = useUserStore.getState().user
    const newUnlocked = new Set(unlockedAchievements)
    if (records.length >= 1) newUnlocked.add('first-step')
    if (user && user.streak >= 3) newUnlocked.add('streak-3')
    if (user && user.streak >= 7) newUnlocked.add('streak-7')
    const vocabRecords = records.filter(r => r.lessonId.endsWith('-vocab'))
    if (vocabRecords.length >= 10) newUnlocked.add('vocab-master')
    const grammarRecords = records.filter(r => r.lessonId.endsWith('-grammar'))
    if (grammarRecords.length >= 5 && grammarRecords.every(r => r.score >= 90)) newUnlocked.add('grammar-guru')
    if (user && user.totalXp >= 1000) newUnlocked.add('xp-1000')
    const diff = Array.from(newUnlocked).filter(id => !unlockedAchievements.includes(id))
    set({ unlockedAchievements: Array.from(newUnlocked) })
    return diff
  },

  unlockAchievement: async id => {
    if (get().unlockedAchievements.includes(id)) return
    await api.unlockAchievement(id)
    set(state => ({ unlockedAchievements: [...state.unlockedAchievements, id] }))
  },

  resetDailyGoal: async () => {
    set(state => ({ dailyGoal: { ...state.dailyGoal, completed: 0 } }))
  },

  loadForUser: async () => {
    const data = toProgressData(await api.getProgress())
    set(data)
  },

  getChildProgress: async userId => {
    const { records } = await api.getChildProgress(userId)
    return {
      records: records.map(r => ({
        lessonId: r.lesson_id,
        completedAt: r.completed_at,
        score: r.score,
        xpEarned: r.xp_earned,
      })),
      unlockedAchievements: [],
      dailyGoal: { target: 60, completed: 0 },
    }
  },
}))

interface CommunityState {
  posts: Post[]
  loaded: boolean
  loadPosts: () => Promise<void>
  addPost: (content: string, authorName: string) => Promise<void>
  likePost: (id: string) => Promise<void>
}

export const useCommunityStore = create<CommunityState>()((set, get) => ({
  posts: mockPosts,
  loaded: false,

  loadPosts: async () => {
    try {
      const { posts } = await api.getPosts()
      set({ posts: toPosts({ posts }), loaded: true })
    } catch {
      set({ loaded: true })
    }
  },

  addPost: async (content, authorName) => {
    const { post } = await api.createPost({ content, authorName })
    set(state => ({
      posts: [{
        id: post.id,
        authorId: post.author_id,
        authorName: post.author_name,
        content: post.content,
        likes: post.likes,
        createdAt: post.created_at,
      }, ...state.posts],
    }))
    await useProgressStore.getState().unlockAchievement('social-butterfly')
  },

  likePost: async id => {
    await api.likePost(id)
    set(state => ({
      posts: state.posts.map(p => (p.id === id ? { ...p, likes: p.likes + 1 } : p)),
    }))
  },
}))

export const getAchievements = () => allAchievements

// Restore session on app load
useUserStore.getState().restoreSession()
