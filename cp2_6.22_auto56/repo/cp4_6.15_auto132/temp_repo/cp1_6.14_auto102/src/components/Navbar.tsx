import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Music, Search, Upload, Menu, X, User } from 'lucide-react'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/marketplace?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-lg gradient-bg flex items-center justify-center group-hover:shadow-lg group-hover:shadow-brand-indigo/30 transition-shadow duration-300">
              <Music className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl gradient-text">SoundForge</span>
          </Link>

          <form onSubmit={handleSearch} className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索音乐、音乐人..."
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm text-white placeholder-gray-400 focus:outline-none focus:border-brand-violet/50 focus:bg-white/10 transition-all duration-300"
              />
            </div>
          </form>

          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/upload"
              className="flex items-center gap-2 px-4 py-2 rounded-full gradient-bg text-white text-sm font-medium btn-press hover:shadow-lg hover:shadow-brand-indigo/30 transition-shadow duration-300"
            >
              <Upload className="w-4 h-4" />
              上传作品
            </Link>
            <Link
              to="/marketplace"
              className="px-4 py-2 rounded-full text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-300"
            >
              市集
            </Link>
            <button className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors duration-300">
              <User className="w-4 h-4 text-gray-300" />
            </button>
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden glass-card border-t border-white/5 animate-slide-up">
          <div className="px-4 py-3 space-y-2">
            <form onSubmit={handleSearch} className="flex items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索..."
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm text-white placeholder-gray-400 focus:outline-none focus:border-brand-violet/50"
                />
              </div>
            </form>
            <Link to="/marketplace" onClick={() => setMenuOpen(false)} className="block px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition-all">市集</Link>
            <Link to="/upload" onClick={() => setMenuOpen(false)} className="block px-4 py-2 rounded-lg gradient-bg text-white text-center btn-press">上传作品</Link>
          </div>
        </div>
      )}
    </nav>
  )
}
