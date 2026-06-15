import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'

export type BookCategory = 'all' | 'novel' | 'documentary' | 'technology' | 'art' | 'life'

interface FilterBarProps {
  onFilterChange?: (filters: FilterState) => void
  className?: string
}

export interface FilterState {
  yearMin: string
  yearMax: string
  priceMin: string
  priceMax: string
  category: BookCategory
}

const categoryOptions: { value: BookCategory; label: string }[] = [
  { value: 'all', label: '全部类别' },
  { value: 'novel', label: '小说' },
  { value: 'documentary', label: '纪实' },
  { value: 'technology', label: '科技' },
  { value: 'art', label: '艺术' },
  { value: 'life', label: '生活' },
]

export default function FilterBar({
  onFilterChange,
  className,
}: FilterBarProps) {
  const [filters, setFilters] = useState<FilterState>({
    yearMin: '',
    yearMax: '',
    priceMin: '',
    priceMax: '',
    category: 'all',
  })

  const handleChange = useCallback(
    (key: keyof FilterState, value: string) => {
      setFilters((prev) => {
        const newFilters = { ...prev, [key]: value }
        onFilterChange?.(newFilters)
        return newFilters
      })
    },
    [onFilterChange]
  )

  const handleReset = useCallback(() => {
    const resetFilters: FilterState = {
      yearMin: '',
      yearMax: '',
      priceMin: '',
      priceMax: '',
      category: 'all',
    }
    setFilters(resetFilters)
    onFilterChange?.(resetFilters)
  }, [onFilterChange])

  const hasActiveFilters =
    filters.yearMin ||
    filters.yearMax ||
    filters.priceMin ||
    filters.priceMax ||
    filters.category !== 'all'

  return (
    <div
      className={cn(
        'bg-card rounded-2xl p-4 shadow-sm border border-border-light',
        className
      )}
    >
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-secondary mb-2">
            出版年份
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1900"
              max={new Date().getFullYear()}
              value={filters.yearMin}
              onChange={(e) => handleChange('yearMin', e.target.value)}
              placeholder="开始年份"
              className="flex-1 glass-input"
            />
            <span className="text-muted px-1">—</span>
            <input
              type="number"
              min="1900"
              max={new Date().getFullYear()}
              value={filters.yearMax}
              onChange={(e) => handleChange('yearMax', e.target.value)}
              placeholder="结束年份"
              className="flex-1 glass-input"
            />
          </div>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium text-secondary mb-2">
            价格区间 (¥)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              step="0.01"
              value={filters.priceMin}
              onChange={(e) => handleChange('priceMin', e.target.value)}
              placeholder="最低价"
              className="flex-1 glass-input"
            />
            <span className="text-muted px-1">—</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={filters.priceMax}
              onChange={(e) => handleChange('priceMax', e.target.value)}
              placeholder="最高价"
              className="flex-1 glass-input"
            />
          </div>
        </div>

        <div className="w-full lg:w-48">
          <label className="block text-sm font-medium text-secondary mb-2">
            书籍类别
          </label>
          <select
            value={filters.category}
            onChange={(e) => handleChange('category', e.target.value as BookCategory)}
            className="w-full glass-input cursor-pointer appearance-none bg-no-repeat bg-right pr-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%238B7355'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundSize: '1.25rem',
              backgroundPosition: 'right 0.75rem center',
            }}
          >
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            type="button"
            className="btn btn-ghost w-full lg:w-auto"
            onClick={handleReset}
            disabled={!hasActiveFilters}
          >
            重置筛选
          </button>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-border-light">
          <div className="flex flex-wrap gap-2">
            {filters.category !== 'all' && (
              <span className="tag">
                类别: {categoryOptions.find((c) => c.value === filters.category)?.label}
              </span>
            )}
            {(filters.yearMin || filters.yearMax) && (
              <span className="tag">
                年份: {filters.yearMin || '不限'} — {filters.yearMax || '不限'}
              </span>
            )}
            {(filters.priceMin || filters.priceMax) && (
              <span className="tag">
                价格: ¥{filters.priceMin || '0'} — ¥{filters.priceMax || '不限'}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
