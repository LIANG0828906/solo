import { Hourglass, Home, Users, FolderKanban } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import Avatar from './Avatar';
import { useAppStore } from '@/store';
import { cn } from '@/lib/utils';

const navLinks = [
  { to: '/', label: '仪表盘', icon: Home },
  { to: '/volunteer', label: '志愿者', icon: Users },
  { to: '/project', label: '项目', icon: FolderKanban },
];

export default function NavBar() {
  const { currentVolunteerId, getVolunteerById } = useAppStore();
  const currentVolunteer = currentVolunteerId ? getVolunteerById(currentVolunteerId) : null;
  const location = useLocation();

  const isActive = (to: string) => {
    if (to === '/') return location.pathname === '/';
    return location.pathname.startsWith(to);
  };

  return (
    <>
      <nav
        className="h-16 px-4 md:px-6 flex items-center justify-between z-30 relative"
        style={{ background: 'linear-gradient(90deg, #FF8F00, #FFC107)' }}
      >
        <div className="flex items-center gap-2.5">
          <Hourglass className="w-7 h-7 text-white animate-spin-slow" />
          <span className="text-white text-xl font-bold tracking-wide">TimeGift</span>
        </div>

        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  'text-white/90 hover:text-white px-3 py-1.5 rounded-lg transition-all duration-200 text-sm font-medium',
                  isActive && 'bg-white/20 text-white',
                )
              }
            >
              <div className="flex items-center gap-1.5">
                <link.icon className="w-4 h-4" />
                <span>{link.label}</span>
              </div>
            </NavLink>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {currentVolunteer ? (
            <div className="flex items-center gap-2">
              <Avatar name={currentVolunteer.name} size="sm" />
              <span className="text-white font-medium text-sm">{currentVolunteer.name}</span>
            </div>
          ) : (
            <span className="text-white/90 text-sm">请选择志愿者</span>
          )}
        </div>
      </nav>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur shadow-lg border-t border-gray-100 z-50">
        <div className="flex items-center justify-around h-16">
          {navLinks.map((link) => {
            const active = isActive(link.to);
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={cn(
                  'flex flex-col items-center justify-center flex-1 h-full transition-colors',
                  active ? 'text-amber-700' : 'text-gray-500',
                )}
              >
                <link.icon className={cn('w-5 h-5 mb-0.5', active && 'scale-110 transition-transform')} />
                <span className="text-xs font-medium">{link.label}</span>
              </NavLink>
            );
          })}
        </div>
        <div className="h-safe-area-bottom bg-white/95" />
      </div>
    </>
  );
}
