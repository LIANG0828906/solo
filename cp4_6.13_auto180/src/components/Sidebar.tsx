import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Clock, CalendarCheck, X, Menu } from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { to: '/', label: '仪表盘', icon: LayoutDashboard },
  { to: '/time-record', label: '工时记录', icon: Clock },
  { to: '/leave-request', label: '请假审批', icon: CalendarCheck },
]

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <button
        className="mobile-menu-btn fixed top-3 left-3 z-50 p-2 rounded-lg text-white md:hidden"
        style={{ backgroundColor: '#1565c0' }}
        onClick={() => setMobileOpen(true)}
      >
        <Menu size={22} />
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`sidebar fixed top-0 left-0 h-full z-50 flex flex-col py-6 transition-transform duration-300 md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: 220, backgroundColor: '#1565c0' }}
      >
        <div className="flex items-center justify-between px-5 mb-8">
          <h1 className="text-white text-lg font-bold tracking-wide">WorkFlow</h1>
          <button
            className="text-white/70 hover:text-white md:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 flex flex-col gap-1 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setMobileOpen(false)}
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
