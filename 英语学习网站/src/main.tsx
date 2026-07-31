import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles/global.css'

// 渲染 React 应用
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)

// 应用挂载完成后，淡出启动屏
const fadeOutSplash = () => {
  const splash = document.getElementById('initial-splash')
  if (!splash) return
  splash.classList.add('fade-out')
  setTimeout(() => splash.remove(), 350)
}
// 等待第一个内容渲染完成后再淡出
requestAnimationFrame(() => setTimeout(fadeOutSplash, 100))

// ─────────────────────────────────────────────────────────────
// Service Worker 注册
// 实现：离线缓存、后台同步、PWA 安装支持
// ─────────────────────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then(registration => {
        // 检测到新 SW 版本时，自动激活
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (!newWorker) return
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // 新版本可用，提示用户刷新
              console.log('🔄 发现新版本，刷新页面即可更新')
              // 可选：显示一个 Toast 让用户刷新
              showUpdatePrompt()
            }
          })
        })
      })
      .catch(err => {
        console.warn('Service Worker 注册失败:', err)
      })

    // 当 SW 控制权改变时，刷新页面
    let refreshing = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return
      refreshing = true
      window.location.reload()
    })
  })
}

// PWA 安装提示（可选：静默处理，浏览器自动提示）
if ('beforeinstallprompt' in window) {
  // 阻止默认提示，后续可改为自定义 UI
  ;(window as unknown as { addEventListener: (type: string, handler: EventListener) => void }).addEventListener(
    'beforeinstallprompt',
    (event: Event) => {
      event.preventDefault()
      // 存储事件，用于自定义安装按钮
      ;(window as unknown as { deferredPrompt?: Event }).deferredPrompt = event
      console.log('📱 PWA 可安装，等待用户触发')
    }
  )
}

// 显示更新提示
function showUpdatePrompt() {
  const toast = document.createElement('div')
  toast.style.cssText = `
    position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
    background: #1f2937; color: white; padding: 12px 20px; border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 99999;
    display: flex; align-items: center; gap: 12px; font-size: 14px;
  `
  toast.innerHTML = `
    <span>有新版本可用</span>
    <button id="sw-refresh" style="
      background: #6366f1; color: white; border: none; padding: 6px 14px;
      border-radius: 6px; cursor: pointer; font-size: 13px;
    ">刷新</button>
    <button id="sw-dismiss" style="
      background: transparent; color: #9ca3af; border: none; cursor: pointer;
      font-size: 13px;
    ">稍后</button>
  `
  document.body.appendChild(toast)

  toast.querySelector('#sw-refresh')?.addEventListener('click', () => {
    window.location.reload()
  })
  toast.querySelector('#sw-dismiss')?.addEventListener('click', () => {
    toast.remove()
  })
  setTimeout(() => toast.remove(), 8000)
}
