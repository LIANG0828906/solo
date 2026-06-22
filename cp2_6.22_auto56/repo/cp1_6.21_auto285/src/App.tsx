import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { Book, User } from '@shared/types'
import Home from '@/pages/Home'
import Profile from '@/pages/Profile'

const mockBooks: Book[] = [
  {
    id: 'book-1',
    title: '百年孤独',
    author: '加西亚·马尔克斯',
    isbn: '978-7-5442-5399-4',
    description: '魔幻现实主义文学代表作，讲述布恩迪亚家族七代人的传奇故事...',
    coverImage: 'https://picsum.photos/seed/book1/400/600',
    status: 'available',
    ownerId: 'user-1',
    createdAt: new Date().toISOString()
  },
  {
    id: 'book-2',
    title: '活着',
    author: '余华',
    isbn: '978-7-5063-3043-5',
    description: '讲述了农村人福贵悲惨的人生遭遇...',
    coverImage: 'https://picsum.photos/seed/book2/400/600',
    status: 'available',
    ownerId: 'user-2',
    createdAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'book-3',
    title: '三体',
    author: '刘慈欣',
    isbn: '978-7-5366-9293-0',
    description: '文化大革命如火如荼进行的同时，军方探寻外星文明的绝秘计划...',
    coverImage: 'https://picsum.photos/seed/book3/400/600',
    status: 'borrowed',
    ownerId: 'user-3',
    createdAt: new Date(Date.now() - 172800000).toISOString()
  },
  {
    id: 'book-4',
    title: '围城',
    author: '钱钟书',
    isbn: '978-7-02-002608-5',
    description: '从印度洋上驶向中国的一艘法国邮船上，发生了一连串的故事...',
    coverImage: 'https://picsum.photos/seed/book4/400/600',
    status: 'available',
    ownerId: 'user-1',
    createdAt: new Date(Date.now() - 259200000).toISOString()
  },
  {
    id: 'book-5',
    title: '红楼梦',
    author: '曹雪芹',
    isbn: '978-7-02-000220-5',
    description: '以贾宝玉、林黛玉、薛宝钗的爱情婚姻悲剧为主线...',
    coverImage: 'https://picsum.photos/seed/book5/400/600',
    status: 'pending',
    ownerId: 'user-2',
    createdAt: new Date(Date.now() - 345600000).toISOString()
  },
  {
    id: 'book-6',
    title: '平凡的世界',
    author: '路遥',
    isbn: '978-7-5302-1200-4',
    description: '这是一部全景式地表现中国当代城乡社会生活的长篇小说...',
    coverImage: 'https://picsum.photos/seed/book6/400/600',
    status: 'available',
    ownerId: 'user-3',
    createdAt: new Date(Date.now() - 432000000).toISOString()
  },
  {
    id: 'book-7',
    title: '小王子',
    author: '安托万·德·圣-埃克苏佩里',
    isbn: '978-7-02-004249-9',
    description: '一个来自B-612号小行星的小王子，他离开自己的星球...',
    coverImage: 'https://picsum.photos/seed/book7/400/600',
    status: 'available',
    ownerId: 'user-1',
    createdAt: new Date(Date.now() - 518400000).toISOString()
  },
  {
    id: 'book-8',
    title: '追风筝的人',
    author: '卡勒德·胡赛尼',
    isbn: '978-7-208-06164-1',
    description: '12岁的阿富汗富家少爷阿米尔与仆人哈桑情同手足...',
    coverImage: 'https://picsum.photos/seed/book8/400/600',
    status: 'borrowed',
    ownerId: 'user-2',
    createdAt: new Date(Date.now() - 604800000).toISOString()
  }
]

const mockUsers: User[] = [
  {
    id: 'user-1',
    name: '李明',
    avatar: 'https://i.pravatar.cc/150?img=1',
    reputation: 4.8,
    ratingCount: 15,
    ratings: [5, 5, 4, 5, 5]
  },
  {
    id: 'user-2',
    name: '王芳',
    avatar: 'https://i.pravatar.cc/150?img=2',
    reputation: 4.5,
    ratingCount: 12,
    ratings: [4, 5, 4, 5]
  },
  {
    id: 'user-3',
    name: '张伟',
    avatar: 'https://i.pravatar.cc/150?img=3',
    reputation: 2.8,
    ratingCount: 8,
    ratings: [3, 2, 3, 3]
  }
]

export default function App() {
  const [books, setBooks] = useState<Book[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const currentUserId = 'user-1'

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [booksRes, usersRes] = await Promise.all([
          axios.get('/api/books'),
          axios.get('/api/users')
        ])
        setBooks(booksRes.data)
        setUsers(usersRes.data)
      } catch (error) {
        console.error('Failed to fetch data, using mock data:', error)
        setBooks(mockBooks)
        setUsers(mockUsers)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-500">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <Home
              books={books}
              onBooksChange={setBooks}
              currentUserId={currentUserId}
            />
          }
        />
        <Route
          path="/profile/:id"
          element={<Profile users={users} />}
        />
        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-slate-800 mb-2">404</h1>
                <p className="text-slate-500">页面不存在</p>
              </div>
            </div>
          }
        />
      </Routes>
    </Router>
  )
}
