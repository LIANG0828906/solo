import { NavLink } from 'react-router-dom'
import { LayoutDashboard, BarChart3, Target } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', label: '仪表盘', icon: LayoutDashboard },
  { to: '/stats', label: '统计', icon: BarChart3 },
  { to: '/savings', label: '储蓄目标', icon: Target },
]

export default function Sidebar() {
  return (
    <>
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 flex-col bg-navy-500 border-r border-navy-600 z-50">
        <div className="p-6 border-b border-navy-600">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-mint-500 flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </span>
            财务管理
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                  isActive
                    ? 'bg-mint-500 text-white shadow-lg shadow-mint-500/30'
                    : 'text-gray-300 hover:bg-navy-600 hover:text-white'
                )
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-navy-500 border-t border-navy-600 z-50 safe-area-pb">
        <div className="flex justify-around items-center py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all duration-200',
                  isActive
                    ? 'text-mint-400'
                    : 'text-gray-400'
                )
              }
            >
              <item.icon className="w-6 h-6" />
              <span className="text-xs font-medium">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  )
}
