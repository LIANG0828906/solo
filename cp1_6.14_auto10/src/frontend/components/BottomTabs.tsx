import { NavLink } from 'react-router-dom';
import { Home, Users, Calendar, User } from 'lucide-react';

const tabs = [
  { path: '/', label: '首页', icon: Home },
  { path: '/groups', label: '小组', icon: Users },
  { path: '/activities', label: '活动', icon: Calendar },
  { path: '/profile', label: '我的', icon: User },
];

export default function BottomTabs() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-gray-200">
      <div className="flex items-center justify-around h-16">
        {tabs.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                  isActive ? 'text-primary-500' : 'text-gray-500'
                }`
              }
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
