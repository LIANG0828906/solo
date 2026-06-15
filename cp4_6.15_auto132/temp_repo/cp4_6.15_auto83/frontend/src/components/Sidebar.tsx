import { NavLink, useLocation } from 'react-router-dom';
import { Home, ListMusic, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', label: '首页', icon: Home },
  { to: '/playlist', label: '播放列表', icon: ListMusic },
  { to: '/history', label: '历史记录', icon: Clock },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <>
      <aside
        className={cn(
          'hidden md:flex flex-col gap-2',
          'fixed left-4 top-1/2 -translate-y-1/2',
          'glass p-3',
          'z-40'
        )}
      >
        {navItems.map(({ to, label, icon: Icon }) => {
          const isActive = location.pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300',
                'hover:bg-white/15',
                isActive
                  ? 'bg-white/20 text-white shadow-lg'
                  : 'text-white/70 hover:text-white'
              )}
              style={
                isActive
                  ? {
                      boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)',
                    }
                  : undefined
              }
            >
              <Icon className={cn('w-5 h-5', isActive && 'text-purple-300')} />
              <span className="text-sm font-medium">{label}</span>
            </NavLink>
          );
        })}
      </aside>

      <nav
        className={cn(
          'md:hidden fixed bottom-0 left-0 right-0 z-50',
          'glass rounded-none border-t border-white/20',
          'px-2 py-2'
        )}
      >
        <div className="flex items-center justify-around">
          {navItems.map(({ to, label, icon: Icon }) => {
            const isActive = location.pathname === to;
            return (
              <NavLink
                key={to}
                to={to}
                className={cn(
                  'flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-300',
                  'flex-1',
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'text-white/60'
                )}
              >
                <Icon
                  className={cn('w-5 h-5 transition-all', isActive && 'scale-110 text-purple-300')}
                />
                <span className="text-[11px] font-medium">{label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </>
  );
}
