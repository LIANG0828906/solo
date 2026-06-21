import { Home, User, BookOpen, Settings, LogOut, Menu, X } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { User as UserType } from '@shared/types'
import { cn } from '@/lib/utils'

interface SidebarProps {
  user: UserType | null
  userId: string
}

const menuItems = [
  { path: '/', icon: Home, label: '书架首页' },
  { path: '/profile/:id', icon: User, label: '个人中心' },
  { path: '/my-books', icon: BookOpen, label: '我的图书' },
  { path: '/settings', icon: Settings, label: '设置' }
]

export default function Sidebar({ user, userId }: SidebarProps) {
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (path: string) => {
    const resolvedPath = path.replace(':id', userId)
    return location.pathname === resolvedPath
  }

  const SidebarContent = () => (
    <div className="sidebar h-full flex flex-col py-6 px-4">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-lg font-semibold text-white">菜单</h2>
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1 rounded-lg hover:bg-slate-700 transition-colors"
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      {user && (
        <div className="mb-8 p-4 bg-slate-800 rounded-xl">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-16 h-16 rounded-full mx-auto mb-3 object-cover border-2 border-violet-500"
            />
          ) : (
            <div className="w-16 h-16 rounded-full mx-auto mb-3 bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
          )}
          <p className="text-center text-white font-medium">{user.name}</p>
          <p className="text-center text-slate-400 text-xs mt-1">
            信誉分: {user.reputation.toFixed(1)}
          </p>
        </div>
      )}

      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => {
          const resolvedPath = item.path.replace(':id', userId)
          const active = isActive(item.path)
          return (
            <Link
              key={item.path}
              to={resolvedPath}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                active
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-slate-700">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
          <LogOut className="w-5 h-5" />
          <span className="font-medium">退出登录</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed bottom-6 left-6 z-40 p-3 bg-violet-600 text-white rounded-full shadow-lg hover:bg-violet-700 transition-colors"
      >
        <Menu className="w-6 h-6" />
      </button>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 h-screen z-50 lg:z-auto transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <SidebarContent />
      </aside>
    </>
  )
}
