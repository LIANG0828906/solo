import { NavLink } from 'react-router-dom';
import { Home, Users, Calendar, User } from 'lucide-react';

const navItems = [
  { path: '/', label: '首页', icon: Home },
  { path: '/groups', label: '小组', icon: Users },
  { path: '/activities', label: '活动', icon: Calendar },
  { path: '/profile', label: '我的', icon: User },
];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 hidden md:block bg-white border-r border-gray-200">
      <nav className="p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-primary-500 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
