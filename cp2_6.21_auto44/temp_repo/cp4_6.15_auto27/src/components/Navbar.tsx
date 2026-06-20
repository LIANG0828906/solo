import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Leaf, BookOpen, Folder, Menu, X } from 'lucide-react';

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const links = [
    { to: '/teas', label: '茶叶档案', icon: Leaf },
    { to: '/collections', label: '收藏集', icon: Folder },
    { to: '/brews', label: '冲泡记录', icon: BookOpen },
  ];

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm"
      style={{
        borderBottom: '1px solid var(--color-border)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <NavLink to="/teas" className="flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'var(--color-tea)' }}
          >
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <span
            className="text-xl font-semibold"
            style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-wood-dark)' }}
          >
            茶鉴
          </span>
        </NavLink>

        <div className="hidden md:flex items-center gap-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  isActive ? 'text-white' : ''
                }`
              }
              style={({ isActive }) => ({
                backgroundColor: isActive ? 'var(--color-wood)' : 'transparent',
                color: isActive ? 'white' : 'var(--color-text)',
              })}
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </div>

        <button
          className="md:hidden p-2 rounded-lg"
          onClick={() => setOpen(!open)}
          aria-label="菜单"
          style={{ color: 'var(--color-wood)' }}
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <div
          className="md:hidden border-t"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="px-4 py-3 flex flex-col gap-1">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                    isActive ? 'text-white' : ''
                  }`
                }
                style={({ isActive }) => ({
                  backgroundColor: isActive ? 'var(--color-wood)' : 'transparent',
                  color: isActive ? 'white' : 'var(--color-text)',
                })}
              >
                <Icon className="w-4 h-4" />
                {label}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
