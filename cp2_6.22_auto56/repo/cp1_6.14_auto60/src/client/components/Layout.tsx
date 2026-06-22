import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Home, List, PieChart } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Layout() {
  const location = useLocation();

  const navItems = [
    { to: '/', label: '首页', icon: Home },
    { to: '/records', label: '记录', icon: List },
    { to: '/reports', label: '报告', icon: PieChart },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="hidden md:block sticky top-0 z-50">
        <div className="glass-card mx-4 mt-4 px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <h1 className="text-xl font-bold tracking-wide">
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                消费追踪助手
              </span>
            </h1>
            <nav className="flex items-center gap-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    cn('nav-link flex items-center gap-2', isActive && 'active')
                  }
                >
                  <item.icon size={18} />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-24 md:pb-8 pt-4 md:pt-6 px-4">
        <div
          key={location.pathname}
          className="max-w-6xl mx-auto fade-in"
        >
          <Outlet />
        </div>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-4">
        <div className="glass-card">
          <div className="flex items-center justify-around py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    cn(
                      'flex flex-col items-center gap-1 py-2 px-6 rounded-xl transition-all',
                      isActive
                        ? 'text-white bg-white/10'
                        : 'text-white/50 hover:text-white/80'
                    )
                  }
                >
                  <Icon size={22} />
                  <span className="text-xs font-medium">{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
