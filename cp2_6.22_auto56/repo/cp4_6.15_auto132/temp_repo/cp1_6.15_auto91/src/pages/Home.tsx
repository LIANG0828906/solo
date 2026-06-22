import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import FilterBar, { type FilterState } from '@/components/FilterBar'
import BookCard, { BookCardSkeleton } from '@/components/BookCard'
import { getBooks, type Book } from '@/api'
import { useAppStore } from '@/store'
import { cn } from '@/lib/utils'

export default function Home() {
  const navigate = useNavigate()
  const { user, logout, addNotification } = useAppStore()

  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [isFadingOut, setIsFadingOut] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [filters, setFilters] = useState<FilterState>({
    yearMin: '',
    yearMax: '',
    priceMin: '',
    priceMax: '',
    category: 'all',
  })

  const fetchBooks = useCallback(async () => {
    setIsFadingOut(true)

    try {
      const params: Record<string, string | number> = {
        status: 'approved',
      }

      if (keyword.trim()) {
        params.keyword = keyword.trim()
      }
      if (filters.yearMin) {
        params.yearMin = filters.yearMin
      }
      if (filters.yearMax) {
        params.yearMax = filters.yearMax
      }
      if (filters.priceMin) {
        params.priceMin = filters.priceMin
      }
      if (filters.priceMax) {
        params.priceMax = filters.priceMax
      }
      if (filters.category && filters.category !== 'all') {
        params.category = filters.category
      }

      const data = await getBooks(params)
      setTimeout(() => {
        setBooks(data)
        setIsFadingOut(false)
        setLoading(false)
      }, 300)
    } catch (error) {
      const message = error instanceof Error ? error.message : '加载书籍列表失败'
      addNotification('error', message)
      setLoading(false)
      setIsFadingOut(false)
    }
  }, [keyword, filters, addNotification])

  useEffect(() => {
    setLoading(true)
    fetchBooks()
  }, [fetchBooks])

  const handleSearch = useCallback((query: string) => {
    setKeyword(query)
  }, [])

  const handleFilterChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters)
  }, [])

  const handleCardClick = useCallback((book: Book) => {
    navigate(`/books/${book.id}`)
  }, [navigate])

  const handleLogin = useCallback(() => {
    navigate('/login')
  }, [navigate])

  const handleLogout = useCallback(() => {
    logout()
    addNotification('success', '已退出登录')
  }, [logout, addNotification])

  const sortedBooks = useMemo(() => {
    return [...books].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }, [books])

  const gridBooksStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '1.25rem',
  }

  return (
    <div className="min-h-screen">
      <Navbar
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onSearch={handleSearch}
        searchPlaceholder="搜索书名、作者..."
      />

      <main className="container mx-auto px-4 py-6">
        <FilterBar
          onFilterChange={handleFilterChange}
          className="mb-6"
        />

        <div
          className={cn(
            isFadingOut ? 'animate-list-fade-out' : 'animate-list-fade'
          )}
          style={gridBooksStyle}
        >
          {loading ? (
            Array.from({ length: 8 }).map((_, index) => (
              <BookCardSkeleton key={`skeleton-${index}`} />
            ))
          ) : sortedBooks.length > 0 ? (
            sortedBooks.map((book, index) => (
              <BookCard
                key={book.id}
                book={book}
                index={index}
                onClick={handleCardClick}
              />
            ))
          ) : (
            <div
              className="col-span-full flex flex-col items-center justify-center py-16 text-center"
              style={{ gridColumn: '1 / -1' }}
            >
              <div className="text-6xl mb-4 opacity-50">📚</div>
              <h3 className="text-xl font-semibold text-primary mb-2">暂无书籍</h3>
              <p className="text-muted">
                {keyword || filters.category !== 'all' || filters.yearMin || filters.yearMax || filters.priceMin || filters.priceMax
                  ? '没有找到符合条件的书籍，试试调整筛选条件吧'
                  : '还没有任何书籍，快来发布第一本吧'}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
