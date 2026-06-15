import { Menu, Bell, User } from 'lucide-react'
import { useAppStore } from '@/store'

export default function Navbar() {
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen)

  return (
    <header className="flex h-14 items-center justify-between bg-white px-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
      <div className="flex items-center gap-3">
        <button
          className="text-gray-600 hover:text-gray-800 md:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu size={22} />
        </button>
        <h1 className="text-lg font-semibold text-gray-800">招聘管理平台</h1>
      </div>
      <div className="flex items-center gap-4">
        <button className="relative text-gray-500 hover:text-gray-700">
          <Bell size={20} />
        </button>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
          <User size={16} className="text-gray-500" />
        </div>
      </div>
    </header>
  )
}
