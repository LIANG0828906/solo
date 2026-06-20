import { NavLink } from 'react-router-dom'
import { Briefcase, FileText, Calendar, LayoutDashboard, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/jobs', label: '职位管理', icon: Briefcase },
  { to: '/resumes', label: '简历库', icon: FileText },
  { to: '/interviews', label: '面试安排', icon: Calendar },
  { to: '/kanban', label: '看板', icon: LayoutDashboard },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-full w-[240px] bg-[#f1f5f9] transition-transform duration-300 ease-out md:static md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between px-4 py-4 md:hidden">
          <span className="text-lg font-semibold text-gray-800">菜单</span>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        <nav className="mt-2 flex flex-col gap-1 px-2">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors duration-300 hover:bg-gray-200/60',
                  isActive && 'border-l-[3px] border-blue-500 bg-white text-blue-600'
                )
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}
