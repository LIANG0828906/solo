import { NavLink } from 'react-router-dom'
import { FileText, Calendar, Image } from 'lucide-react'

const navItems = [
  { to: '/', icon: FileText, label: '内容' },
  { to: '/calendar', icon: Calendar, label: '日历' },
  { to: '/materials', icon: Image, label: '素材' },
]

export default function Sidebar() {
  return (
    <>
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-16 flex-col items-center py-4 gap-2 bg-[var(--bg-card)] border-r border-gray-700/50 z-30">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center justify-center w-10 h-10 rounded-lg transition-all ${
                isActive
                  ? 'bg-[var(--accent)] text-white'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-gray-700/50'
              }`
            }
            title={label}
          >
            <Icon size={20} />
          </NavLink>
        ))}
      </aside>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 flex items-center justify-around bg-[var(--bg-card)] border-t border-gray-700/50 z-30">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 text-xs transition-colors ${
                isActive
                  ? 'text-[var(--accent)]'
                  : 'text-[var(--text-secondary)]'
              }`
            }
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  )
}
