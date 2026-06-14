import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, FileEdit } from 'lucide-react';
import { cn } from '@/lib/utils';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

interface LayoutProps {
  children: React.ReactNode;
}

const tabItems = [
  { path: '/', label: '仪表盘', icon: LayoutDashboard },
  { path: '/calendar', label: '日历', icon: Calendar },
  { path: '/editor', label: '编辑', icon: FileEdit },
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8f9fa' }}>
      <Sidebar />

      <div className="md:ml-60 min-h-screen flex flex-col">
        <TopBar />

        <main className="flex-1 p-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 flex items-center justify-around z-30">
        {tabItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors',
                isActive ? 'text-blue-600' : 'text-gray-500'
              )}
            >
              <Icon size={22} />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
