import { NavLink } from 'react-router-dom'
import { LayoutDashboard, BarChart3, Inbox } from 'lucide-react'

const tabs = [
  { to: '/', label: '看板', icon: LayoutDashboard },
  { to: '/stats', label: '统计', icon: BarChart3 },
]

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center shadow-md shadow-blue-500/20">
            <Inbox className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">
            收件箱减压器
          </span>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          {tabs.map(tab => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `relative flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {isActive && (
                    <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-[3px] w-6 rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 animate-indicator" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}
