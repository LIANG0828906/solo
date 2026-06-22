import { useState, useEffect, useRef } from 'react'
import { Search, X, Filter, BookOpen, User, Tag } from 'lucide-react'
import { SearchFilter as SearchFilterType, Book } from '@shared/types'
import { cn } from '@/lib/utils'

interface SearchFilterProps {
  value: SearchFilterType
  onChange: (filter: SearchFilterType) => void
  suggestions?: Book[]
}

const searchByOptions = [
  { value: 'all', label: '全部', icon: Tag },
  { value: 'title', label: '书名', icon: BookOpen },
  { value: 'author', label: '作者', icon: User },
]

const statusOptions = [
  { value: 'all', label: '全部状态' },
  { value: 'available', label: '可借阅' },
  { value: 'borrowed', label: '已借出' },
  { value: 'pending', label: '待审核' },
]

export default function SearchFilter({ value, onChange, suggestions = [] }: SearchFilterProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [localKeyword, setLocalKeyword] = useState(value.keyword)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => {
      onChange({ ...value, keyword: localKeyword })
    }, 300)
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [localKeyword, onChange, value])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const highlightText = (text: string, keyword: string) => {
    if (!keyword.trim()) return text
    const regex = new RegExp(`(${keyword})`, 'gi')
    const parts = text.split(regex)
    return parts.map((part, index) =>
      regex.test(part) ? (
        <span key={index} className="highlight font-medium">
          {part}
        </span>
      ) : (
        part
      )
    )
  }

  const filteredSuggestions = suggestions.filter((book) => {
    if (!value.keyword.trim()) return false
    const keyword = value.keyword.toLowerCase()
    if (value.searchBy === 'title') return book.title.toLowerCase().includes(keyword)
    if (value.searchBy === 'author') return book.author.toLowerCase().includes(keyword)
    return (
      book.title.toLowerCase().includes(keyword) ||
      book.author.toLowerCase().includes(keyword)
    )
  })

  return (
    <div ref={containerRef} className="w-full">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={localKeyword}
            onChange={(e) => {
              setLocalKeyword(e.target.value)
              setShowSuggestions(true)
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="搜索书名或作者..."
            className="w-full pl-12 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
          />
          {localKeyword && (
            <button
              onClick={() => {
                setLocalKeyword('')
                setShowSuggestions(false)
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          )}

          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50">
              <div className="p-2">
                {filteredSuggestions.slice(0, 5).map((book, index) => (
                  <button
                    key={book.id}
                    onClick={() => {
                      setLocalKeyword(book.title)
                      setShowSuggestions(false)
                    }}
                    className={cn(
                      'search-suggestion w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 text-left'
                    )}
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <img
                      src={book.coverImage}
                      alt={book.title}
                      className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {highlightText(book.title, value.keyword)}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {highlightText(book.author, value.keyword)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all',
            showFilters
              ? 'bg-violet-50 border-violet-500 text-violet-600'
              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
          )}
        >
          <Filter className="w-5 h-5" />
          <span className="text-sm font-medium">筛选</span>
        </button>
      </div>

      {showFilters && (
        <div className="mt-4 p-4 bg-white rounded-xl border border-slate-200 animate-fade-in-up">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                搜索范围
              </label>
              <div className="flex gap-2">
                {searchByOptions.map((option) => {
                  const Icon = option.icon
                  return (
                    <button
                      key={option.value}
                      onClick={() =>
                        onChange({ ...value, searchBy: option.value as SearchFilterType['searchBy'] })
                      }
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                        value.searchBy === option.value
                          ? 'bg-violet-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {option.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                图书状态
              </label>
              <select
                value={value.status}
                onChange={(e) =>
                  onChange({ ...value, status: e.target.value as SearchFilterType['status'] })
                }
                className="w-full px-3 py-2 bg-slate-100 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
