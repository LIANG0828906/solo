import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { Search, BookOpen } from 'lucide-react'
import { FixedSizeGrid as Grid } from 'react-window'
import { useLibraryStore, CATEGORIES, type Category } from '@/data/store'
import { useDebounce } from '@/hooks/useDebounce'
import BookCard from './BookCard'

export default function BookList() {
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>(undefined)
  const [searchText, setSearchText] = useState('')
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 })

  const debouncedSearch = useDebounce(searchText, 300)
  const getFilteredBooks = useLibraryStore((s) => s.getFilteredBooks)

  const filteredBooks = useMemo(
    () => getFilteredBooks(selectedCategory, debouncedSearch || undefined),
    [getFilteredBooks, selectedCategory, debouncedSearch]
  )

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setDimensions({ width: rect.width, height: window.innerHeight - 220 })
      }
    }
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  const getColumnCount = useCallback((width: number) => {
    if (width >= 1024) return 4
    if (width >= 768) return 3
    if (width >= 480) return 2
    return 1
  }, [])

  const columnCount = getColumnCount(dimensions.width)
  const columnWidth = dimensions.width / columnCount
  const rowHeight = columnCount <= 2 ? 380 : 340
  const rowCount = Math.ceil(filteredBooks.length / columnCount)

  const handleCategoryChange = (category: Category | undefined) => {
    setIsTransitioning(true)
    setTimeout(() => {
      setSelectedCategory(category)
      setIsTransitioning(false)
    }, 150)
  }

  const Cell = useCallback(
    ({ columnIndex, rowIndex, style }: { columnIndex: number; rowIndex: number; style: React.CSSProperties }) => {
      const index = rowIndex * columnCount + columnIndex
      if (index >= filteredBooks.length) return null
      return (
        <div style={style} className="p-2">
          <BookCard key={filteredBooks[index].id} bookId={filteredBooks[index].id} />
        </div>
      )
    },
    [filteredBooks, columnCount]
  )

  if (isLoading) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-4">
        <div className="mb-6">
          <div className="skeleton h-10 w-full max-w-md mb-4" />
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton h-9 w-16" />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="rounded-card overflow-hidden">
              <div className="skeleton aspect-[3/4]" />
              <div className="p-3 space-y-2">
                <div className="skeleton h-4 w-3/4" />
                <div className="skeleton h-3 w-1/2" />
                <div className="skeleton h-3 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-4">
      <div className="mb-6">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="搜索书名或作者..."
            className="w-full max-w-md pl-10 pr-4 py-2.5 bg-white border border-surface-200 rounded-xl text-sm text-surface-800 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleCategoryChange(undefined)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
              !selectedCategory
                ? 'bg-primary-500 text-white shadow-sm'
                : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
            }`}
          >
            全部
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(selectedCategory === cat ? undefined : cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
                selectedCategory === cat
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {filteredBooks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-surface-400">
          <BookOpen className="w-16 h-16 mb-4" />
          <p className="text-lg font-medium">未找到匹配的图书</p>
          <p className="text-sm mt-1">试试调整筛选条件或搜索关键词</p>
        </div>
      ) : (
        <div
          ref={containerRef}
          className={`transition-opacity duration-300 ${
            isTransitioning ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <Grid
            columnCount={columnCount}
            columnWidth={columnWidth}
            height={dimensions.height}
            rowCount={rowCount}
            rowHeight={rowHeight}
            width={dimensions.width}
            overscanRowCount={3}
          >
            {Cell}
          </Grid>
        </div>
      )}

      <div className="text-center py-4 text-xs text-surface-400">
        共 {filteredBooks.length} 本图书
      </div>
    </div>
  )
}
