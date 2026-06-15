import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import type { User } from '@/api'

interface NavbarProps {
  user?: User | null
  onLogin?: () => void
  onLogout?: () => void
  onSearch?: (query: string) => void
  searchPlaceholder?: string
  className?: string
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

export default function Navbar({
  user,
  onLogin,
  onLogout,
  onSearch,
  searchPlaceholder = '搜索书籍...',
  className,
}: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const debouncedSearch = useDebounce(searchQuery, 300)

  useEffect(() => {
    if (onSearch) {
      onSearch(debouncedSearch)
    }
  }, [debouncedSearch, onSearch])

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value)
    },
    []
  )

  const handleClearSearch = useCallback(() => {
    setSearchQuery('')
  }, [])

  const handleSearchClick = useCallback(() => {
    const button = document.querySelector('.search-submit-btn') as HTMLElement
    if (button) {
      button.style.transform = 'scale(1.05)'
      setTimeout(() => {
        button.style.transform = 'scale(1)'
      }, 200)
    }
    if (onSearch) {
      onSearch(searchQuery)
    }
  }, [searchQuery, onSearch])

  return (
    <nav
      className={cn(
        'sticky top-0 z-50 bg-card/90 backdrop-blur-md border-b border-border-light',
        className
      )}
    >
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-wood-secondary to-wood-primary flex items-center justify-center">
            <span className="text-wood-cream text-xl font-serif font-bold">书</span>
          </div>
          <h1 className="text-xl font-serif font-bold text-primary hidden sm:block">
            书香共享
          </h1>
        </div>

        <div className="flex-1 max-w-xl">
          <div
            className={cn(
              'search-box flex items-center',
              isSearchFocused && 'ring-2 ring-wood-primary/20 rounded-xl'
            )}
          >
            <span className="search-box-icon">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              placeholder={searchPlaceholder}
              className="flex-1"
            />
            {searchQuery && (
              <button
                type="button"
                className="search-box-clear"
                onClick={handleClearSearch}
                aria-label="清除搜索"
              >
                ×
              </button>
            )}
            <button
              type="button"
              className={cn(
                'search-submit-btn ml-2 btn btn-primary btn-sm',
                'transition-transform duration-200 ease-out'
              )}
              onClick={handleSearchClick}
            >
              搜索
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="hidden sm:flex items-center gap-2 btn btn-ghost btn-sm"
              >
                <span>发布</span>
              </button>
              <div className="flex items-center gap-2">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.nickname}
                    className="w-9 h-9 rounded-full object-cover border-2 border-wood-secondary cursor-pointer hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-wood-secondary flex items-center justify-center text-wood-dark font-medium cursor-pointer hover:scale-105 transition-transform">
                    {user.nickname?.charAt(0) || '用'}
                  </div>
                )}
                <span className="hidden md:inline text-sm text-secondary">
                  {user.nickname}
                </span>
              </div>
              {onLogout && (
                <button
                  type="button"
                  className="btn btn-outline btn-sm hidden sm:flex"
                  onClick={onLogout}
                >
                  退出
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={onLogin}
            >
              登录
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}
