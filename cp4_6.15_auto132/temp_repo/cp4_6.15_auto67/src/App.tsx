import { useState, useEffect, useRef } from 'react';
import { createBrowserRouter, RouterProvider, Outlet, NavLink, useLocation } from 'react-router-dom';
import { Compass, User, History } from 'lucide-react';
import SkillList from '@/modules/skills/SkillList';
import ProfilePage from '@/modules/profile/ProfilePage';
import ExchangeRecordsPage from '@/modules/exchange/ExchangeRecordsPage';
import SettingsPage from '@/modules/settings/SettingsPage';

function Header() {
  const location = useLocation();
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 });

  const navItems = [
    { path: '/', label: '发现', Icon: Compass },
    { path: '/profile', label: '我的', Icon: User },
    { path: '/exchange', label: '交换记录', Icon: History },
  ];

  useEffect(() => {
    if (!navRef.current) return;
    const activeLink = navRef.current.querySelector<HTMLElement>(`[data-path="${location.pathname}"]`);
    if (activeLink) {
      setIndicatorStyle({
        left: activeLink.offsetLeft + activeLink.offsetWidth / 2 - 24,
        width: 48,
      });
    }
  }, [location.pathname]);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200/50"
      style={{
        height: '60px',
        backgroundColor: 'rgba(255,255,255,0.75)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
    >
      <div className="h-full max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: '#246A73' }}
          >
            <span className="text-white font-bold text-lg font-display">S</span>
          </div>
          <span className="font-display text-xl font-bold text-gray-800 hidden sm:block">
            SkillSwap
          </span>
        </div>

        <nav ref={navRef} className="relative flex items-center gap-1 h-full">
          {navItems.map(({ path, label, Icon }) => (
            <NavLink
              key={path}
              to={path}
              data-path={path}
              end={path === '/'}
              className={({ isActive }) =>
                `relative h-[60px] px-4 md:px-5 flex items-center gap-2 text-sm font-medium transition-colors duration-200 ${
                  isActive ? 'text-[#246A73]' : 'text-gray-500 hover:text-gray-700'
                }`
              }
            >
              <Icon size={18} />
              <span className="hidden sm:inline">{label}</span>
            </NavLink>
          ))}
          <span
            ref={indicatorRef}
            className="absolute bottom-0 h-[2px] rounded-t transition-all duration-200 ease-in-out pointer-events-none"
            style={{
              left: indicatorStyle.left,
              width: indicatorStyle.width,
              background: 'linear-gradient(90deg, #246A73, #2D8A95)',
            }}
          />
        </nav>

        <div className="w-20 sm:w-[108px]" />
      </div>
    </header>
  );
}

function RootLayout() {
  return (
    <div className="min-h-screen bg-[#F5F3EE]">
      <Header />
      <main className="pt-[60px]">
        <Outlet />
      </main>
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <SkillList /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'exchange', element: <ExchangeRecordsPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
