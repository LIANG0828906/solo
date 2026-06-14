import { memo, useEffect, useState } from 'react'
import { Recycle, Bell, Heart, Plus, Menu } from 'lucide-react'
import { useStore } from '@/store'
import NotificationBell from './NotificationBell'

interface NavBarProps {
  activeTab: 'materials' | 'projects'
  onTabChange: (tab: 'materials' | 'projects') => void
  onOpenFavorites: () => void
  notificationCount: number
  onOpenPublish: (type: 'material' | 'project') => void
}

const NavBar = memo(function NavBar({
  activeTab,
  onTabChange,
  onOpenFavorites,
  notificationCount,
  onOpenPublish,
}: NavBarProps) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#F5F0E8]/90 shadow-md'
          : 'bg-transparent'
      }`}
      style={scrolled ? { backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' } : undefined}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Recycle className="h-6 w-6 text-[#2C5F3B]" />
          <h1 className="text-xl font-bold text-[#333333]" style={{ fontFamily: "'Playfair Display', 'Noto Sans SC', serif" }}>
            余料交换
          </h1>
        </div>

        <div className="relative hidden md:flex items-center gap-1">
          <button
            className={`relative px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'materials' ? 'text-[#2C5F3B]' : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => onTabChange('materials')}
          >
            余料看板
          </button>
          <button
            className={`relative px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'projects' ? 'text-[#2C5F3B]' : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => onTabChange('projects')}
          >
            项目灵感
          </button>
          <span
            className="absolute bottom-0 h-0.5 rounded-full bg-[#2C5F3B] transition-all duration-300"
            style={{
              width: '40%',
              left: activeTab === 'materials' ? '5%' : '55%',
            }}
          />
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell count={notificationCount} onClick={() => {}} />

          <button
            className="btn-hover rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-red-500"
            onClick={onOpenFavorites}
          >
            <Heart className="h-5 w-5" />
          </button>

          <button
            className="btn-hover hidden md:flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium text-white transition-colors"
            style={{ backgroundColor: '#D4A574' }}
            onClick={() => onOpenPublish('material')}
          >
            <Plus className="h-4 w-4" />
            发布余料
          </button>

          <button
            className="btn-hover hidden md:flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium text-white transition-colors"
            style={{ backgroundColor: '#2C5F3B' }}
            onClick={() => onOpenPublish('project')}
          >
            <Plus className="h-4 w-4" />
            发布项目
          </button>

          <button
            className="btn-hover rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-cream/95 backdrop-blur-sm border-t border-gray-200 px-4 py-3 space-y-2 animate-fade-in">
          <button
            onClick={() => { onOpenPublish('material'); setMobileMenuOpen(false) }}
            className="btn-hover w-full flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: '#D4A574' }}
          >
            <Plus className="h-4 w-4" />
            发布余料
          </button>
          <button
            onClick={() => { onOpenPublish('project'); setMobileMenuOpen(false) }}
            className="btn-hover w-full flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: '#2C5F3B' }}
          >
            <Plus className="h-4 w-4" />
            发布项目
          </button>
        </div>
      )}
    </nav>
  )
})

export default NavBar
