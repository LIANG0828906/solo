import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Search, BookOpen, Filter, User, Flame, Clock } from 'lucide-react'
import { useBookStore } from '../stores/bookStore'
import { BookList } from '../api'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'public' | 'my'>('all')
  const { myBooklists, publicBooklists, fetchMyBooklists, fetchPublicBooklists } = useBookStore()

  useEffect(() => {
    fetchMyBooklists()
    fetchPublicBooklists()
  }, [fetchMyBooklists, fetchPublicBooklists])

  const allBooklists = useMemo(() => {
    const map = new Map<number, BookList>()
    publicBooklists.forEach((b) => map.set(b.id, b))
    myBooklists.forEach((b) => map.set(b.id, b))
    return Array.from(map.values())
  }, [myBooklists, publicBooklists])

  const filtered = useMemo(() => {
    let list: BookList[]
    if (activeFilter === 'my') list = myBooklists
    else if (activeFilter === 'public') list = publicBooklists
    else list = allBooklists

    if (!query.trim()) return list

    const q = query.toLowerCase().trim()
    return list.filter((bl) => {
      if (bl.name.toLowerCase().includes(q)) return true
      if (bl.description?.toLowerCase().includes(q)) return true
      if (bl.user?.username.toLowerCase().includes(q)) return true
      return bl.books.some(
        (b) => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || b.tags.toLowerCase().includes(q)
      )
    })
  }, [query, activeFilter, allBooklists, myBooklists, publicBooklists])

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-[#3E2723] mb-5 flex items-center gap-2">
        <Search size={24} />
        探索书单
      </h1>

      <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-5 mb-6">
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索书单名称、简介、作者、书名、标签..."
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-[#FAFAFA] text-[#3E2723] placeholder-gray-400 text-base"
            autoFocus
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={16} className="text-gray-400" />
          {(['all', 'public', 'my'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`py-1.5 px-4 rounded-full text-sm transition-colors ${
                activeFilter === f
                  ? 'bg-[#4ECDC4] text-[#3E2723] font-medium'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f === 'all' && '全部书单'}
              {f === 'public' && '仅公开'}
              {f === 'my' && '仅我的'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          找到 <span className="font-bold text-[#3E2723]">{filtered.length}</span> 个书单
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-12 text-center">
          <BookOpen size={56} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">
            {query ? `没有找到和 "${query}" 相关的书单` : '还没有书单，去首页创建吧'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((bl) => (
            <Link
              key={bl.id}
              to={`/booklist/${bl.id}`}
              className="booklist-card bg-white overflow-hidden block"
            >
              <div
                className="h-28 flex items-center justify-center text-white font-bold text-lg px-4 text-center"
                style={{ backgroundColor: bl.cover_color }}
              >
                {bl.name}
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-500 line-clamp-2 mb-3 h-10">
                  {bl.description || '暂无简介'}
                </p>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <BookOpen size={12} />
                    <span>{bl.books.length} 本</span>
                  </div>
                  {bl.books.length > 0 && (
                    <div className="flex items-center gap-1 text-xs">
                      <Flame size={12} className="text-[#FF6B6B]" />
                      <span className="text-[#3BB78F] font-medium">
                        {Math.round(bl.books.reduce((s, b) => s + b.progress, 0) / bl.books.length)}%
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-1">
                    <User size={12} />
                    <span>{bl.user?.username || '未知'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={12} />
                    <span>{new Date(bl.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
                {!bl.is_public && (
                  <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-500">
                    仅自己可见
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
