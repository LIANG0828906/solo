import { NavLink, useLocation } from 'react-router-dom';
import { Store, ShoppingBag, Heart, BarChart3, Menu, X, Home } from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/', label: '首页', icon: Home },
  { to: '/stall', label: '摊位管理', icon: Store },
  { to: '/transactions', label: '交易记录', icon: ShoppingBag },
  { to: '/favorites', label: '收藏夹', icon: Heart },
  { to: '/reports', label: '销售报表', icon: BarChart3 },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-amber-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Store className="w-7 h-7 text-amber-200" />
            <span className="text-xl font-display font-bold text-white hidden sm:block">
              社区跳蚤市场
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `nav-link flex items-center gap-1.5 text-sm ${
                    isActive || (item.to !== '/' && location.pathname.startsWith(item.to))
                      ? 'nav-link-active'
                      : ''
                  }`
                }
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>

          <button
            className="md:hidden p-2 text-white rounded-lg hover:bg-white/10"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="菜单"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden py-2 border-t border-white/10 animate-fade-in-up">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `nav-link flex items-center gap-3 py-3 ${
                    isActive || (item.to !== '/' && location.pathname.startsWith(item.to))
                      ? 'nav-link-active'
                      : ''
                  }`
                }
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
