import { NavLink, useLocation } from 'react-router-dom';
import { Leaf, Home, BarChart3, Settings } from 'lucide-react';
import { useNutritionStore } from '@/store/useNutritionStore';
import { cn } from '@/lib/utils';

interface NavLinkItem {
  to: string;
  label: string;
  icon: typeof Home;
}

const NAV_LINKS: NavLinkItem[] = [
  { to: '/', label: '首页', icon: Home },
  { to: '/report', label: '报告', icon: BarChart3 },
  { to: '/settings', label: '设置', icon: Settings },
];

export default function Navbar() {
  const { selectedDate, setSelectedDate } = useNutritionStore();
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-nav border-b border-surface-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <NavLink
          to="/"
          className="flex items-center gap-2.5 flex-shrink-0 group"
        >
          <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center group-hover:bg-primary-100 transition-colors">
            <Leaf className="w-5 h-5 text-primary-500" style={{ color: '#4CAF50' }} />
          </div>
          <span className="text-lg font-bold text-gray-800 hidden sm:block">
            NutriTrack
          </span>
        </NavLink>

        <div className="flex items-center gap-2 sm:gap-4 flex-1 justify-end">
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const Icon = link.icon;
              const isActive =
                (link.to === '/' && location.pathname === '/') ||
                (link.to !== '/' && location.pathname.startsWith(link.to));
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={cn(
                    'relative px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-1.5',
                    isActive
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50',
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                  {isActive && (
                    <span className="absolute -bottom-[17px] left-3 right-3 h-0.5 rounded-full bg-primary-500" />
                  )}
                </NavLink>
              );
            })}
          </div>

          <div className="w-px h-6 bg-gray-200 hidden md:block" />

          <div className="flex items-center gap-1.5">
            <label className="text-xs text-gray-500 hidden sm:block">日期</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className={cn(
                'px-2.5 py-1.5 text-sm rounded-lg border border-surface-border',
                'focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400',
                'bg-white text-gray-700 transition-all',
                'w-[130px] sm:w-auto',
              )}
            />
          </div>

          <div className="md:hidden flex items-center gap-0.5">
            {NAV_LINKS.map((link) => {
              const Icon = link.icon;
              const isActive =
                (link.to === '/' && location.pathname === '/') ||
                (link.to !== '/' && location.pathname.startsWith(link.to));
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200',
                    isActive
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50',
                  )}
                  aria-label={link.label}
                >
                  <Icon className="w-4.5 h-4.5" />
                </NavLink>
              );
            })}
          </div>

          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm hover:scale-105 transition-transform cursor-pointer" style={{ backgroundColor: '#4CAF50' }}>
            U
          </div>
        </div>
      </div>
    </nav>
  );
}
