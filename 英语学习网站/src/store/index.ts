import { create } from 'zustand'
import type { User, ProgressRecord, Post, DailyGoal } from '@/types'
import { achievements as allAchievements } from '@/data/courses'
import { mockPosts } from '@/data/community'

const USERS_KEY = 'englishmind_users'
const PROGRESS_KEY = (userId: string) => `englishmind-progress-${userId}`
const POSTS_KEY = 'englishmind_posts'

const loadUsers = (): User[] => {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    if (!raw) return []
    const users: User[] = JSON.parse(raw)
    return users.map(u => ({
      ...u,
      role: u.role || 'student',
      children: u.role === 'parent' ? (u.children || []) : undefined,
    }))
  } catch {
    return []
  }
}

const saveUsers = (users: User[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

interface ProgressData {
  records: ProgressRecord[]
  unlockedAchievements: string[]
  dailyGoal: DailyGoal
}

const loadProgress = (userId: string): ProgressData => {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY(userId))
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore
  }
  return { records: [], unlockedAchievements: [], dailyGoal: { target: 60, completed: 0 } }
}

const saveProgress = (userId: string, data: ProgressData) => {
  localStorage.setItem(PROGRESS_KEY(userId), JSON.stringify(data))
}

const loadPosts = (): Post[] => {
  try {
    const raw = localStorage.getItem(POSTS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore
  }
  return mockPosts
}

const savePosts = (posts: Post[]) => {
  localStorage.setItem(POSTS_KEY, JSON.stringify(posts))
}

interface UserState {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => boolean
  register: (name: string, email: string, password: string, grade: number, role?: 'student' | 'parent') => boolean
  logout: () => void
  updateUser: (updates: Partial<User>) => void
  bindChild: (childEmail: string) => boolean
  allUsers: () => User[]
}

const demoUser: User = {
  id: 'u1',
  name: '学习者',
  email: 'learner@example.com',
  password: '123456',
  grade: 3,
  streak: 5,
  totalXp: 340,
  registeredAt: '2026-07-01T00:00:00',
  role: 'student',
}

const demoChildA: User = {
  id: 'u2',
  name: '小明',
  email: 'child1@example.com',
  password: '123456',
  grade: 1,
  streak: 3,
  totalXp: 120,
  registeredAt: '2026-07-10T00:00:00',
  role: 'student',
}

const demoChildB: User = {
  id: 'u3',
  name: '小红',
  email: 'child2@example.com',
  password: '123456',
  grade: 3,
  streak: 7,
  totalXp: 280,
  registeredAt: '2026-07-05T00:00:00',
  role: 'student',
}

const demoChildC: User = {
  id: 'u4',
  name: '小军',
  email: 'child3@example.com',
  password: '123456',
  grade: 5,
  streak: 2,
  totalXp: 90,
  registeredAt: '2026-07-20T00:00:00',
  role: 'student',
}

const demoParent: User = {
  id: 'p1',
  name: '家长',
  email: 'parent@example.com',
  password: '123456',
  grade: 0,
  streak: 0,
  totalXp: 0,
  registeredAt: '2026-07-01T00:00:00',
  role: 'parent',
  children: ['u1', 'u2', 'u3', 'u4'],
}

const migrateLegacyData = () => {
  try {
    const legacyUserRaw = localStorage.getItem('englishmind-user')
    const legacyProgressRaw = localStorage.getItem('englishmind-progress')

    if (legacyUserRaw) {
      const legacyUser = JSON.parse(legacyUserRaw)
      const users = loadUsers()
      if (!users.some(u => u.email === legacyUser.email)) {
        users.push({
          ...legacyUser,
          role: legacyUser.role || 'student',
          children: legacyUser.children || undefined,
        })
        saveUsers(users)
        if (legacyProgressRaw) {
          localStorage.setItem(PROGRESS_KEY(legacyUser.id), legacyProgressRaw)
        }
        localStorage.removeItem('englishmind-user')
        localStorage.removeItem('englishmind-progress')
      }
    }
  } catch {
    // ignore
  }
}

const ensureDemoAccounts = () => {
  const users = loadUsers()
  const ensure = (user: User) => {
    if (!users.some(u => u.email === user.email)) users.push(user)
  }
  ensure(demoUser)
  ensure(demoChildA)
  ensure(demoChildB)
  ensure(demoChildC)
  ensure(demoParent)
  saveUsers(users)
}

const seedDemoProgress = () => {
  const seedIfEmpty = (userId: string, count: number) => {
    if (localStorage.getItem(PROGRESS_KEY(userId))) return
    const records: ProgressRecord[] = []
    const types = ['vocab', 'grammar', 'speaking', 'listening']
    for (let i = 0; i < count; i++) {
      const type = types[i % types.length]
      records.push({
        lessonId: `g${(i % 9) + 1}-u1-${type}`,
        completedAt: new Date(Date.now() - i * 86400000).toISOString(),
        score: 60 + Math.floor(Math.random() * 40),
        xpEarned: 20 + Math.floor(Math.random() * 10),
      })
    }
    saveProgress(userId, { records, unlockedAchievements: [], dailyGoal: { target: 60, completed: count * 25 } })
  }
  seedIfEmpty('u2', 8)
  seedIfEmpty('u3', 14)
  seedIfEmpty('u4', 5)
}

migrateLegacyData()
ensureDemoAccounts()
seedDemoProgress()

export const useUserStore = create<UserState>()((set, get) => ({
  user: null,
  isAuthenticated: false,
  login: (email, password) => {
    const users = loadUsers()
    const found = users.find(u => u.email === email)
    if (!found) return false
    if (found.password && found.password !== password) return false
    set({ user: found, isAuthenticated: true })
    return true
  },
  register: (name, email, password, grade, role = 'student') => {
    const users = loadUsers()
    if (users.some(u => u.email === email)) return false
    const newUser: User = {
      id: role === 'parent' ? `p${Date.now()}` : `u${Date.now()}`,
      name,
      email,
      password,
      grade,
      streak: 0,
      totalXp: 0,
      registeredAt: new Date().toISOString(),
      role,
      children: role === 'parent' ? [] : undefined,
    }
    users.push(newUser)
    saveUsers(users)
    set({ user: newUser, isAuthenticated: true })
    return true
  },
  logout: () => set({ user: null, isAuthenticated: false }),
  updateUser: updates => {
    const current = get().user
    if (!current) return
    const updated = { ...current, ...updates }
    set({ user: updated })
    const users = loadUsers()
    const idx = users.findIndex(u => u.id === updated.id)
    if (idx >= 0) {
      users[idx] = updated
      saveUsers(users)
    }
  },
  bindChild: childEmail => {
    const parent = get().user
    if (!parent || parent.role !== 'parent') return false
    const users = loadUsers()
    const child = users.find(u => u.email === childEmail && u.role === 'student')
    if (!child) return false
    const children = new Set(parent.children || [])
    if (children.has(child.id)) return true
    children.add(child.id)
    const updatedParent = { ...parent, children: Array.from(children) }
    set({ user: updatedParent })
    const idx = users.findIndex(u => u.id === updatedParent.id)
    if (idx >= 0) {
      users[idx] = updatedParent
      saveUsers(users)
    }
    return true
  },
  allUsers: () => loadUsers(),
}))

interface ProgressState {
  records: ProgressRecord[]
  unlockedAchievements: string[]
  dailyGoal: DailyGoal
  addRecord: (record: ProgressRecord) => void
  completeLesson: (lessonId: string, score: number, xp: number) => void
  checkAchievements: () => void
  unlockAchievement: (id: string) => void
  resetDailyGoal: () => void
  loadForUser: (userId: string) => void
  getChildProgress: (userId: string) => ProgressData
}

export const useProgressStore = create<ProgressState>()((set, get) => {
  const currentUserId = () => useUserStore.getState().user?.id
  const persist = () => {
    const userId = currentUserId()
    if (!userId) return
    saveProgress(userId, {
      records: get().records,
      unlockedAchievements: get().unlockedAchievements,
      dailyGoal: get().dailyGoal,
    })
  }

  return {
    records: [],
    unlockedAchievements: [],
    dailyGoal: { target: 60, completed: 0 },
    addRecord: record => {
      set(state => ({ records: [...state.records, record] }))
      get().checkAchievements()
      persist()
    },
    completeLesson: (lessonId, score, xp) => {
      const record: ProgressRecord = {
        lessonId,
        completedAt: new Date().toISOString(),
        score,
        xpEarned: xp,
      }
      set(state => ({
        records: [...state.records, record],
        dailyGoal: { ...state.dailyGoal, completed: Math.min(state.dailyGoal.target, state.dailyGoal.completed + xp) },
      }))
      const userStore = useUserStore.getState()
      const user = userStore.user
      if (user) {
        userStore.updateUser({ totalXp: user.totalXp + xp })
      }
      get().checkAchievements()
      persist()
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
      set({ unlockedAchievements: Array.from(newUnlocked) })
      persist()
    },
    unlockAchievement: id => {
      const { unlockedAchievements } = get()
      if (unlockedAchievements.includes(id)) return
      set({ unlockedAchievements: [...unlockedAchievements, id] })
      persist()
    },
    resetDailyGoal: () => {
      set(state => ({ dailyGoal: { ...state.dailyGoal, completed: 0 } }))
      persist()
    },
    loadForUser: userId => {
      const data = loadProgress(userId)
      set(data)
    },
    getChildProgress: userId => loadProgress(userId),
  }
})

// Sync progress store when current user changes
useUserStore.subscribe(state => {
  if (state.user?.id) {
    useProgressStore.getState().loadForUser(state.user.id)
  } else {
    useProgressStore.setState({ records: [], unlockedAchievements: [], dailyGoal: { target: 60, completed: 0 } })
  }
})

interface CommunityState {
  posts: Post[]
  addPost: (content: string, authorName: string) => void
  likePost: (id: string) => void
}

export const useCommunityStore = create<CommunityState>()((set) => ({
  posts: loadPosts(),
  addPost: (content, authorName) => {
    const newPost: Post = {
      id: `p${Date.now()}`,
      authorId: 'me',
      authorName,
      content,
      likes: 0,
      comments: 0,
      createdAt: new Date().toISOString(),
    }
    set(state => {
      const posts = [newPost, ...state.posts]
      savePosts(posts)
      return { posts }
    })
  },
  likePost: id =>
    set(state => {
      const posts = state.posts.map(p => (p.id === id ? { ...p, likes: p.likes + 1 } : p))
      savePosts(posts)
      return { posts }
    }),
}))

export const getAchievements = () => allAchievements
