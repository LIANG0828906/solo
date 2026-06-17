import { useState, useEffect } from 'react'
import { Home, Plus, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStore } from '@/store'
import { useMediaQuery } from '@/hooks/useMediaQuery'

interface SidebarProps {
  activeTab: 'hot' | 'create'
  onTabChange: (tab: 'hot' | 'create') => void
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { currentUser } = useStore()
  const isMobile = useMediaQuery('(max-width: 767px)')

  useEffect(() => {
    if (!isMobile) {
      setMobileMenuOpen(false)
    }
  }, [isMobile])

  const menuItems = [
    { id: 'hot' as const, label: '热度排行', icon: Home },
    { id: 'create' as const, label: '创建书单', icon: Plus },
  ]

  const handleTabClick = (tab: 'hot' | 'create') => {
    onTabChange(tab)
    setMobileMenuOpen(false)
  }

  const sidebarContent = (
    <>
      <div className="p-6 border-b border-gray-700">
        <h1 className="font-display text-2xl font-bold text-white tracking-wide">
          LitBoard
        </h1>
      </div>

      <div className="flex-1 p-4">
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                  activeTab === item.id
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center gap-3 px-2">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-10 h-10 rounded-full bg-gray-600"
          />
          <div>
            <p className="text-white font-medium text-sm">{currentUser.name}</p>
            <p className="text-gray-400 text-xs">欢迎回来</p>
          </div>
        </div>
      </div>
    </>
  )

  return (
    <>
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 text-white rounded-lg shadow-lg"
      >
        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-[240px] bg-sidebar text-white flex flex-col',
          'md:translate-x-0 transition-transform duration-300',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </aside>

      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  )
}
