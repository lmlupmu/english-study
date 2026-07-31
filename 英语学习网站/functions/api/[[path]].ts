import type { D1Database, PagesFunction } from '@cloudflare/workers-types'

interface Env {
  DB: D1Database
  JWT_SECRET: string
  // 一次性创建管理员账号所用密钥；通过 wrangler.toml [vars] 或 dashboard 配置
  ADMIN_SETUP_KEY?: string
}

// 基础类型
interface User {
  id: string
  name: string
  email: string
  grade: number
  role: 'student' | 'parent' | 'admin'
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
function corsPreflight(): Response {
  const headers = new Headers()
  headers.set('Access-Control-Allow-Origin', '*')
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  headers.set('Access-Control-Max-Age', '86400')
  return new Response(null, { status: 204, headers })
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
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

// 返回完整 JWT payload，用于读取 role 等字段
async function getAuthPayload(request: Request, env: Env): Promise<Record<string, unknown> | null> {
  const auth = request.headers.get('Authorization')
  if (!auth || !auth.startsWith('Bearer ')) return null
  const token = auth.slice(7)
  return await verifyJwt(token, env.JWT_SECRET)
}

// 管理员鉴权：返回 admin 用户 id；非 admin 返回 null
async function requireAdmin(request: Request, env: Env): Promise<string | null> {
  const payload = await getAuthPayload(request, env)
  if (!payload) return null
  if (payload.role !== 'admin') return null
  return typeof payload.sub === 'string' ? payload.sub : null
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
    return jsonResponse({ error: '缺少必填字段' }, 400)
  }
  if (password.length < 6) {
    return jsonResponse({ error: '密码至少 6 位' }, 400)
  }

  const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first()
  if (existing) {
    return jsonResponse({ error: '邮箱已被注册' }, 409)
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
  return jsonResponse({ token, user: { id, name, email, grade, role, streak: 0, total_xp: 0, registered_at: now, children: role === 'parent' ? [] : undefined } }, 201)
}

async function handleLogin(request: Request, env: Env): Promise<Response> {
  const body = (await request.json()) as { email?: string; password?: string }
  const { email, password } = body
  if (!email || !password) {
    return jsonResponse({ error: '缺少邮箱或密码' }, 400)
  }

  const row = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first()
  if (!row) {
    return jsonResponse({ error: '邮箱或密码错误' }, 401)
  }

  const valid = await verifyPassword(password, String(row.password_hash))
  if (!valid) {
    return jsonResponse({ error: '邮箱或密码错误' }, 401)
  }

  const user = rowToUser(row)
  const token = await signJwt({ sub: user.id, email: user.email, role: user.role }, env.JWT_SECRET)
  return jsonResponse({ token, user }, 200)
}

async function handleGetMe(request: Request, env: Env, userId: string): Promise<Response> {
  const row = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first()
  if (!row) return jsonResponse({ error: '用户不存在' }, 404)
  return jsonResponse({ user: rowToUser(row) }, 200)
}

async function handleUpdateMe(request: Request, env: Env, userId: string): Promise<Response> {
  const body = (await request.json()) as Partial<User>
  const row = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first()
  if (!row) return jsonResponse({ error: '用户不存在' }, 404)

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
    return jsonResponse({ user: current }, 200)
  }

  const sets = updates.map(u => `${u.column} = ?`)
  const values = updates.map(u => u.value)
  values.push(userId)

  await env.DB.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).bind(...values).run()

  const updated = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first()
  return jsonResponse({ user: rowToUser(updated!) }, 200)
}

async function handleBindChild(request: Request, env: Env, userId: string): Promise<Response> {
  const body = (await request.json()) as { childEmail?: string }
  const { childEmail } = body
  if (!childEmail) return jsonResponse({ error: '缺少孩子邮箱' }, 400)

  const parentRow = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first()
  if (!parentRow || parentRow.role !== 'parent') {
    return jsonResponse({ error: '无权限' }, 403)
  }

  const childRow = await env.DB.prepare('SELECT * FROM users WHERE email = ? AND role = ?').bind(childEmail, 'student').first()
  if (!childRow) return jsonResponse({ error: '未找到该学生账号' }, 404)

  const parent = rowToUser(parentRow)
  const children = new Set(parent.children)
  if (children.has(String(childRow.id))) {
    return jsonResponse({ user: parent }, 200)
  }
  children.add(String(childRow.id))

  await env.DB.prepare('UPDATE users SET children = ? WHERE id = ?')
    .bind(JSON.stringify(Array.from(children)), userId)
    .run()

  const updated = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first()
  return jsonResponse({ user: rowToUser(updated!) }, 200)
}

async function handleGetChildren(request: Request, env: Env, userId: string): Promise<Response> {
  const parentRow = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first()
  if (!parentRow || parentRow.role !== 'parent') {
    return jsonResponse({ error: '无权限' }, 403)
  }

  const parent = rowToUser(parentRow)
  if (!parent.children.length) {
    return jsonResponse({ children: [] }, 200)
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

  return jsonResponse({ children }, 200)
}

async function handleGetChildProgress(request: Request, env: Env, userId: string): Promise<Response> {
  const parentRow = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first()
  if (!parentRow || parentRow.role !== 'parent') {
    return jsonResponse({ error: '无权限' }, 403)
  }

  const url = new URL(request.url)
  const childId = url.pathname.split('/').pop()
  if (!childId) return jsonResponse({ error: '缺少孩子ID' }, 400)

  const parent = rowToUser(parentRow)
  if (!parent.children.includes(childId)) {
    return jsonResponse({ error: '只能查看已绑定孩子的进度' }, 403)
  }

  const records = await env.DB.prepare(
    'SELECT lesson_id, completed_at, score, xp_earned FROM progress WHERE user_id = ? ORDER BY completed_at'
  )
    .bind(childId)
    .all<ProgressRecord>()

  return jsonResponse({ records: records.results || [] }, 200)
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
    200
  )
}

async function handleCompleteLesson(request: Request, env: Env, userId: string): Promise<Response> {
  const body = (await request.json()) as { lessonId?: string; score?: number; xp?: number }
  const { lessonId, score = 100, xp = 0 } = body
  if (!lessonId) return jsonResponse({ error: '缺少课程ID' }, 400)

  const now = new Date().toISOString()
  const todayStr = today()

  await env.DB.prepare(
    'INSERT OR REPLACE INTO progress (user_id, lesson_id, completed_at, score, xp_earned) VALUES (?, ?, ?, ?, ?)'
  )
    .bind(userId, lessonId, now, score, xp)
    .run()

  // 服务端计算连续学习天数：保证手机端 / 电脑端 streak 一致
  const userRow = await env.DB.prepare('SELECT streak, last_active_date FROM users WHERE id = ?')
    .bind(userId)
    .first<{ streak: number; last_active_date: string | null }>()

  let newStreak = 1
  if (userRow) {
    const last = userRow.last_active_date
    if (last === todayStr) {
      // 今天已经计过活跃，保持原 streak
      newStreak = userRow.streak || 1
    } else if (last) {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().slice(0, 10)
      newStreak = last === yesterdayStr ? (userRow.streak || 0) + 1 : 1
    }
  }

  await env.DB.prepare(
    'UPDATE users SET total_xp = total_xp + ?, streak = ?, last_active_date = ? WHERE id = ?'
  )
    .bind(xp, newStreak, todayStr, userId)
    .run()

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

  return jsonResponse({ success: true }, 200)
}

async function handleGetAchievements(request: Request, env: Env, userId: string): Promise<Response> {
  const rows = await env.DB.prepare('SELECT achievement_id, unlocked_at FROM achievements WHERE user_id = ?')
    .bind(userId)
    .all<AchievementRecord>()
  return jsonResponse({ unlockedAchievements: (rows.results || []).map(r => r.achievement_id) }, 200)
}

async function handleUnlockAchievement(request: Request, env: Env, userId: string): Promise<Response> {
  const url = new URL(request.url)
  const id = url.pathname.split('/').pop()
  if (!id) return jsonResponse({ error: '缺少成就ID' }, 400)

  const now = new Date().toISOString()
  await env.DB.prepare('INSERT OR IGNORE INTO achievements (user_id, achievement_id, unlocked_at) VALUES (?, ?, ?)')
    .bind(userId, id, now)
    .run()

  return jsonResponse({ success: true }, 200)
}

async function handleGetPosts(request: Request, env: Env): Promise<Response> {
  const rows = await env.DB.prepare(
    'SELECT id, author_id, author_name, content, likes, created_at FROM posts ORDER BY created_at DESC LIMIT 100'
  ).all<Post>()
  return jsonResponse({ posts: rows.results || [] }, 200)
}

async function handleCreatePost(request: Request, env: Env, userId: string): Promise<Response> {
  const body = (await request.json()) as { content?: string; authorName?: string }
  const { content, authorName = '用户' } = body
  if (!content || !content.trim()) return jsonResponse({ error: '内容不能为空' }, 400)

  const id = `p${Date.now()}`
  const now = new Date().toISOString()
  await env.DB.prepare('INSERT INTO posts (id, author_id, author_name, content, likes, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(id, userId, authorName, content.trim(), 0, now)
    .run()

  return jsonResponse({ post: { id, author_id: userId, author_name: authorName, content: content.trim(), likes: 0, created_at: now } }, 201)
}

async function handleLikePost(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url)
  const id = url.pathname.split('/').pop()
  if (!id) return jsonResponse({ error: '缺少帖子ID' }, 400)

  await env.DB.prepare('UPDATE posts SET likes = likes + 1 WHERE id = ?').bind(id).run()
  return jsonResponse({ success: true }, 200)
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

  const parent = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind('u-demo-parent').first()
  if (parent) {
    const childrenIds = ['u-demo-child1', 'u-demo-child2', 'u-demo-child3']
    await env.DB.prepare('UPDATE users SET children = ? WHERE id = ?')
      .bind(JSON.stringify(childrenIds), 'u-demo-parent')
      .run()
  }

  return jsonResponse({ success: true, message: '演示账号已初始化' }, 200)
}

// ─────────────────────────────────────────────────────────────
// 管理员相关接口
// ─────────────────────────────────────────────────────────────

// 一次性创建管理员账号：需要环境变量 ADMIN_SETUP_KEY 校验
// 若系统中已存在 admin 账号则拒绝，防止被滥用
async function handleAdminSetup(request: Request, env: Env): Promise<Response> {
  if (!env.ADMIN_SETUP_KEY) {
    return jsonResponse({ error: '服务器未配置 ADMIN_SETUP_KEY，无法创建管理员' }, 503)
  }

  const body = (await request.json()) as {
    setupKey?: string
    name?: string
    email?: string
    password?: string
  }
  const { setupKey, name, email, password } = body
  if (!setupKey || setupKey !== env.ADMIN_SETUP_KEY) {
    return jsonResponse({ error: '初始化密钥错误' }, 403)
  }
  if (!name || !email || !password) {
    return jsonResponse({ error: '缺少必填字段' }, 400)
  }
  if (password.length < 6) {
    return jsonResponse({ error: '密码至少 6 位' }, 400)
  }

  // 系统已有 admin 则禁止再次创建
  const existing = await env.DB.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").first()
  if (existing) {
    return jsonResponse({ error: '系统已存在管理员账号，禁止重复创建' }, 409)
  }

  const emailConflict = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first()
  if (emailConflict) {
    return jsonResponse({ error: '邮箱已被注册' }, 409)
  }

  const id = `a${Date.now()}`
  const passwordHash = await hashPassword(password)
  const now = new Date().toISOString()

  await env.DB.prepare(
    'INSERT INTO users (id, name, email, password_hash, grade, role, streak, total_xp, registered_at, children) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  )
    .bind(id, name, email, passwordHash, 0, 'admin', 0, 0, now, JSON.stringify([]))
    .run()

  const token = await signJwt({ sub: id, email, role: 'admin' }, env.JWT_SECRET)
  return jsonResponse({
    token,
    user: { id, name, email, grade: 0, role: 'admin', streak: 0, total_xp: 0, registered_at: now, children: [] },
  }, 201)
}

// 管理员概览统计
async function handleAdminStats(request: Request, env: Env): Promise<Response> {
  const totalUsers = await env.DB.prepare('SELECT COUNT(*) as cnt FROM users').first<{ cnt: number }>()
  const students = await env.DB.prepare("SELECT COUNT(*) as cnt FROM users WHERE role = 'student'").first<{ cnt: number }>()
  const parents = await env.DB.prepare("SELECT COUNT(*) as cnt FROM users WHERE role = 'parent'").first<{ cnt: number }>()
  const completedLessons = await env.DB.prepare('SELECT COUNT(*) as cnt FROM progress').first<{ cnt: number }>()
  const posts = await env.DB.prepare('SELECT COUNT(*) as cnt FROM posts').first<{ cnt: number }>()

  return jsonResponse({
    totalUsers: totalUsers?.cnt || 0,
    students: students?.cnt || 0,
    parents: parents?.cnt || 0,
    completedLessons: completedLessons?.cnt || 0,
    posts: posts?.cnt || 0,
  }, 200)
}

// 列出所有用户（支持关键词搜索与角色过滤）
async function handleAdminListUsers(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url)
  const keyword = url.searchParams.get('keyword')?.trim() || ''
  const role = url.searchParams.get('role') || ''

  let sql = 'SELECT id, name, email, grade, role, streak, total_xp, registered_at, children FROM users'
  const conditions: string[] = []
  const binds: unknown[] = []

  if (keyword) {
    conditions.push('(name LIKE ? OR email LIKE ?)')
    binds.push(`%${keyword}%`, `%${keyword}%`)
  }
  if (role && ['student', 'parent', 'admin'].includes(role)) {
    conditions.push('role = ?')
    binds.push(role)
  }
  if (conditions.length) {
    sql += ' WHERE ' + conditions.join(' AND ')
  }
  sql += ' ORDER BY registered_at DESC LIMIT 500'

  const rows = await env.DB.prepare(sql).bind(...binds).all<{
    id: string
    name: string
    email: string
    grade: number
    role: 'student' | 'parent' | 'admin'
    streak: number
    total_xp: number
    registered_at: string
    children: string
  }>()

  const users = (rows.results || []).map(r => ({
    id: r.id,
    name: r.name,
    email: r.email,
    grade: r.grade,
    role: r.role,
    streak: r.streak,
    total_xp: r.total_xp,
    registered_at: r.registered_at,
    children: JSON.parse(String(r.children || '[]')),
  }))

  return jsonResponse({ users }, 200)
}

// 删除用户：同时清理 progress / achievements / daily_goals / posts，以及家长账号里的引用
async function handleAdminDeleteUser(request: Request, env: Env, targetId: string): Promise<Response> {
  if (!targetId) return jsonResponse({ error: '缺少用户ID' }, 400)

  const target = await env.DB.prepare('SELECT id, role FROM users WHERE id = ?').bind(targetId).first<{ id: string; role: string }>()
  if (!target) return jsonResponse({ error: '用户不存在' }, 404)
  if (target.role === 'admin') {
    return jsonResponse({ error: '不能删除管理员账号' }, 403)
  }

  // 删除关联数据
  await env.DB.batch([
    env.DB.prepare('DELETE FROM progress WHERE user_id = ?').bind(targetId),
    env.DB.prepare('DELETE FROM achievements WHERE user_id = ?').bind(targetId),
    env.DB.prepare('DELETE FROM daily_goals WHERE user_id = ?').bind(targetId),
    env.DB.prepare('DELETE FROM posts WHERE author_id = ?').bind(targetId),
    env.DB.prepare('DELETE FROM users WHERE id = ?').bind(targetId),
  ])

  // 从所有家长账号的 children 数组中移除该 ID
  const parents = await env.DB.prepare("SELECT id, children FROM users WHERE role = 'parent'").all<{ id: string; children: string }>()
  for (const p of parents.results || []) {
    try {
      const arr: string[] = JSON.parse(String(p.children || '[]'))
      if (arr.includes(targetId)) {
        const next = arr.filter(x => x !== targetId)
        await env.DB.prepare('UPDATE users SET children = ? WHERE id = ?').bind(JSON.stringify(next), p.id).run()
      }
    } catch {
      // ignore JSON 解析错误
    }
  }

  return jsonResponse({ success: true }, 200)
}

// 重置用户密码
async function handleAdminResetPassword(request: Request, env: Env, targetId: string): Promise<Response> {
  if (!targetId) return jsonResponse({ error: '缺少用户ID' }, 400)
  const body = (await request.json()) as { password?: string }
  const { password } = body
  if (!password || password.length < 6) {
    return jsonResponse({ error: '密码至少 6 位' }, 400)
  }

  const target = await env.DB.prepare('SELECT id, role FROM users WHERE id = ?').bind(targetId).first<{ id: string; role: string }>()
  if (!target) return jsonResponse({ error: '用户不存在' }, 404)
  if (target.role === 'admin') {
    return jsonResponse({ error: '不能重置管理员密码' }, 403)
  }

  const passwordHash = await hashPassword(password)
  await env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(passwordHash, targetId).run()
  return jsonResponse({ success: true }, 200)
}

// Main router
export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context

  if (request.method === 'OPTIONS') {
    return corsPreflight()
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
    // 创建管理员：需 setup key，不算公开接口但也不需要 admin token
    if (pathname === '/api/admin/setup' && request.method === 'POST') {
      return await handleAdminSetup(request, env)
    }

    // Protected
    const userId = await getUserId(request, env)
    if (!userId) {
      return jsonResponse({ error: '未登录或 token 无效' }, 401)
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

    // ─── 管理员接口（需要 admin token） ───
    if (pathname.startsWith('/api/admin/')) {
      const adminId = await requireAdmin(request, env)
      if (!adminId) {
        return jsonResponse({ error: '无管理员权限' }, 403)
      }

      if (pathname === '/api/admin/stats' && request.method === 'GET') {
        return await handleAdminStats(request, env)
      }
      if (pathname === '/api/admin/users' && request.method === 'GET') {
        return await handleAdminListUsers(request, env)
      }
      // /api/admin/users/:id  (DELETE)
      if (pathname.startsWith('/api/admin/users/') && request.method === 'DELETE') {
        const targetId = decodeURIComponent(pathname.split('/').pop() || '')
        return await handleAdminDeleteUser(request, env, targetId)
      }
      // /api/admin/users/:id/reset-password  (POST)
      if (pathname.startsWith('/api/admin/users/') && pathname.endsWith('/reset-password') && request.method === 'POST') {
        const parts = pathname.split('/')
        const targetId = decodeURIComponent(parts[parts.length - 2] || '')
        return await handleAdminResetPassword(request, env, targetId)
      }
    }

    return jsonResponse({ error: 'Not Found' }, 404)
  } catch (err) {
    console.error(err)
    return jsonResponse({ error: '服务器内部错误' }, 500)
  }
}
