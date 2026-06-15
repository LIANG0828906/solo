import { NavLink } from 'react-router-dom'
import { LayoutDashboard, BarChart3, Settings } from 'lucide-react'

export default function Navigation() {
  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 rounded-btn px-3 py-2 text-sm transition-all ${
      isActive
        ? 'bg-sea-blue text-white shadow-card'
        : 'text-sea-blue-700 hover:bg-sea-blue-50'
    }`
  return (
    <header className="sticky top-0 z-30 border-b border-sea-blue-100 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-btn bg-gradient-to-br from-sea-blue to-warm-sand text-white shadow-card">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-base font-semibold text-sea-blue-800">
              时光看板
            </span>
            <span className="text-xs text-sea-blue-500">
              Focus · Habit · Growth
            </span>
          </div>
        </div>
        <nav className="flex items-center gap-1">
          <NavLink to="/" end className={linkCls}>
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">工作台</span>
          </NavLink>
          <NavLink to="/weekly" className={linkCls}>
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">周报</span>
          </NavLink>
          <NavLink to="/settings" className={linkCls}>
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">设置</span>
          </NavLink>
        </nav>
      </div>
    </header>
  )
}
