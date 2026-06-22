import { NavLink } from 'react-router-dom';
import { ClipboardList, BarChart3, Trophy, Settings } from 'lucide-react';

const navItems = [
  { path: '/', label: '任务', icon: ClipboardList },
  { path: '/dashboard', label: '仪表盘', icon: BarChart3 },
  { path: '/leaderboard', label: '排行', icon: Trophy },
  { path: '/settings', label: '设置', icon: Settings },
];

export default function MobileNav() {
  return (
    <nav
      className="mobile-nav fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50"
      style={{ display: 'none' }}
    >
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === '/'}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center py-2 text-xs ${
              isActive ? 'text-blue-600' : 'text-gray-500'
            }`
          }
        >
          <item.icon className="w-5 h-5 mb-1" />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
