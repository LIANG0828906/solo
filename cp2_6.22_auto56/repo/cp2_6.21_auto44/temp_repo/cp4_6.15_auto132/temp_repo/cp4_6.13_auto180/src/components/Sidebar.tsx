import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Clock, CalendarCheck } from 'lucide-react'

const navItems = [
  { to: '/', label: '仪表盘', icon: LayoutDashboard },
  { to: '/time-record', label: '工时记录', icon: Clock },
  { to: '/leave-request', label: '请假审批', icon: CalendarCheck },
]

export default function Sidebar() {
  return (
    <>
      <header
        className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center px-4"
        style={{ height: 56, backgroundColor: '#1565c0' }}
      >
        <h1 className="text-white text-base font-bold tracking-wide mr-6 flex-shrink-0">
          WorkFlow
        </h1>
        <nav className="flex-1 flex items-center gap-1 overflow-x-auto hide-scrollbar">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `mobile-nav-link flex items-center gap-2 px-3 text-white/90 rounded-lg transition-all duration-200 flex-shrink-0 ${
                  isActive ? 'bg-white/15 font-semibold' : 'hover:bg-white/10'
                }`
              }
              style={{ height: 40 }}
            >
              {({ isActive }) => (
                <>
                  <item.icon size={18} />
                  <span className="text-sm whitespace-nowrap">{item.label}</span>
                  <div
                    className={`h-0.5 bg-white rounded-full transition-all duration-200 ${
                      isActive ? 'w-4' : 'w-0'
                    }`}
                  />
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </header>

      <aside
        className="hidden md:flex fixed top-0 left-0 h-full z-50 flex-col py-6"
        style={{ width: 220, backgroundColor: '#1565c0' }}
      >
        <div className="flex items-center justify-between px-5 mb-8">
          <h1 className="text-white text-lg font-bold tracking-wide">WorkFlow</h1>
        </div>

        <nav className="flex-1 flex flex-col gap-1 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `sidebar-link flex items-center gap-3 px-4 text-white/90 rounded-lg transition-all duration-200 ${
                  isActive ? 'bg-white/15 font-semibold' : 'hover:bg-white/10'
                }`
              }
              style={{ height: 48 }}
            >
              {({ isActive }) => (
                <>
                  <item.icon size={20} />
                  <span>{item.label}</span>
                  <div
                    className={`sidebar-underline ml-auto h-0.5 bg-white rounded-full transition-all duration-200 ${
                      isActive ? 'w-4' : 'w-0'
                    }`}
                  />
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-5 mt-auto">
          <div className="text-white/50 text-xs">v1.0.0</div>
        </div>
      </aside>
    </>
  )
}
