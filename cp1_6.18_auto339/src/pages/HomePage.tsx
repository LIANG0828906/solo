import { useEffect, useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, User, BookOpen, Sparkles, Flame, Eye, Copy, Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useBookStore } from '../stores/bookStore'
import { BookList } from '../api'

const COVER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD',
  '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9', '#F1948A', '#82E0AA',
]

function BookListCard({ bl, onClone }: { bl: BookList; onClone?: (id: number) => void }) {
  const [copied, setCopied] = useState(false)
  const navigate = useNavigate()

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/booklist/${bl.id}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className="booklist-card bg-white overflow-hidden cursor-pointer flex-shrink-0"
      style={{ width: 250, height: 350 }}
      onClick={() => navigate(`/booklist/${bl.id}`)}
    >
      <div
        className="h-32 flex items-center justify-center text-white font-bold text-xl px-4 text-center"
        style={{ backgroundColor: bl.cover_color }}
      >
        {bl.name}
      </div>
      <div className="p-4 h-[calc(350px-8rem)] flex flex-col">
        <p className="text-sm text-gray-500 line-clamp-2 mb-2 flex-1">{bl.description || '暂无简介'}</p>
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
          <BookOpen size={14} />
          <span>{bl.books.length} 本书</span>
          {bl.user && (
            <>
              <span>·</span>
              <div className="flex items-center gap-1">
                <User size={12} />
                <span>{bl.user.username}</span>
              </div>
            </>
          )}
        </div>
        {bl.books.length > 0 && (
          <div className="mb-3">
            <div className="flex -space-x-2">
              {bl.books.slice(0, 4).map((b) => (
                <div
                  key={b.id}
                  className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: bl.cover_color }}
                  title={b.title}
                >
                  {b.title.charAt(0)}
                </div>
              ))}
              {bl.books.length > 4 && (
                <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs text-gray-600">
                  +{bl.books.length - 4}
                </div>
              )}
            </div>
          </div>
        )}
        <div className="flex gap-2 mt-auto" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={handleCopyLink}
            className="flex-1 py-1.5 px-2 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-1 transition-colors"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? '已复制' : '分享'}
          </button>
          {onClone && (
            <button
              onClick={() => onClone(bl.id)}
              className="flex-1 py-1.5 px-2 rounded-lg bg-[#4ECDC4] text-[#3E2723] text-xs font-medium hover:bg-[#3DB9B0] flex items-center justify-center gap-1 transition-colors"
            >
              <Plus size={12} />
              克隆
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function CreateBookListModal({ onClose, onCreate }: { onClose: () => void; onCreate: any }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [coverColor, setCoverColor] = useState(COVER_COLORS[0])
  const [isPublic, setIsPublic] = useState(false)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onCreate({ name, description, cover_color: coverColor, is_public: isPublic })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-[#3E2723] mb-5">创建新书单</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#3E2723] mb-1.5">书单名称 <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 30))}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-[#FAFAFA] text-[#3E2723]"
              placeholder="例如：治愈系小说"
              required
              maxLength={30}
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{name.length}/30</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#3E2723] mb-1.5">书单简介</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 200))}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-[#FAFAFA] text-[#3E2723] resize-none"
              rows={3}
              placeholder="简单描述这个书单的主题..."
              maxLength={200}
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{description.length}/200</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#3E2723] mb-2">封面颜色</label>
            <div className="grid grid-cols-6 gap-2">
              {COVER_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCoverColor(c)}
                  className={`w-full aspect-square rounded-lg transition-transform ${
                    coverColor === c ? 'ring-2 ring-offset-2 ring-[#3E2723] scale-110' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-[#3E2723]">公开书单</p>
              <p className="text-xs text-gray-500">其他用户可以看到并克隆</p>
            </div>
            <button
              type="button"
              onClick={() => setIsPublic(!isPublic)}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                isPublic ? 'bg-[#4ECDC4]' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  isPublic ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 py-2.5 rounded-lg bg-[#4ECDC4] text-[#3E2723] font-semibold hover:bg-[#3DB9B0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              创建
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function HomePage() {
  const user = useAuthStore((s) => s.user)
  const { myBooklists, publicBooklists, recommendations, fetchMyBooklists, fetchPublicBooklists, fetchRecommendations, createBooklist, cloneBooklist } = useBookStore()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchMyBooklists()
    fetchPublicBooklists()
    fetchRecommendations()
  }, [fetchMyBooklists, fetchPublicBooklists, fetchRecommendations])

  const handleClone = async (id: number) => {
    try {
      const bl = await cloneBooklist(id)
      navigate(`/booklist/${bl.id}`)
    } catch {
      alert('克隆失败，请先登录')
    }
  }

  const totalBooks = myBooklists.reduce((sum, bl) => sum + bl.books.length, 0)
  const avgProgress = myBooklists.length > 0
    ? Math.round(
        myBooklists.reduce((sum, bl) => {
          const booksProgress = bl.books.length > 0
            ? bl.books.reduce((s, b) => s + b.progress, 0) / bl.books.length
            : 0
          return sum + booksProgress
        }, 0) / myBooklists.length
      )
    : 0

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex lg:gap-6">
        <aside className="hidden lg:block w-[280px] flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-6 sticky top-24">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-full bg-[#4ECDC4]/20 flex items-center justify-center text-[#4ECDC4]">
                <User size={28} />
              </div>
              <div>
                <p className="font-bold text-[#3E2723]">{user?.username}</p>
                <p className="text-xs text-gray-400">{user?.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="text-center p-2 bg-[#F5F0E1] rounded-lg">
                <p className="text-xl font-bold text-[#3E2723]">{myBooklists.length}</p>
                <p className="text-xs text-gray-500">书单</p>
              </div>
              <div className="text-center p-2 bg-[#F5F0E1] rounded-lg">
                <p className="text-xl font-bold text-[#3E2723]">{totalBooks}</p>
                <p className="text-xs text-gray-500">书籍</p>
              </div>
              <div className="text-center p-2 bg-[#F5F0E1] rounded-lg">
                <p className="text-xl font-bold text-[#3BB78F]">{avgProgress}%</p>
                <p className="text-xs text-gray-500">平均进度</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full py-2.5 rounded-lg bg-[#3E2723] text-[#F5F0E1] font-medium hover:bg-[#5D4037] flex items-center justify-center gap-2 transition-colors"
            >
              <Plus size={18} />
              创建书单
            </button>
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-6 mb-6">
            <h1 className="text-2xl font-bold text-[#3E2723] mb-1">
              你好，{user?.username} 👋
            </h1>
            <p className="text-gray-500">今天也是阅读的好日子，继续你的书旅吧！</p>
            <div className="lg:hidden mt-4">
              <button
                onClick={() => setShowCreateModal(true)}
                className="w-full py-2.5 rounded-lg bg-[#4ECDC4] text-[#3E2723] font-medium hover:bg-[#3DB9B0] flex items-center justify-center gap-2 transition-colors"
              >
                <Plus size={18} />
                创建书单
              </button>
            </div>
          </div>

          {recommendations.length > 0 && (
            <section className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="text-[#4ECDC4]" size={20} />
                <h2 className="text-lg font-bold text-[#3E2723]">为你推荐</h2>
              </div>
              <div className="relative">
                <div
                  id="rec-scroll"
                  className="flex gap-5 overflow-x-auto scrollbar-thin pb-4 px-5"
                  style={{ scrollPaddingLeft: 20, scrollPaddingRight: 20 }}
                >
                  {recommendations.map((bl) => (
                    <BookListCard key={bl.id} bl={bl} onClone={handleClone} />
                  ))}
                </div>
                <button
                  onClick={() => {
                    const el = document.getElementById('rec-scroll')
                    el?.scrollBy({ left: -320, behavior: 'smooth' })
                  }}
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center text-[#3E2723] hover:bg-gray-50 z-10"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => {
                    const el = document.getElementById('rec-scroll')
                    el?.scrollBy({ left: 320, behavior: 'smooth' })
                  }}
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center text-[#3E2723] hover:bg-gray-50 z-10"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </section>
          )}

          <section className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="text-[#45B7D1]" size={20} />
                <h2 className="text-lg font-bold text-[#3E2723]">我的书单</h2>
              </div>
              <Link to="/search" className="text-sm text-[#4ECDC4] hover:underline flex items-center gap-1">
                <Eye size={14} />
                浏览更多
              </Link>
            </div>
            {myBooklists.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-10 text-center">
                <BookOpen size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 mb-4">还没有书单，创建第一个开始吧！</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="py-2 px-5 rounded-lg bg-[#4ECDC4] text-[#3E2723] font-medium hover:bg-[#3DB9B0] transition-colors"
                >
                  创建书单
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {myBooklists.map((bl) => (
                  <BookListCard key={bl.id} bl={bl} />
                ))}
              </div>
            )}
          </section>
        </main>

        <aside className="hidden md:block w-[300px] flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-5 sticky top-24">
            <div className="flex items-center gap-2 mb-4">
              <Flame className="text-[#FF6B6B]" size={18} />
              <h3 className="font-bold text-[#3E2723]">热门公开书单</h3>
            </div>
            <div className="space-y-3 max-h-[500px] overflow-y-auto scrollbar-thin pr-1">
              {publicBooklists.slice(0, 8).map((bl, idx) => (
                <Link
                  key={bl.id}
                  to={`/booklist/${bl.id}`}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-[#F5F0E1] transition-colors group"
                >
                  <span
                    className="flex-shrink-0 w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center"
                    style={{ backgroundColor: bl.cover_color }}
                  >
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#3E2723] truncate group-hover:text-[#4ECDC4] transition-colors">
                      {bl.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {bl.user?.username} · {bl.books.length}本
                    </p>
                  </div>
                </Link>
              ))}
              {publicBooklists.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">暂无公开书单</p>
              )}
            </div>
          </div>
        </aside>
      </div>

      {showCreateModal && (
        <CreateBookListModal
          onClose={() => setShowCreateModal(false)}
          onCreate={createBooklist}
        />
      )}
    </div>
  )
}
