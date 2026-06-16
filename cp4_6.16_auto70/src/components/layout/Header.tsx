import { NavLink, useLocation } from 'react-router-dom';
import { Leaf, Calendar, Plus, Flower2 } from 'lucide-react';

interface HeaderProps {
  onAddPlant: () => void;
}

export default function Header({ onAddPlant }: HeaderProps) {
  const location = useLocation();
  const isDetail = location.pathname.startsWith('/plant/');

  return (
    <header className="bg-white border-b border-primary/10 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Flower2 className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-serif font-semibold text-app-text truncate">
                PlantDiary
              </h1>
              <p className="text-xs text-app-text-light hidden sm:block">
                植物养护日志 · 记录每一次生长
              </p>
            </div>
          </div>

          <nav className="flex items-center gap-1 sm:gap-2 bg-app-bg rounded-full p-1">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  isActive || isDetail
                    ? 'bg-primary text-white shadow-md'
                    : 'text-app-text-light hover:text-app-text hover:bg-white/60'
                }`
              }
            >
              <Leaf className="w-4 h-4" />
              <span className="hidden xs:inline">植物</span>
            </NavLink>
            <NavLink
              to="/calendar"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary text-white shadow-md'
                    : 'text-app-text-light hover:text-app-text hover:bg-white/60'
                }`
              }
            >
              <Calendar className="w-4 h-4" />
              <span className="hidden xs:inline">日历</span>
            </NavLink>
          </nav>

          <button
            onClick={onAddPlant}
            className="flex items-center gap-1.5 px-3 sm:px-5 py-2.5 bg-primary text-white rounded-full font-medium text-sm shadow-md hover:shadow-lg hover:bg-primary-dark transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">添加植物</span>
          </button>
        </div>
      </div>
    </header>
  );
}
