import { NavLink, useLocation } from 'react-router-dom';
import { Radio, Users, Eye } from 'lucide-react';

const navItems = [
  { to: '/', label: '节目', icon: Radio },
  { to: '/guests', label: '嘉宾', icon: Users },
  { to: '/preview-select', label: '预览', icon: Eye },
];

export default function Sidebar() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/' || location.pathname.startsWith('/program/');
    if (path === '/guests') return location.pathname.startsWith('/guest');
    if (path === '/preview-select') return location.pathname.startsWith('/preview');
    return false;
  };

  return (
    <>
      <aside className="sidebar-desktop fixed left-0 top-0 bottom-0 w-[240px] bg-sidebar flex flex-col z-40">
        <div className="px-5 py-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="8" width="3" height="8" rx="1" fill="white" opacity="0.9"/>
              <rect x="7" y="4" width="3" height="16" rx="1" fill="white" opacity="0.7"/>
              <rect x="12" y="6" width="3" height="12" rx="1" fill="white" opacity="0.8"/>
              <rect x="17" y="3" width="3" height="18" rx="1" fill="white" opacity="0.6"/>
            </svg>
          </div>
          <span className="font-display font-bold text-white text-lg tracking-tight">PodcastFlow</span>
        </div>
        <nav className="flex-1 px-3 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all relative mb-1 ${
                  active
                    ? 'text-white bg-white/10'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-accent rounded-r" />
                )}
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="px-5 py-4 border-t border-white/10">
          <p className="text-xs text-slate-500">数据存储于本地</p>
        </div>
      </aside>

      <nav className="mobile-nav fixed bottom-0 left-0 right-0 bg-sidebar border-t border-white/10 z-40 flex justify-around items-center py-2 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-lg transition-all ${
                active ? 'text-accent' : 'text-slate-500'
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}
