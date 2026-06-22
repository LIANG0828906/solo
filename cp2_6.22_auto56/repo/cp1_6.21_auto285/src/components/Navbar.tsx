import { BookOpen, Search, User, Menu, X } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'

interface NavbarProps {
  onSearch?: (keyword: string) => void
  currentUserId?: string
}

export default function Navbar({ onSearch, currentUserId = 'user-1' }: NavbarProps) {
  const [searchKeyword, setSearchKeyword] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigate = useNavigate()

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchKeyword(value)
    if (onSearch) {
      onSearch(value)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch(searchKeyword)
    }
  }

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-violet-600" />
            <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              社区漂流书架
            </span>
          </Link>

          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="搜索书名、作者..."
                value={searchKeyword}
                onChange={handleSearch}
                onKeyDown={handleKeyDown}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link
              to={`/profile/${currentUserId}`}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-violet-50 transition-colors"
            >
              <User className="w-5 h-5 text-violet-600" />
              <span className="text-sm font-medium text-slate-700">个人中心</span>
            </Link>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-slate-600" />
            ) : (
              <Menu className="w-6 h-6 text-slate-600" />
            )}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 animate-fade-in">
          <div className="px-4 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="搜索书名、作者..."
                value={searchKeyword}
                onChange={handleSearch}
                onKeyDown={handleKeyDown}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="px-4 pb-3">
            <Link
              to={`/profile/${currentUserId}`}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-3 rounded-lg bg-violet-50 hover:bg-violet-100 transition-colors"
            >
              <User className="w-5 h-5 text-violet-600" />
              <span className="text-sm font-medium text-slate-700">个人中心</span>
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
