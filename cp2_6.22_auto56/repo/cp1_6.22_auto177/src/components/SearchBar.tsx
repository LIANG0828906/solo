import { useEffect, useRef, useCallback } from 'react'
import { Search, X } from 'lucide-react'
import { useStore } from '@/store'

export default function SearchBar() {
  const searchKeyword = useStore((s) => s.searchKeyword)
  const searchNotes = useStore((s) => s.searchNotes)
  const toggleMobileMenu = useStore((s) => s.toggleMobileMenu)
  const mobileMenuOpen = useStore((s) => s.mobileMenuOpen)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        searchNotes(value)
      }, 300)
    },
    [searchNotes]
  )

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <header className="h-14 border-b border-gray-100 bg-white flex items-center px-4 gap-3 shrink-0 z-30">
      <button
        className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors duration-200"
        onClick={toggleMobileMenu}
        aria-label="切换菜单"
      >
        <svg
          className="w-5 h-5 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {mobileMenuOpen ? (
            <X strokeWidth={2} className="w-5 h-5" />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>
      <div className="flex-1 relative max-w-xl">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          size={18}
        />
        <input
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]/30 focus:border-[#6366F1] transition-all duration-200"
          placeholder="搜索笔记标题或内容..."
          defaultValue={searchKeyword}
          onChange={handleChange}
        />
      </div>
      <div className="hidden md:flex items-center gap-2 text-sm text-gray-500">
        <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
        知识库在线
      </div>
    </header>
  )
}
