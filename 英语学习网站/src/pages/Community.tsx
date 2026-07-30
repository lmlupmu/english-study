import { useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, MessageCircle, Send } from 'lucide-react'
import { useUserStore, useCommunityStore } from '@/store'
import './Community.css'

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function Community() {
  const { user, isAuthenticated } = useUserStore()
  const { posts, addPost, likePost } = useCommunityStore()
  const [content, setContent] = useState('')

  const handlePost = () => {
    if (!content.trim() || !user) return
    addPost(content.trim(), user.name)
    setContent('')
  }

  return (
    <div className="page community-page">
      <div className="container">
        <div className="page-header">
          <h1>学习社区</h1>
          <p>分享学习心得、交流方法，与伙伴们一起坚持。</p>
        </div>

        {isAuthenticated ? (
          <div className="post-creator">
            <div className="creator-avatar">{user?.name?.[0] || 'U'}</div>
            <div className="creator-input-wrap">
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="分享今天的学习收获..."
                rows={3}
              />
              <div className="creator-actions">
                <span className="char-count">{content.length}/200</span>
                <button className="btn btn-primary" onClick={handlePost} disabled={!content.trim()}>
                  <Send size={16} /> 发布
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="guest-notice">
            登录后即可参与社区讨论。
          </div>
        )}

        <div className="posts-list">
          {posts.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="post-card"
            >
              <div className="post-header">
                <div className="post-avatar">{post.authorName[0]}</div>
                <div>
                  <div className="post-author">{post.authorName}</div>
                  <div className="post-time">{formatTime(post.createdAt)}</div>
                </div>
              </div>
              <p className="post-content">{post.content}</p>
              <div className="post-actions">
                <button className="post-action" onClick={() => likePost(post.id)}>
                  <Heart size={18} /> {post.likes}
                </button>
                <button className="post-action">
                  <MessageCircle size={18} /> {post.comments}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
