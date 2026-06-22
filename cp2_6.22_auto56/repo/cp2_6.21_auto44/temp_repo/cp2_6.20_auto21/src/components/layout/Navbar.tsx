import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, History, TrendingUp, ClipboardList, Sun, Moon } from 'lucide-react';
import { useRetroStore } from '@/store/useRetroStore';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: '项目列表' },
  { path: '/templates', icon: FileText, label: '模板管理' },
  { path: '/history', icon: History, label: '复盘历史' },
  { path: '/trend', icon: TrendingUp, label: '趋势分析' },
  { path: '/actions', icon: ClipboardList, label: '行动看板' },
];

export default function Navbar() {
  const location = useLocation();
  const { theme, toggleTheme } = useRetroStore();

  return (
    <nav className="glass-card border-b border-white/10 px-6 py-4 sticky top-0 z-40 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">R</span>
          </div>
          <h1 className="text-xl font-bold font-display text-gradient-primary">RetroFlow</h1>
        </div>

        <div className="flex items-center gap-1">
          {navItems.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200',
                location.pathname === path
                  ? 'bg-primary-500/20 text-primary-400'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{label}</span>
            </Link>
          ))}
        </div>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>
    </nav>
  );
}
