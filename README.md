# EnglishMind - 沉浸式英语学习平台

为 1-9 年级学生打造的沉浸式英语学习系统，支持多设备数据同步、PWA 离线使用、家长后台监控。

## 功能特性

### 学习模块
- **单词记忆**：四阶段学习法（学习→认词→拼写→复习），1-6年级各400词，7-9年级各600词，每个 Unit 30 词
- **语法练习**：750+ 道题，覆盖各年级语法知识点
- **口语跟读**：450 条金句，每年级 50 句，支持语音朗读
- **听力训练**：900+ 题，日常对话与情景听力
- **每日一句**：450 条金句每日轮换，含音标与释义

### 系统功能
- **跨设备同步**：基于 Cloudflare D1 数据库，手机/电脑账号互通
- **PWA 安装**：支持添加到桌面，离线可用
- **家长后台**：查看孩子学习进度、已背单词数、完成课程数
- **学习进度**：连续学习天数、已背单词、累计 XP、今日目标
- **社区互动**：学习打卡与交流

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | React 18 + TypeScript |
| 构建工具 | Vite 5 |
| 状态管理 | Zustand |
| 路由 | React Router v6 |
| 动画 | Framer Motion |
| 图表 | Recharts |
| 图标 | Lucide React |
| 后端 | Cloudflare Pages Functions |
| 数据库 | Cloudflare D1 (SQLite) |
| 认证 | JWT Token |
| PWA | Service Worker + Web App Manifest |

## 项目结构

```
english-study/
├── 英语学习网站/
│   ├── functions/api/          # Cloudflare Pages Functions (后端 API)
│   │   └── [[path]].ts         # 统一 API 入口（注册/登录/进度/社区）
│   ├── migrations/             # D1 数据库迁移文件
│   ├── public/
│   │   ├── manifest.json       # PWA 配置
│   │   ├── sw.js               # Service Worker
│   │   └── _routes.json        # Cloudflare 路由配置
│   ├── src/
│   │   ├── api/client.ts       # API 请求封装
│   │   ├── components/
│   │   │   ├── Layout.tsx      # 全局布局（导航/安装提示）
│   │   │   └── lessons/        # 四种课程组件
│   │   ├── data/
│   │   │   ├── vocab/          # 分级词库（1-9年级）
│   │   │   ├── courses.ts      # 课程结构与智能分配
│   │   │   ├── grammar.ts      # 语法题库
│   │   │   ├── speaking.ts     # 口语金句
│   │   │   ├── listening.ts    # 听力题库
│   │   │   └── dailySentences.ts # 每日一句
│   │   ├── pages/              # 页面组件
│   │   ├── store/index.ts      # Zustand 状态管理
│   │   └── types/index.ts      # TypeScript 类型定义
│   ├── wrangler.toml           # Cloudflare 配置
│   └── package.json
└── README.md
```

## 快速开始

### 环境要求

- Node.js >= 18（推荐 20，项目含 `.nvmrc`）
- npm >= 9

### 本地开发

```bash
# 1. 进入项目目录
cd 英语学习网站

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env，设置 VITE_API_URL 指向本地或线上 API

# 4. 启动开发服务器
npm run dev
# 访问 http://localhost:5173
```

### 本地后端（Cloudflare Pages Functions）

```bash
# 安装 Wrangler CLI
npm install -g wrangler

# 创建本地 D1 数据库
wrangler d1 create englishmind-db

# 执行数据库迁移
wrangler d1 execute englishmind-db --local --file=migrations/0001_initial.sql
wrangler d1 execute englishmind-db --local --file=migrations/0002_add_last_active_date.sql

# 设置 JWT 密钥
# 在 wrangler.toml 中添加：
# [vars]
# JWT_SECRET = "your-secret-key"

# 启动本地后端
wrangler pages dev dist --local-protocol=http
```

### 生产部署

```bash
# 1. 构建前端
npm run build:check

# 2. 创建生产 D1 数据库
wrangler d1 create englishmind-db

# 3. 执行生产迁移
wrangler d1 execute englishmind-db --file=migrations/0001_initial.sql
wrangler d1 execute englishmind-db --file=migrations/0002_add_last_active_date.sql

# 4. 部署到 Cloudflare Pages
wrangler pages deploy dist
```

> **Cloudflare Dashboard 设置**：Build output directory = `dist`，Root directory = `英语学习网站`

## 数据概览

| 数据类型 | 数量 | 说明 |
|----------|------|------|
| 单词词库 | 4,200 | 1-6年级各400，7-9年级各600 |
| 语法练习 | 750+ | 覆盖 1-9 年级语法点 |
| 口语金句 | 450 | 每年级 50 句 |
| 听力训练 | 900+ | 每年级约 100 题 |
| 每日一句 | 450 | 每日轮换，365 天不重复 |

## 版本缓存机制

项目使用三重缓存策略确保用户获取最新版本：

1. **Service Worker 版本号**（`public/sw.js` 中 `CACHE_VERSION`）— 控制静态资源缓存
2. **HTML meta 版本号**（`index.html` 中 `<meta name="app-version">`）— 页面加载时自动检测版本变化
3. **SW 更新监听**（`App.tsx`）— 新 SW 安装后自动激活并刷新

**发布新版本时**：更新 `sw.js` 的 `CACHE_VERSION` 和 `index.html` 的 `app-version`，用户打开网站会自动清理旧缓存并刷新。

## 账号体系

- **学生账号**：选择年级，学习课程，查看进度
- **家长账号**：绑定孩子账号，查看学习数据
- **数据同步**：JWT 认证 + D1 数据库，任意设备登录数据一致

## License

MIT
