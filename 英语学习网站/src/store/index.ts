import { create } from 'zustand'
import type { User, ProgressRecord, Post, DailyGoal } from '@/types'

import { mockPosts } from '@/data/community'
import { api, setToken, clearToken, getToken, toFrontendUser } from '@/api/client'

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
  setupAdmin: (setupKey: string, name: string, email: string, password: string) => Promise<boolean>
  logout: () => void
  updateUser: (updates: Partial<User>) => Promise<void>
  bindChild: (childEmail: string) => Promise<boolean>
  loadChildren: () => Promise<void>
  refreshUser: () => Promise<void>
  syncFromServer: () => Promise<void>
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
    // 没有 token 直接跳过，避免每次打开页面都触发一次无意义的 401
    if (!getToken()) {
      set({ user: null, isAuthenticated: false, loading: false })
      return
    }
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

  // 跨设备同步：从服务端拉取最新的用户信息、学习进度、(家长)孩子列表
  // 在窗口重新获得焦点 / 页面重新可见 / 网络恢复时调用，
  // 保证从电脑端切到手机端（或反之）时看到的数据始终是最新的
  syncFromServer: async () => {
    const current = get().user
    if (!current || !getToken()) return
    try {
      const [meRes, progressData] = await Promise.all([api.getMe(), api.getProgress()])
      set({ user: toFrontendUser(meRes.user) })
      useProgressStore.setState(toProgressData(progressData))
      if (meRes.user.role === 'parent') await get().loadChildren()
    } catch {
      // 401 已在 client 内处理；其它错误静默忽略，避免打断用户
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

  // 一次性创建管理员账号：使用 ADMIN_SETUP_KEY 校验，仅可创建一次
  setupAdmin: async (setupKey, name, email, password) => {
    set({ loading: true, error: '' })
    try {
      const { token, user } = await api.adminSetup({ setupKey, name, email, password })
      setToken(token)
      set({ user: toFrontendUser(user), isAuthenticated: true, loading: false })
      return true
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '创建管理员失败', loading: false })
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

export const useCommunityStore = create<CommunityState>()((set) => ({
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
  },

  likePost: async id => {
    await api.likePost(id)
    set(state => ({
      posts: state.posts.map(p => (p.id === id ? { ...p, likes: p.likes + 1 } : p)),
    }))
  },
}))

// 应用启动时恢复登录会话
useUserStore.getState().restoreSession()

// ─────────────────────────────────────────────────────────────
// 跨设备数据自动同步
// 当用户从电脑端切到手机端（或反过来）时，另一端通常已经处于登录态，
// 但本地内存中的数据可能是旧的。这里监听以下事件触发服务端拉取：
//   1. window focus       —— 切回当前标签页
//   2. visibilitychange   —— 页面重新可见（含从后台切回前台）
//   3. online             —— 网络从断开恢复
// 同时做 5 秒防抖，避免短时间内重复请求。
// ─────────────────────────────────────────────────────────────
if (typeof window !== 'undefined') {
  let lastSyncAt = 0
  const SYNC_DEBOUNCE_MS = 5000

  const triggerSync = () => {
    const now = Date.now()
    if (now - lastSyncAt < SYNC_DEBOUNCE_MS) return
    lastSyncAt = now
    void useUserStore.getState().syncFromServer()
  }

  window.addEventListener('focus', triggerSync)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') triggerSync()
  })
  window.addEventListener('online', triggerSync)
}
