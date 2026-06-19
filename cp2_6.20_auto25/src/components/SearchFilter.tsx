import { useState, useEffect, useRef } from 'react'
import { Search, X, Calendar } from 'lucide-react'
import type { SearchParams } from '@/types'

interface SearchFilterProps {
  onSearch: (params: SearchParams) => void
}

export default function SearchFilter({ onSearch }: SearchFilterProps) {
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    timerRef.current = setTimeout(() => {
      onSearch({ search: search || undefined, date_from: dateFrom || undefined, date_to: dateTo || undefined })
    }, 300)
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [search, dateFrom, dateTo, onSearch])

  const handleClear = () => {
    setSearch('')
    setDateFrom('')
    setDateTo('')
  }

  const hasFilters = search || dateFrom || dateTo

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-surface-border bg-surface-light p-4">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索作品标题或上传者..."
          className="w-full rounded-lg border border-surface-border bg-surface-light py-2 pl-10 pr-3 text-sm text-white placeholder-gray-400 outline-none focus:border-indigo-500"
        />
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-lg border border-surface-border bg-surface-light py-2 pl-10 pr-3 text-sm text-white outline-none focus:border-indigo-500"
          />
        </div>
        <span className="text-gray-400">~</span>
        <div className="relative">
          <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg border border-surface-border bg-surface-light py-2 pl-10 pr-3 text-sm text-white outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {hasFilters && (
        <button
          onClick={handleClear}
          className="flex items-center gap-1 rounded-lg border border-surface-border bg-surface-light px-3 py-2 text-sm text-gray-300 transition-colors hover:text-white"
        >
          <X className="h-4 w-4" />
          清除筛选
        </button>
      )}
    </div>
  )
}
