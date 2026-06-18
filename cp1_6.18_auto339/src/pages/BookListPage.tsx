import { useEffect, useState, FormEvent, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Plus, Share2, Copy, Check, Edit3, Save, X, Trash2,
  BookOpen, User, StickyNote, Eye, EyeOff, RefreshCw
} from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useBookStore } from '../stores/bookStore'
import { booklistAPI } from '../api'

export default function BookListPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.user)
  const { currentBooklist, fetchBooklist, addBook, updateBookProgress, cloneBooklist, fetchMyBooklists } = useBookStore()

  const [showAddBook, setShowAddBook] = useState(false)
  const [editingBookId, setEditingBookId] = useState<number | null>(null)
  const [editNotes, setEditNotes] = useState('')
  const [editProgress, setEditProgress] = useState(0)
  const [copied, setCopied] = useState(false)
  const [editingInfo, setEditingInfo] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editIsPublic, setEditIsPublic] = useState(false)
  const [saving, setSaving] = useState(false)

  const [bookTitle, setBookTitle] = useState('')
  const [bookAuthor, setBookAuthor] = useState('')
  const [bookCover, setBookCover] = useState('')
  const [bookTags, setBookTags] = useState('')
  const [bookProgress, setBookProgress] = useState(0)
  const [bookNotes, setBookNotes] = useState('')
  const [suggestions, setSuggestions] = useState<{ title: string; author: string }[]>([])
  const suggestionTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (id) fetchBooklist(parseInt(id))
  }, [id, fetchBooklist])

  useEffect(() => {
    if (currentBooklist) {
      setEditName(currentBooklist.name)
      setEditDesc(currentBooklist.description)
      setEditIsPublic(currentBooklist.is_public)
    }
  }, [currentBooklist])

  const isOwner = currentBooklist && currentUser && currentBooklist.user_id === currentUser.id

  const handleTitleChange = (value: string) => {
    setBookTitle(value)
    if (suggestionTimer.current) clearTimeout(suggestionTimer.current)
    if (value.trim().length >= 1) {
      suggestionTimer.current = setTimeout(async () => {
        try {
          const data = await booklistAPI.autocomplete(value)
          setSuggestions(data)
        } catch {
          setSuggestions([])
        }
      }, 200)
    } else {
      setSuggestions([])
    }
  }

  const handleAddBook = async (e: FormEvent) => {
    e.preventDefault()
    if (!id || !bookTitle.trim() || !bookAuthor.trim()) return
    setSaving(true)
    try {
      await addBook(parseInt(id), {
        title: bookTitle.trim(),
        author: bookAuthor.trim(),
        cover_url: bookCover.trim() || undefined,
        tags: bookTags,
        progress: bookProgress,
        notes: bookNotes,
      })
      setBookTitle('')
      setBookAuthor('')
      setBookCover('')
      setBookTags('')
      setBookProgress(0)
      setBookNotes('')
      setSuggestions([])
      setShowAddBook(false)
    } finally {
      setSaving(false)
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClone = async () => {
    if (!id) return
    try {
      const bl = await cloneBooklist(parseInt(id))
      await fetchMyBooklists()
      navigate(`/booklist/${bl.id}`)
    } catch (err: any) {
      alert(err.response?.data?.detail || '克隆失败')
    }
  }

  const handleSaveInfo = async () => {
    if (!id) return
    setSaving(true)
    try {
      await booklistAPI.update(parseInt(id), {
        name: editName,
        description: editDesc,
        is_public: editIsPublic,
      })
      await fetchBooklist(parseInt(id))
      setEditingInfo(false)
    } finally {
      setSaving(false)
    }
  }

  const startEditBook = (book: any) => {
    setEditingBookId(book.id)
    setEditProgress(book.progress)
    setEditNotes(book.notes)
  }

  const saveEditBook = async () => {
    if (!id || editingBookId === null) return
    setSaving(true)
    try {
      await updateBookProgress(parseInt(id), editingBookId, editProgress, editNotes)
      setEditingBookId(null)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteBook = async (bookId: number) => {
    if (!id) return
    if (!confirm('确定删除这本书吗？')) return
    try {
      await booklistAPI.deleteBook(parseInt(id), bookId)
      await fetchBooklist(parseInt(id))
    } catch (err: any) {
      alert(err.response?.data?.detail || '删除失败')
    }
  }

  if (!currentBooklist) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="animate-spin text-[#4ECDC4]" size={32} />
      </div>
    )
  }

  const avgProgress = currentBooklist.books.length > 0
    ? Math.round(currentBooklist.books.reduce((s, b) => s + b.progress, 0) / currentBooklist.books.length)
    : 0

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-5">
        <Link to="/" className="p-2 rounded-lg hover:bg-white/60 text-[#3E2723] transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold text-[#3E2723]">书单详情</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] overflow-hidden mb-6">
        <div
          className="p-8 text-white"
          style={{ backgroundColor: currentBooklist.cover_color }}
        >
          {!editingInfo ? (
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-2">{currentBooklist.name}</h2>
                <p className="text-white/90 mb-3">{currentBooklist.description || '暂无简介'}</p>
                <div className="flex items-center gap-4 text-white/80 text-sm">
                  <span className="flex items-center gap-1">
                    <User size={14} />
                    {currentBooklist.user?.username || '未知'}
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen size={14} />
                    {currentBooklist.books.length} 本书
                  </span>
                  <span>平均进度 {avgProgress}%</span>
                  <span className="flex items-center gap-1">
                    {currentBooklist.is_public ? <Eye size={14} /> : <EyeOff size={14} />}
                    {currentBooklist.is_public ? '公开' : '私密'}
                  </span>
                </div>
              </div>
              {isOwner && (
                <button
                  onClick={() => setEditingInfo(true)}
                  className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                >
                  <Edit3 size={18} />
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1 text-white/90">书单名称</label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value.slice(0, 30))}
                  className="w-full px-3 py-2 rounded-lg bg-white/90 text-[#3E2723]"
                  maxLength={30}
                />
              </div>
              <div>
                <label className="block text-sm mb-1 text-white/90">简介</label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value.slice(0, 200))}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg bg-white/90 text-[#3E2723] resize-none"
                  maxLength={200}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="public"
                  checked={editIsPublic}
                  onChange={(e) => setEditIsPublic(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="public" className="text-sm">设为公开书单</label>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setEditingInfo(false)}
                  className="py-2 px-5 rounded-lg bg-white/20 hover:bg-white/30 flex items-center gap-1 transition-colors"
                >
                  <X size={16} />
                  取消
                </button>
                <button
                  onClick={handleSaveInfo}
                  disabled={saving || !editName.trim()}
                  className="py-2 px-5 rounded-lg bg-white text-[#3E2723] font-medium hover:bg-white/90 disabled:opacity-50 flex items-center gap-1 transition-colors"
                >
                  <Save size={16} />
                  {saving ? '保存中...' : '保存'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-5 flex flex-wrap items-center gap-3">
          <button
            onClick={handleCopyLink}
            className="py-2 px-4 rounded-lg border border-gray-200 text-[#3E2723] hover:bg-gray-50 flex items-center gap-2 transition-colors"
          >
            {copied ? <Check size={16} className="text-[#3BB78F]" /> : <Share2 size={16} />}
            {copied ? '链接已复制' : '复制分享链接'}
          </button>
          <Copy size={0} className="hidden" />
          {!isOwner && (
            <button
              onClick={handleClone}
              className="py-2 px-4 rounded-lg bg-[#4ECDC4] text-[#3E2723] font-medium hover:bg-[#3DB9B0] flex items-center gap-2 transition-colors"
            >
              <Plus size={16} />
              一键克隆书单
            </button>
          )}
          {isOwner && (
            <button
              onClick={() => setShowAddBook(true)}
              className="py-2 px-4 rounded-lg bg-[#3E2723] text-[#F5F0E1] font-medium hover:bg-[#5D4037] flex items-center gap-2 ml-auto transition-colors"
            >
              <Plus size={16} />
              添加书籍
            </button>
          )}
        </div>
      </div>

      {showAddBook && isOwner && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowAddBook(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-[#3E2723] mb-5">添加书籍</h3>
            <form onSubmit={handleAddBook} className="space-y-4">
              <div className="relative">
                <label className="block text-sm font-medium text-[#3E2723] mb-1.5">书名 <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={bookTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-[#FAFAFA] text-[#3E2723]"
                  placeholder="输入书名..."
                  required
                />
                {suggestions.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setBookTitle(s.title)
                          setBookAuthor(s.author)
                          setSuggestions([])
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-[#F5F0E1] text-sm border-b border-gray-100 last:border-b-0"
                      >
                        <p className="text-[#3E2723] font-medium">{s.title}</p>
                        <p className="text-gray-500 text-xs">{s.author}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#3E2723] mb-1.5">作者 <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={bookAuthor}
                  onChange={(e) => setBookAuthor(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-[#FAFAFA] text-[#3E2723]"
                  placeholder="输入作者..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#3E2723] mb-1.5">封面图片URL（可选）</label>
                <input
                  type="url"
                  value={bookCover}
                  onChange={(e) => setBookCover(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-[#FAFAFA] text-[#3E2723]"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#3E2723] mb-1.5">标签（逗号分隔）</label>
                <input
                  type="text"
                  value={bookTags}
                  onChange={(e) => setBookTags(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-[#FAFAFA] text-[#3E2723]"
                  placeholder="例如：治愈,小说,日本文学"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#3E2723] mb-1.5">
                  阅读进度：{bookProgress}%
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={bookProgress}
                  onChange={(e) => setBookProgress(parseInt(e.target.value))}
                  className="w-full accent-[#4ECDC4]"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0%</span><span>50%</span><span>100%</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#3E2723] mb-1.5">阅读笔记（最多500字，支持Markdown）</label>
                <textarea
                  value={bookNotes}
                  onChange={(e) => setBookNotes(e.target.value.slice(0, 500))}
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-[#FAFAFA] text-[#3E2723] resize-none font-mono text-sm"
                  placeholder="记录你的阅读感悟..."
                  maxLength={500}
                />
                <p className="text-xs text-gray-400 mt-1 text-right">{bookNotes.length}/500</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddBook(false)}
                  className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={saving || !bookTitle.trim() || !bookAuthor.trim()}
                  className="flex-1 py-2.5 rounded-lg bg-[#4ECDC4] text-[#3E2723] font-semibold hover:bg-[#3DB9B0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? '添加中...' : '添加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {currentBooklist.books.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-12 text-center">
          <BookOpen size={56} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 mb-4">这个书单还是空的</p>
          {isOwner && (
            <button
              onClick={() => setShowAddBook(true)}
              className="py-2.5 px-5 rounded-lg bg-[#4ECDC4] text-[#3E2723] font-medium hover:bg-[#3DB9B0] transition-colors"
            >
              添加第一本书
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {currentBooklist.books.map((book) => (
            <div key={book.id} className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-5">
              <div className="flex gap-4">
                {book.cover_url ? (
                  <img
                    src={book.cover_url}
                    alt={book.title}
                    className="w-20 h-28 object-cover rounded-lg flex-shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                ) : (
                  <div
                    className="w-20 h-28 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0"
                    style={{ backgroundColor: currentBooklist.cover_color }}
                  >
                    {book.title.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  {editingBookId === book.id ? (
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-[#3E2723] mb-1">
                          阅读进度：{editProgress}%
                        </p>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={5}
                          value={editProgress}
                          onChange={(e) => setEditProgress(parseInt(e.target.value))}
                          className="w-full accent-[#4ECDC4]"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#3E2723] mb-1">阅读笔记</p>
                        <textarea
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value.slice(0, 500))}
                          rows={3}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-[#FAFAFA] text-[#3E2723] resize-none font-mono text-sm"
                          maxLength={500}
                        />
                        <p className="text-xs text-gray-400 text-right mt-0.5">{editNotes.length}/500</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingBookId(null)}
                          className="py-1.5 px-4 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          取消
                        </button>
                        <button
                          onClick={saveEditBook}
                          disabled={saving}
                          className="py-1.5 px-4 rounded-lg bg-[#4ECDC4] text-[#3E2723] text-sm font-medium hover:bg-[#3DB9B0] disabled:opacity-50 transition-colors"
                        >
                          {saving ? '保存中...' : '保存'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="font-bold text-[#3E2723] truncate">{book.title}</h4>
                          <p className="text-sm text-gray-500">{book.author}</p>
                          {book.tags && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {book.tags.split(',').filter(Boolean).map((t, i) => (
                                <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-[#4ECDC4]/20 text-[#3E2723]">
                                  {t.trim()}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        {isOwner && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => startEditBook(book)}
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                              title="编辑进度"
                            >
                              <StickyNote size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteBook(book.id)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-500 transition-colors"
                              title="删除"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>阅读进度</span>
                          <span className="font-medium text-[#3BB78F]">{book.progress}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="progress-bar-fill h-full rounded-full"
                            style={{ width: `${book.progress}%` }}
                          />
                        </div>
                      </div>
                      {book.notes && (
                        <div className="mt-3 p-3 bg-[#F5F0E1] rounded-lg">
                          <p className="text-xs text-gray-500 mb-1 font-medium flex items-center gap-1">
                            <StickyNote size={12} />
                            阅读笔记
                          </p>
                          <p className="text-sm text-[#3E2723] whitespace-pre-wrap">{book.notes}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
