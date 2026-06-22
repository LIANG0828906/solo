import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BookOpen, CalendarCheck, BarChart3, Menu, X, User } from 'lucide-react'
import { useLibraryStore } from '@/data/store'

const navLinks = [
  { to: '/', label: '首页', icon: BookOpen },
  { to: '/reservations', label: '我的预约', icon: CalendarCheck },
  { to: '/statistics', label: '统计', icon: BarChart3 },
]

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  const currentUser = useLibraryStore((s) => s.currentUser)

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-surface-200 shadow-sm">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-primary-500 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="font-serif text-xl font-bold text-surface-800 hidden sm:block">
              社区图书馆
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon
              const active = isActive(link.to)
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`relative flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    active
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-surface-600 hover:text-primary-500 hover:bg-surface-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                  {active && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary-500 rounded-full" />
                  )}
                </Link>
              )
            })}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
                <User className="w-4 h-4 text-primary-600" />
              </div>
              <span className="text-sm font-medium text-surface-700">{currentUser.name}</span>
            </div>
          </div>

          <button
            className="md:hidden p-2 rounded-lg text-surface-600 hover:bg-surface-100 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-surface-200 bg-white animate-fade-in">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon
              const active = isActive(link.to)
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-surface-600 hover:bg-surface-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {link.label}
                </Link>
              )
            })}
            <div className="flex items-center gap-3 px-4 py-3 border-t border-surface-100 mt-2 pt-4">
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                <User className="w-4 h-4 text-primary-600" />
              </div>
              <span className="text-sm font-medium text-surface-700">{currentUser.name}</span>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
