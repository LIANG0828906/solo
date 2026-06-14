import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, FileEdit, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { path: '/', label: '仪表盘', icon: <LayoutDashboard size={20} /> },
  { path: '/calendar', label: '日历', icon: <Calendar size={20} /> },
  { path: '/editor', label: '内容编辑', icon: <FileEdit size={20} /> },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="hidden md:flex flex-col w-60 h-screen fixed left-0 top-0 text-white z-30" style={{ backgroundColor: '#1a2332' }}>
      <div className="h-16 flex items-center px-6 border-b border-white/10">
        <h1 className="text-xl font-bold tracking-wide">ContentHub</h1>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                isActive
                  ? 'bg-white/10 text-white font-medium'
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
          <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
            <User size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">管理员</p>
            <p className="text-xs text-white/50 truncate">admin@example.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
