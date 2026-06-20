import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutGrid, Route, ChevronLeft, ChevronRight } from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutGrid, label: '看板' },
  { to: '/roadmap', icon: Route, label: '路线图' },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className="hidden md:flex flex-col h-screen transition-all duration-300"
      style={{
        width: collapsed ? '72px' : '240px',
        backdropFilter: 'blur(12px)',
        background: 'rgba(45,45,68,0.8)',
      }}
    >
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h1
          className="text-xl font-bold transition-opacity duration-300"
          style={{
            opacity: collapsed ? 0 : 1,
            textShadow: '0 0 20px rgba(155,89,182,0.5)',
            color: '#E0E0E0',
            whiteSpace: 'nowrap',
          }}
        >
          IdeaFlow
        </h1>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className="flex-1 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white'
              }`
            }
            style={({ isActive }) => ({
              backgroundColor: isActive
                ? 'rgba(155,89,182,0.3)'
                : 'transparent',
            })}
          >
            {({ isActive }) => (
              <>
                <item.icon
                  size={22}
                  style={{
                    filter: isActive
                      ? 'drop-shadow(0 0 8px rgba(155,89,182,0.6))'
                      : 'none',
                  }}
                />
                <span
                  className="transition-opacity duration-300 whitespace-nowrap"
                  style={{ opacity: collapsed ? 0 : 1 }}
                >
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div
        className="p-4 text-xs text-gray-500 transition-opacity duration-300"
        style={{ opacity: collapsed ? 0 : 1 }}
      >
        v1.0.0
      </div>
    </aside>
  )
}
