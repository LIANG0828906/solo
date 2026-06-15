import { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Guitar,
  Music,
  Menu,
  X,
} from 'lucide-react';
import { BandProvider } from './contexts/BandContext';
import Dashboard from './components/Dashboard';
import GigBoard from './components/GigBoard';
import EquipmentList from './components/EquipmentList';
import RehearsalGantt from './components/RehearsalGantt';
import { cn } from './lib/utils';

const navItems = [
  { path: '/', label: '仪表盘', icon: LayoutDashboard },
  { path: '/gigs', label: '演出日程', icon: Calendar },
  { path: '/equipment', label: '设备清单', icon: Guitar },
  { path: '/rehearsals', label: '排练进度', icon: Music },
];

function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const location = useLocation();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 w-[260px] bg-[#16213e] border-r border-white/10',
          'transform transition-transform duration-300 ease-in-out',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-white/10">
          <h1 className="text-xl font-bold gradient-text">Band Manager</h1>
          <button
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                  'hover:bg-white/5',
                  isActive
                    ? 'bg-gradient-to-r from-[#e94560]/20 to-[#0f3460]/20 text-white border-l-2 border-[#e94560]'
                    : 'text-gray-400'
                )}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <div className="text-xs text-gray-500 text-center">
            乐队管理助手 v1.0
          </div>
        </div>
      </aside>
    </>
  );
}

function MobileNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#16213e] border-t border-white/10 lg:hidden">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-4 py-2 transition-colors',
                isActive ? 'text-[#e94560]' : 'text-gray-400'
              )}
            >
              <Icon size={22} />
              <span className="text-xs">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

function MainContent() {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    setIsVisible(false);
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <main
      className={cn(
        'flex-1 overflow-auto transition-opacity duration-300',
        isVisible ? 'opacity-100' : 'opacity-0'
      )}
    >
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/gigs" element={<GigBoard />} />
        <Route path="/equipment" element={<EquipmentList />} />
        <Route path="/rehearsals" element={<RehearsalGantt />} />
      </Routes>
    </main>
  );
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <BandProvider>
      <div className="flex h-screen bg-[#1a1a2e]">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="h-16 flex items-center px-4 lg:px-6 border-b border-white/10 bg-[#16213e]/50">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Menu size={24} />
            </button>
            <h2 className="ml-4 lg:ml-0 text-lg font-semibold">
              乐队管理助手
            </h2>
          </header>

          <div className="flex-1 flex overflow-hidden pb-16 lg:pb-0">
            <MainContent />
          </div>
        </div>

        <MobileNav />
      </div>
    </BandProvider>
  );
}

export default App;
