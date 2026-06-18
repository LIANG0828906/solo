import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Home, Search, Menu, Music } from 'lucide-react'
import { cn } from '@/lib/utils'
import HamburgerMenu from './HamburgerMenu'

const navLinks = [
  { to: '/', label: '首页', icon: Home },
  { to: '/search', label: '搜索', icon: Search },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-30 backdrop-blur-xl bg-[#0a0e27]/80 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-2 group">
            <Music size={28} className="text-[#00d4ff] group-hover:drop-shadow-[0_0_8px_rgba(0,212,255,0.5)] transition-all" />
            <span className="text-xl font-bold text-[#00d4ff]">SoundWave</span>
          </NavLink>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium',
                    isActive
                      ? 'bg-[#00d4ff]/20 text-[#00d4ff]'
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                  )
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </div>

          <button
            className="md:hidden text-white/70 hover:text-white transition-colors"
            onClick={() => setMenuOpen(true)}
          >
            <Menu size={24} />
          </button>
        </div>
      </nav>
      <HamburgerMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  )
}
