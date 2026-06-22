import { Link, NavLink } from 'react-router-dom';
import { CalendarDays, LayoutDashboard, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavbarProps {
  className?: string;
}

export function Navbar({ className }: NavbarProps) {
  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 h-14',
        'bg-white/70 backdrop-blur-md border-b border-primary/10',
        className
      )}
    >
      <div className="max-w-7xl mx-auto h-full px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
            <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-semibold text-text hidden sm:block">
            会议脉冲
          </span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-text-light hover:text-text hover:bg-primary/5'
              )
            }
          >
            <CalendarDays className="w-4 h-4" />
            <span className="hidden sm:inline">首页</span>
          </NavLink>

          <NavLink
            to="/board"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-text-light hover:text-text hover:bg-primary/5'
              )
            }
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="hidden sm:inline">看板</span>
          </NavLink>
        </div>
      </div>
    </nav>
  );
}
