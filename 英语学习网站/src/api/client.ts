// 生产环境使用同域 API（/api），本地开发可通过 .env 覆盖
export const API_BASE_URL = import.meta.env.VITE_API_URL || ''

export function getToken(): string | null {
  return localStorage.getItem('englishmind_token')
}

export function setToken(token: string) {
  localStorage.setItem('englishmind_token', token)
}

export function clearToken() {
  localStorage.removeItem('englishmind_token')
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${path}`
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')

  const token = getToken()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const res = await fetch(url, { ...options, headers })

  // token 失效或过期：清理本地凭证并跳转登录页，保证跨设备登录态一致
  if (res.status === 401 && token) {
    clearToken()
    const pathname = window.location.pathname
    if (!pathname.startsWith('/login') && !pathname.startsWith('/register')) {
      window.location.href = '/login'
    }
    throw new Error('登录已过期，请重新登录')
  }

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(data.error || `请求失败: ${res.status}`)
  }

  return data as T
}

export const api = {
  // Auth
  register: (body: { name: string; email: string; password: string; grade: number; role: 'student' | 'parent' }) =>
    request<{ token: string; user: BackendUser }>('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),

  login: (body: { email: string; password: string }) =>
    request<{ token: string; user: BackendUser }>('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  // User
  getMe: () => request<{ user: BackendUser }>('/api/user/me'),
  updateMe: (body: Partial<BackendUser>) => request<{ user: BackendUser }>('/api/user/me', { method: 'PUT', body: JSON.stringify(body) }),
  getChildren: () => request<{ children: BackendUser[] }>('/api/user/children'),
  bindChild: (childEmail: string) =>
    request<{ user: BackendUser }>('/api/user/bind-child', { method: 'POST', body: JSON.stringify({ childEmail }) }),
  getChildProgress: (childId: string) =>
    request<{ records: BackendProgressRecord[] }>(`/api/progress/${childId}`),

  // Progress
  getProgress: () => request<{ records: BackendProgressRecord[]; unlockedAchievements: string[]; dailyGoal: { target: number; completed: number } }>('/api/progress'),
  completeLesson: (body: { lessonId: string; score: number; xp: number }) =>
    request<{ success: boolean }>('/api/progress/complete', { method: 'POST', body: JSON.stringify(body) }),

  // Achievements
  getAchievements: () => request<{ unlockedAchievements: string[] }>('/api/achievements'),
  unlockAchievement: (id: string) =>
    request<{ success: boolean }>(`/api/achievements/${id}/unlock`, { method: 'POST' }),

  // Community
  getPosts: () => request<{ posts: BackendPost[] }>('/api/posts'),
  createPost: (body: { content: string; authorName: string }) =>
    request<{ post: BackendPost }>('/api/posts', { method: 'POST', body: JSON.stringify(body) }),
  likePost: (id: string) =>
    request<{ success: boolean }>(`/api/posts/${id}/like`, { method: 'POST' }),
}

export interface BackendUser {
  id: string
  name: string
  email: string
  grade: number
  role: 'student' | 'parent'
  streak: number
  total_xp: number
  registered_at: string
  children: string[]
}

export interface BackendProgressRecord {
  lesson_id: string
  completed_at: string
  score: number
  xp_earned: number
}

export interface BackendPost {
  id: string
  author_id: string
  author_name: string
  content: string
  likes: number
  created_at: string
}

export function toFrontendUser(u: BackendUser) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    grade: u.grade,
    role: u.role,
    streak: u.streak,
    totalXp: u.total_xp,
    registeredAt: u.registered_at,
    children: u.children,
  }
}
