import { NavLink } from 'react-router-dom';
import { Palette, Network } from 'lucide-react';

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#1A1A2E]/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF6B6B] to-[#9370DB]">
            <Palette className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">ArtVault</span>
        </div>
        
        <div className="flex items-center gap-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[#2D2D44] text-white'
                  : 'text-gray-400 hover:text-white'
              }`
            }
          >
            <Palette className="h-4 w-4" />
            策展画廊
          </NavLink>
          <NavLink
            to="/emotion"
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[#2D2D44] text-white'
                  : 'text-gray-400 hover:text-white'
              }`
            }
          >
            <Network className="h-4 w-4" />
            情绪网络
          </NavLink>
        </div>
      </div>
    </nav>
  );
}
