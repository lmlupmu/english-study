import type { Post } from '@/types'

export const mockPosts: Post[] = [
  {
    id: '1',
    authorId: 'u2',
    authorName: 'EnglishFan',
    content: '今天完成了三年级的所有单词，感觉进步很大！坚持每天学习真的有用。',
    likes: 24,
    comments: 5,
    createdAt: '2026-07-31T08:30:00',
  },
  {
    id: '2',
    authorId: 'u3',
    authorName: 'TomLovesEnglish',
    content: '口语跟读功能太棒了，模仿native speaker的发音对提升语感很有帮助。',
    likes: 18,
    comments: 3,
    createdAt: '2026-07-30T19:20:00',
  },
  {
    id: '3',
    authorId: 'u4',
    authorName: 'StudyWithLily',
    content: '有人一起组队打卡吗？我已经连续学习 5 天了，目标是坚持一个月。',
    likes: 31,
    comments: 12,
    createdAt: '2026-07-29T16:45:00',
  },
  {
    id: '4',
    authorId: 'u5',
    authorName: 'GrammarGuru',
    content: '分享一个语法小技巧：remember to do 表示记得去做，remember doing 表示记得做过。',
    likes: 42,
    comments: 8,
    createdAt: '2026-07-28T21:10:00',
  },
]
