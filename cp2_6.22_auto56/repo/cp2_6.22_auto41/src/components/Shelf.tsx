import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, BookOpen, Lightbulb, X } from 'lucide-react'
import type { Book } from '@/types'

const COLORS = [
  '#4A90D9', '#5B6ABF', '#7C5CBF', '#E74C3C', '#E67E22',
  '#F39C12', '#27AE60', '#16A085', '#2C3E50', '#8E44AD',
  '#D35400', '#2980B9', '#1ABC9C', '#C0392B', '#7F8C8D',
]

const STATUS_MAP: Record<Book['status'], { label: string; cls: string }> = {
  unread: { label: '未读', cls: 'bg-gray-100 text-gray-500' },
  reading: { label: '在读', cls: 'bg-blue-100 text-blue-600' },
  finished: { label: '读完', cls: 'bg-green-100 text-green-600' },
}

export default function Shelf() {
  const [books, setBooks] = useState<Book[]>([])
  const [showModal, setShowModal] = useState(false)
  const [recommendation, setRecommendation] = useState<{ message: string } | null>(null)
  const [form, setForm] = useState({ title: '', author: '', totalPages: '', coverColor: '#4A90D9' })
  const [newBookId, setNewBookId] = useState<string | null>(null)
  const navigate = useNavigate()

  const fetchBooks = useCallback(async () => {
    const res = await fetch('/api/user/books')
    const data = await res.json()
    setBooks(data)
  }, [])

  const fetchRecommendation = useCallback(async () => {
    try {
      const res = await fetch('/api/user/recommendation')
      const data = await res.json()
      if (data.book) setRecommendation(data)
    } catch {}
  }, [])

  useEffect(() => {
    fetchBooks()
    fetchRecommendation()
  }, [fetchBooks, fetchRecommendation])

  const handleCreate = async () => {
    if (!form.title || !form.author || !form.totalPages) return
    const res = await fetch('/api/user/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title,
        author: form.author,
        totalPages: Number(form.totalPages),
        coverColor: form.coverColor,
      }),
    })
    const newBook = await res.json()
    setNewBookId(newBook.id)
    setShowModal(false)
    setForm({ title: '', author: '', totalPages: '', coverColor: '#4A90D9' })
    await fetchBooks()
    await fetchRecommendation()
    setTimeout(() => setNewBookId(null), 600)
  }

  const goReading = (bookId: string) => {
    navigate(`/reading?bookId=${bookId}`)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 pt-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">我的书架</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-medium
            bg-gradient-to-r from-blue-500 to-blue-400 shadow-md
            hover:scale-105 active:scale-95 transition-transform duration-200"
        >
          <Plus size={16} /> 添加书籍
        </button>
      </div>

      {recommendation && (
        <div className="mb-5 flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700">
          <Lightbulb size={16} className="shrink-0 text-blue-400" />
          <span>{recommendation.message}</span>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {books.map((book) => {
          const pct = book.totalPages > 0 ? Math.round((book.currentPage / book.totalPages) * 100) : 0
          const status = STATUS_MAP[book.status]
          const isNew = book.id === newBookId

          return (
            <div
              key={book.id}
              onClick={() => goReading(book.id)}
              className={`group relative rounded-xl overflow-hidden cursor-pointer
                shadow-[0_2px_8px_rgba(74,144,217,0.12)] hover:shadow-[0_6px_20px_rgba(74,144,217,0.22)]
                hover:-translate-y-1 transition-all duration-300
                ${isNew ? 'animate-slide-in-right' : ''}`}
            >
              <div
                className="h-36 flex items-center justify-center relative"
                style={{ backgroundColor: book.coverColor }}
              >
                <BookOpen size={40} className="text-white/40" />
                <span
                  className="absolute bottom-2 right-2 text-[10px] px-1.5 py-0.5 rounded-full font-medium text-white/80"
                  style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
                >
                  {status.label}
                </span>
              </div>

              <div className="bg-white p-3">
                <h3 className="text-sm font-semibold text-gray-800 truncate">{book.title}</h3>
                <p className="text-xs text-gray-400 truncate mt-0.5">{book.author}</p>

                <div className="mt-2">
                  <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                    <span>{book.currentPage}/{book.totalPages}页</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, ${book.coverColor}88, ${book.coverColor})`,
                      }}
                    />
                  </div>
                </div>

                <span className={`inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full font-medium ${status.cls}`}>
                  {status.label}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {books.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-300">
          <BookOpen size={48} />
          <p className="mt-3 text-sm">书架空空如也，添加第一本书吧</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-[90%] max-w-md p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-800">添加新书</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">书名</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 transition"
                  placeholder="输入书名"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">作者</label>
                <input
                  value={form.author}
                  onChange={(e) => setForm({ ...form, author: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 transition"
                  placeholder="输入作者"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">总页数</label>
                <input
                  type="number"
                  value={form.totalPages}
                  onChange={(e) => setForm({ ...form, totalPages: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 transition"
                  placeholder="输入总页数"
                  min={1}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">封面颜色</label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setForm({ ...form, coverColor: c })}
                      className={`w-7 h-7 rounded-full border-2 transition-transform duration-150 hover:scale-110 ${
                        form.coverColor === c ? 'border-gray-800 scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-500 font-medium
                  hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                className="flex-1 py-2.5 rounded-lg text-white text-sm font-medium
                  bg-gradient-to-r from-blue-500 to-blue-400 shadow-md
                  hover:scale-105 active:scale-95 transition-transform duration-200"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
