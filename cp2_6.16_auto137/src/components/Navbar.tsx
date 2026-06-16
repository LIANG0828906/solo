import { Music, Menu, User } from 'lucide-react'
import { useStore } from '@/store/useStore'

export const Navbar = () => {
  const setSidebarOpen = useStore(state => state.setSidebarOpen)
  const sidebarOpen = useStore(state => state.sidebarOpen)

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 z-50 flex items-center justify-between px-4 md:px-6"
      style={{
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderBottom: '2px solid var(--card-border)',
      }}>
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 hover:scale-105"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <Music className="text-white" size={22} />
          </div>
          <span className="text-xl font-bold hidden sm:block" style={{ fontFamily: 'Playfair Display, serif' }}>
            音乐教学管理
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
          <User className="text-white" size={20} />
        </div>
        <span className="hidden md:block text-sm font-medium">李老师</span>
      </div>
    </nav>
  )
}
