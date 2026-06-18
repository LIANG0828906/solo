import { NavLink } from 'react-router-dom'
import { Home, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface HamburgerMenuProps {
  isOpen: boolean
  onClose: () => void
}

const navLinks = [
  { to: '/', label: '首页', icon: Home },
  { to: '/search', label: '搜索', icon: Search },
]

export default function HamburgerMenu({ isOpen, onClose }: HamburgerMenuProps) {
  return (
    <>
      <div
        className={cn(
          'fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      <div
        className={cn(
          'fixed top-0 right-0 h-full w-64 bg-[#0a0e27]/95 backdrop-blur-xl border-l border-white/10 z-50 transition-transform duration-300',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex justify-end p-4">
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        <nav className="flex flex-col gap-2 px-4">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                  isActive
                    ? 'bg-[#00d4ff]/20 text-[#00d4ff]'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                )
              }
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </>
  )
}
