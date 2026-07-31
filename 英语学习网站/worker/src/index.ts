import type { D1Database } from '@cloudflare/workers-types'

export interface Env {
  DB: D1Database
  JWT_SECRET: string
  ALLOWED_ORIGIN: string
}

// 基础类型
interface User {
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

interface ProgressRecord {
  lesson_id: string
  completed_at: string
  score: number
  xp_earned: number
}

interface AchievementRecord {
  achievement_id: string
  unlocked_at: string
}

interface Post {
  id: string
  author_id: string
  author_name: string
  content: string
  likes: number
  created_at: string
}

// CORS
function corsPreflight(request: Request, allowedOrigin: string): Response {
  const headers = new Headers()
  headers.set('Access-Control-Allow-Origin', allowedOrigin)
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS')
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  headers.set('Access-Control-Max-Age', '86400')
  return new Response(null, { status: 204, headers })
}

function jsonResponse(data: unknown, status = 200, allowedOrigin: string): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

// Base64 URL
function bytesToBase64Url(bytes: ArrayBuffer): string {
  const bin = Array.from(new Uint8Array(bytes), b => String.fromCharCode(b)).join('')
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlToBytes(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
  const bin = atob(padded)
  return new Uint8Array(bin.split('').map(c => c.charCodeAt(0)))
}

// JWT
async function signJwt(payload: Record<string, unknown>, secret: string): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' }
  const encodedHeader = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(header)).buffer)
  const encodedPayload = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)).buffer)
  const data = `${encodedHeader}.${encodedPayload}`
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  const encodedSignature = bytesToBase64Url(signature)
  return `${data}.${encodedSignature}`
}

async function verifyJwt(token: string, secret: string): Promise<Record<string, unknown> | null> {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [encodedHeader, encodedPayload, encodedSignature] = parts
  const data = `${encodedHeader}.${encodedPayload}`
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  )
  const signature = base64UrlToBytes(encodedSignature)
  const valid = await crypto.subtle.verify('HMAC', key, signature, new TextEncoder().encode(data))
  if (!valid) return null
  try {
    const payload = JSON.parse(new TextDecoder().decode(base64UrlToBytes(encodedPayload)))
    if (payload.exp && payload.exp < Date.now() / 1000) return null
    return payload
  } catch {
    return null
  }
}

// Password hashing (PBKDF2)
async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iterations = 100000
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  )
  const hash = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    keyMaterial,
    256
  )
  return `${iterations}:${bytesToBase64Url(salt.buffer)}:${bytesToBase64Url(hash)}`
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [iterationsStr, saltB64, hashB64] = stored.split(':')
  const iterations = parseInt(iterationsStr, 10)
  const salt = base64UrlToBytes(saltB64)
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  )
  const hash = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    keyMaterial,
    256
  )
  return bytesToBase64Url(hash) === hashB64
}

// Auth middleware
async function getUserId(request: Request, env: Env): Promise<string | null> {
  const auth = request.headers.get('Authorization')
  if (!auth || !auth.startsWith('Bearer ')) return null
  const token = auth.slice(7)
  const payload = await verifyJwt(token, env.JWT_SECRET)
  return payload && typeof payload.sub === 'string' ? payload.sub : null
}

// Helpers
function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function rowToUser(row: Record<string, unknown>): User {
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    grade: Number(row.grade),
    role: row.role as 'student' | 'parent',
    streak: Number(row.streak || 0),
    total_xp: Number(row.total_xp || 0),
    registered_at: String(row.registered_at),
    children: JSON.parse(String(row.children || '[]')),
  }
}

// API handlers
async function handleRegister(request: Request, env: Env): Promise<Response> {
  const body = (await request.json()) as {
    name?: string
    email?: string
    password?: string
    grade?: number
    role?: 'student' | 'parent'
  }
  const { name, email, password, grade, role = 'student' } = body
  if (!name || !email || !password || grade === undefined) {
    return jsonResponse({ error: '缺少必填字段' }, 400, env.ALLOWED_ORIGIN)
  }
  if (password.length < 6) {
    return jsonResponse({ error: '密码至少 6 位' }, 400, env.ALLOWED_ORIGIN)
  }

  const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first()
  if (existing) {
    return jsonResponse({ error: '邮箱已被注册' }, 409, env.ALLOWED_ORIGIN)
  }

  const id = role === 'parent' ? `p${Date.now()}` : `u${Date.now()}`
  const passwordHash = await hashPassword(password)
  const now = new Date().toISOString()

  await env.DB.prepare(
    'INSERT INTO users (id, name, email, password_hash, grade, role, streak, total_xp, registered_at, children) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  )
    .bind(id, name, email, passwordHash, grade, role, 0, 0, now, JSON.stringify(role === 'parent' ? [] : undefined))
    .run()

  const token = await signJwt({ sub: id, email, role }, env.JWT_SECRET)
  return jsonResponse({ token, user: { id, name, email, grade, role, streak: 0, total_xp: 0, registered_at: now, children: role === 'parent' ? [] : undefined } }, 201, env.ALLOWED_ORIGIN)
}

async function handleLogin(request: Request, env: Env): Promise<Response> {
  const body = (await request.json()) as { email?: string; password?: string }
  const { email, password } = body
  if (!email || !password) {
    return jsonResponse({ error: '缺少邮箱或密码' }, 400, env.ALLOWED_ORIGIN)
  }

  const row = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first()
  if (!row) {
    return jsonResponse({ error: '邮箱或密码错误' }, 401, env.ALLOWED_ORIGIN)
  }

  const valid = await verifyPassword(password, String(row.password_hash))
  if (!valid) {
    return jsonResponse({ error: '邮箱或密码错误' }, 401, env.ALLOWED_ORIGIN)
  }

  const user = rowToUser(row)
  const token = await signJwt({ sub: user.id, email: user.email, role: user.role }, env.JWT_SECRET)
  return jsonResponse({ token, user }, 200, env.ALLOWED_ORIGIN)
}

async function handleGetMe(request: Request, env: Env, userId: string): Promise<Response> {
  const row = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first()
  if (!row) return jsonResponse({ error: '用户不存在' }, 404, env.ALLOWED_ORIGIN)
  return jsonResponse({ user: rowToUser(row) }, 200, env.ALLOWED_ORIGIN)
}

async function handleUpdateMe(request: Request, env: Env, userId: string): Promise<Response> {
  const body = (await request.json()) as Partial<User>
  const row = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first()
  if (!row) return jsonResponse({ error: '用户不存在' }, 404, env.ALLOWED_ORIGIN)

  const current = rowToUser(row)
  const allowed: Record<string, { column: string; transform?: (v: unknown) => unknown }> = {
    name: { column: 'name' },
    grade: { column: 'grade' },
    total_xp: { column: 'total_xp' },
    streak: { column: 'streak' },
    children: { column: 'children', transform: v => JSON.stringify(v) },
  }

  const updates: { column: string; value: unknown }[] = []
  for (const [key, value] of Object.entries(body)) {
    if (allowed[key] === undefined || value === undefined) continue
    if (key === 'grade' && current.role !== 'student') continue
    if (key === 'children' && current.role !== 'parent') continue
    updates.push({ column: allowed[key].column, value: allowed[key].transform ? allowed[key].transform!(value) : value })
  }

  if (updates.length === 0) {
    return jsonResponse({ user: current }, 200, env.ALLOWED_ORIGIN)
  }

  const sets = updates.map(u => `${u.column} = ?`)
  const values = updates.map(u => u.value)
  values.push(userId)

  await env.DB.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).bind(...values).run()

  const updated = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first()
  return jsonResponse({ user: rowToUser(updated!) }, 200, env.ALLOWED_ORIGIN)
}

async function handleBindChild(request: Request, env: Env, userId: string): Promise<Response> {
  const body = (await request.json()) as { childEmail?: string }
  const { childEmail } = body
  if (!childEmail) return jsonResponse({ error: '缺少孩子邮箱' }, 400, env.ALLOWED_ORIGIN)

  const parentRow = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first()
  if (!parentRow || parentRow.role !== 'parent') {
    return jsonResponse({ error: '无权限' }, 403, env.ALLOWED_ORIGIN)
  }

  const childRow = await env.DB.prepare('SELECT * FROM users WHERE email = ? AND role = ?').bind(childEmail, 'student').first()
  if (!childRow) return jsonResponse({ error: '未找到该学生账号' }, 404, env.ALLOWED_ORIGIN)

  const parent = rowToUser(parentRow)
  const children = new Set(parent.children)
  if (children.has(String(childRow.id))) {
    return jsonResponse({ user: parent }, 200, env.ALLOWED_ORIGIN)
  }
  children.add(String(childRow.id))

  await env.DB.prepare('UPDATE users SET children = ? WHERE id = ?')
    .bind(JSON.stringify(Array.from(children)), userId)
    .run()

  const updated = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first()
  return jsonResponse({ user: rowToUser(updated!) }, 200, env.ALLOWED_ORIGIN)
}

async function handleGetChildren(request: Request, env: Env, userId: string): Promise<Response> {
  const parentRow = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first()
  if (!parentRow || parentRow.role !== 'parent') {
    return jsonResponse({ error: '无权限' }, 403, env.ALLOWED_ORIGIN)
  }

  const parent = rowToUser(parentRow)
  if (!parent.children.length) {
    return jsonResponse({ children: [] }, 200, env.ALLOWED_ORIGIN)
  }

  const placeholders = parent.children.map(() => '?').join(',')
  const rows = await env.DB.prepare(`SELECT id, name, email, grade, role, streak, total_xp, registered_at FROM users WHERE id IN (${placeholders})`)
    .bind(...parent.children)
    .all<{
      id: string
      name: string
      email: string
      grade: number
      role: 'student' | 'parent'
      streak: number
      total_xp: number
      registered_at: string
    }>()

  const children = (rows.results || []).map(r => ({
    id: r.id,
    name: r.name,
    email: r.email,
    grade: r.grade,
    role: r.role,
    streak: r.streak,
    total_xp: r.total_xp,
    registered_at: r.registered_at,
    children: [],
  }))

  return jsonResponse({ children }, 200, env.ALLOWED_ORIGIN)
}

async function handleGetChildProgress(request: Request, env: Env, userId: string): Promise<Response> {
  const parentRow = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first()
  if (!parentRow || parentRow.role !== 'parent') {
    return jsonResponse({ error: '无权限' }, 403, env.ALLOWED_ORIGIN)
  }

  const url = new URL(request.url)
  const childId = url.pathname.split('/').pop()
  if (!childId) return jsonResponse({ error: '缺少孩子ID' }, 400, env.ALLOWED_ORIGIN)

  const parent = rowToUser(parentRow)
  if (!parent.children.includes(childId)) {
    return jsonResponse({ error: '只能查看已绑定孩子的进度' }, 403, env.ALLOWED_ORIGIN)
  }

  const records = await env.DB.prepare(
    'SELECT lesson_id, completed_at, score, xp_earned FROM progress WHERE user_id = ? ORDER BY completed_at'
  )
    .bind(childId)
    .all<ProgressRecord>()

  return jsonResponse({ records: records.results || [] }, 200, env.ALLOWED_ORIGIN)
}

async function handleGetProgress(request: Request, env: Env, userId: string): Promise<Response> {
  const records = await env.DB.prepare(
    'SELECT lesson_id, completed_at, score, xp_earned FROM progress WHERE user_id = ? ORDER BY completed_at'
  )
    .bind(userId)
    .all<ProgressRecord>()

  const achievements = await env.DB.prepare('SELECT achievement_id, unlocked_at FROM achievements WHERE user_id = ?')
    .bind(userId)
    .all<AchievementRecord>()

  const goalRow = await env.DB.prepare('SELECT target, completed FROM daily_goals WHERE user_id = ? AND goal_date = ?')
    .bind(userId, today())
    .first<{ target: number; completed: number }>()

  return jsonResponse(
    {
      records: records.results || [],
      unlockedAchievements: (achievements.results || []).map(a => a.achievement_id),
      dailyGoal: goalRow || { target: 60, completed: 0 },
    },
    200,
    env.ALLOWED_ORIGIN
  )
}

async function handleCompleteLesson(request: Request, env: Env, userId: string): Promise<Response> {
  const body = (await request.json()) as { lessonId?: string; score?: number; xp?: number }
  const { lessonId, score = 100, xp = 0 } = body
  if (!lessonId) return jsonResponse({ error: '缺少课程ID' }, 400, env.ALLOWED_ORIGIN)

  const now = new Date().toISOString()

  await env.DB.prepare(
    'INSERT OR REPLACE INTO progress (user_id, lesson_id, completed_at, score, xp_earned) VALUES (?, ?, ?, ?, ?)'
  )
    .bind(userId, lessonId, now, score, xp)
    .run()

  await env.DB.prepare('UPDATE users SET total_xp = total_xp + ? WHERE id = ?').bind(xp, userId).run()

  const goalRow = await env.DB.prepare('SELECT * FROM daily_goals WHERE user_id = ? AND goal_date = ?')
    .bind(userId, today())
    .first()
  if (!goalRow) {
    await env.DB.prepare('INSERT INTO daily_goals (user_id, target, completed, goal_date) VALUES (?, ?, ?, ?)')
      .bind(userId, 60, Math.min(60, xp), today())
      .run()
  } else {
    await env.DB.prepare('UPDATE daily_goals SET completed = MIN(target, completed + ?) WHERE user_id = ? AND goal_date = ?')
      .bind(xp, userId, today())
      .run()
  }

  return jsonResponse({ success: true }, 200, env.ALLOWED_ORIGIN)
}

async function handleGetAchievements(request: Request, env: Env, userId: string): Promise<Response> {
  const rows = await env.DB.prepare('SELECT achievement_id, unlocked_at FROM achievements WHERE user_id = ?')
    .bind(userId)
    .all<AchievementRecord>()
  return jsonResponse({ unlockedAchievements: (rows.results || []).map(r => r.achievement_id) }, 200, env.ALLOWED_ORIGIN)
}

async function handleUnlockAchievement(request: Request, env: Env, userId: string): Promise<Response> {
  const url = new URL(request.url)
  const id = url.pathname.split('/').pop()
  if (!id) return jsonResponse({ error: '缺少成就ID' }, 400, env.ALLOWED_ORIGIN)

  const now = new Date().toISOString()
  await env.DB.prepare('INSERT OR IGNORE INTO achievements (user_id, achievement_id, unlocked_at) VALUES (?, ?, ?)')
    .bind(userId, id, now)
    .run()

  return jsonResponse({ success: true }, 200, env.ALLOWED_ORIGIN)
}

async function handleGetPosts(request: Request, env: Env): Promise<Response> {
  const rows = await env.DB.prepare(
    'SELECT id, author_id, author_name, content, likes, created_at FROM posts ORDER BY created_at DESC LIMIT 100'
  ).all<Post>()
  return jsonResponse({ posts: rows.results || [] }, 200, env.ALLOWED_ORIGIN)
}

async function handleCreatePost(request: Request, env: Env, userId: string): Promise<Response> {
  const body = (await request.json()) as { content?: string; authorName?: string }
  const { content, authorName = '用户' } = body
  if (!content || !content.trim()) return jsonResponse({ error: '内容不能为空' }, 400, env.ALLOWED_ORIGIN)

  const id = `p${Date.now()}`
  const now = new Date().toISOString()
  await env.DB.prepare('INSERT INTO posts (id, author_id, author_name, content, likes, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(id, userId, authorName, content.trim(), 0, now)
    .run()

  return jsonResponse({ post: { id, author_id: userId, author_name: authorName, content: content.trim(), likes: 0, created_at: now } }, 201, env.ALLOWED_ORIGIN)
}

async function handleLikePost(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url)
  const id = url.pathname.split('/').pop()
  if (!id) return jsonResponse({ error: '缺少帖子ID' }, 400, env.ALLOWED_ORIGIN)

  await env.DB.prepare('UPDATE posts SET likes = likes + 1 WHERE id = ?').bind(id).run()
  return jsonResponse({ success: true }, 200, env.ALLOWED_ORIGIN)
}

async function handleSeed(request: Request, env: Env): Promise<Response> {
  const demoAccounts = [
    { id: 'u-demo-learner', name: '小明', email: 'learner@example.com', password: '123456', grade: 3, role: 'student' },
    { id: 'u-demo-parent', name: '家长', email: 'parent@example.com', password: '123456', grade: 0, role: 'parent' },
    { id: 'u-demo-child1', name: '孩子1', email: 'child1@example.com', password: '123456', grade: 1, role: 'student' },
    { id: 'u-demo-child2', name: '孩子2', email: 'child2@example.com', password: '123456', grade: 5, role: 'student' },
    { id: 'u-demo-child3', name: '孩子3', email: 'child3@example.com', password: '123456', grade: 8, role: 'student' },
  ] as const

  for (const acc of demoAccounts) {
    const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(acc.email).first()
    if (!existing) {
      const hash = await hashPassword(acc.password)
      await env.DB.prepare(
        'INSERT INTO users (id, name, email, password_hash, grade, role, streak, total_xp, registered_at, children) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      )
        .bind(acc.id, acc.name, acc.email, hash, acc.grade, acc.role, 0, 0, new Date().toISOString(), JSON.stringify([]))
        .run()
    }
  }

  // Bind children to parent
  const parent = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind('u-demo-parent').first()
  if (parent) {
    const childrenIds = ['u-demo-child1', 'u-demo-child2', 'u-demo-child3']
    await env.DB.prepare('UPDATE users SET children = ? WHERE id = ?')
      .bind(JSON.stringify(childrenIds), 'u-demo-parent')
      .run()
  }

  return jsonResponse({ success: true, message: '演示账号已初始化' }, 200, env.ALLOWED_ORIGIN)
}

// Main router
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return corsPreflight(request, env.ALLOWED_ORIGIN)
    }

    const url = new URL(request.url)
    const pathname = url.pathname

    try {
      // Public
      if (pathname === '/api/auth/register' && request.method === 'POST') {
        return await handleRegister(request, env)
      }
      if (pathname === '/api/auth/login' && request.method === 'POST') {
        return await handleLogin(request, env)
      }
      if (pathname === '/api/seed' && request.method === 'POST') {
        return await handleSeed(request, env)
      }

      // Protected
      const userId = await getUserId(request, env)
      if (!userId) {
        return jsonResponse({ error: '未登录或 token 无效' }, 401, env.ALLOWED_ORIGIN)
      }

      if (pathname === '/api/user/me' && request.method === 'GET') return await handleGetMe(request, env, userId)
      if (pathname === '/api/user/me' && request.method === 'PUT') return await handleUpdateMe(request, env, userId)
      if (pathname === '/api/user/children' && request.method === 'GET') return await handleGetChildren(request, env, userId)
      if (pathname === '/api/user/bind-child' && request.method === 'POST') return await handleBindChild(request, env, userId)
      if (pathname.startsWith('/api/progress/') && request.method === 'GET') return await handleGetChildProgress(request, env, userId)
      if (pathname === '/api/progress' && request.method === 'GET') return await handleGetProgress(request, env, userId)
      if (pathname === '/api/progress/complete' && request.method === 'POST') return await handleCompleteLesson(request, env, userId)
      if (pathname === '/api/achievements' && request.method === 'GET') return await handleGetAchievements(request, env, userId)
      if (pathname.startsWith('/api/achievements/') && pathname.endsWith('/unlock') && request.method === 'POST') {
        return await handleUnlockAchievement(request, env, userId)
      }
      if (pathname === '/api/posts' && request.method === 'GET') return await handleGetPosts(request, env)
      if (pathname === '/api/posts' && request.method === 'POST') return await handleCreatePost(request, env, userId)
      if (pathname.startsWith('/api/posts/') && pathname.endsWith('/like') && request.method === 'POST') {
        return await handleLikePost(request, env)
      }

      return jsonResponse({ error: 'Not Found' }, 404, env.ALLOWED_ORIGIN)
    } catch (err) {
      console.error(err)
      return jsonResponse({ error: '服务器内部错误' }, 500, env.ALLOWED_ORIGIN)
    }
  },
}
