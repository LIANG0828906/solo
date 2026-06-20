import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Swords, LogOut, User } from 'lucide-react'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header 
        className="h-16 px-6 flex items-center justify-between border-b"
        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center gap-3">
          <Swords className="w-8 h-8" style={{ color: 'var(--accent-primary)' }} />
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Code Arena
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {user && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <User className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {user.username}
              </span>
            </div>
          )}
          
          <button 
            onClick={handleLogout}
            className="btn btn-secondary flex items-center gap-2"
            title="退出登录"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">退出</span>
          </button>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
