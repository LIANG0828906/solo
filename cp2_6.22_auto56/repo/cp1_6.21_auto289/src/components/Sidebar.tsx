import { NavLink } from 'react-router-dom';
import { Timer, BarChart3, Users, Settings, Clock } from 'lucide-react';

const navItems = [
  { path: '/', label: '计时器', icon: Timer },
  { path: '/dashboard', label: '统计', icon: BarChart3 },
  { path: '/clients', label: '客户', icon: Users },
  { path: '/settings', label: '设置', icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="w-60 min-h-screen bg-primary-950/90 backdrop-blur-lg flex flex-col fixed left-0 top-0 z-20">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center shadow-lg">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">工时小簿</h1>
            <p className="text-white/50 text-xs">快照版</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium
              transition-colors duration-200
              ${isActive
                ? 'bg-primary-900 text-white shadow-inner'
                : 'text-white/70 hover:bg-primary-800 hover:text-white'
              }
            `}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="text-white/30 text-xs text-center">
          © 2025 工时小簿
        </div>
      </div>
    </aside>
  );
}
