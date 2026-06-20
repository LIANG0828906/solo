import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { Search, Users, ClipboardList, Star, Menu, X, Home } from 'lucide-react';
import HomePage from './components/HomePage';
import MyRoommate from './components/MyRoommate';
import RatingCenter from './components/RatingCenter';

const NAV_ITEMS = [
  { to: '/', label: '发现室友', icon: Search, end: true },
  { to: '/my-roommate', label: '我的合租', icon: Users },
  { to: '/transactions', label: '合租事务', icon: ClipboardList },
  { to: '/rating-center', label: '评分中心', icon: Star },
];

function App() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => (typeof window !== 'undefined' ? window.innerWidth >= 1024 : true));
  const dragStateRef = useRef<{ startX: number; startW: number }>({ startX: 0, startW: 0 });

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isDragging) return;
    const DAMPING = 0.7;
    let lastX = 0;
    let lastT = 0;

    const onMove = (e: MouseEvent) => {
      const now = performance.now();
      const dt = now - lastT;
      if (dt > 0 && lastX !== 0) {
        const velocity = (e.clientX - lastX) / dt;
        const dampedDelta = (e.clientX - dragStateRef.current.startX) * DAMPING + velocity * dt * 0.3;
        const newW = Math.max(180, Math.min(360, dragStateRef.current.startW + dampedDelta));
        setSidebarWidth(newW);
      } else {
        const newW = Math.max(180, Math.min(360, dragStateRef.current.startW + (e.clientX - dragStateRef.current.startX) * DAMPING));
        setSidebarWidth(newW);
      }
      lastX = e.clientX;
      lastT = now;
    };
    const onUp = () => setIsDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging]);

  const handleResizeStart = (e: React.MouseEvent) => {
    dragStateRef.current = { startX: e.clientX, startW: sidebarWidth ?? 240 };
    setIsDragging(true);
  };

  const renderSidebar = (vertical = false) => (
    <nav className={vertical ? 'flex flex-col gap-1' : 'flex items-center gap-8'}>
      {NAV_ITEMS.map((item, idx) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `nav-link menu-slide-item ${vertical ? 'flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/50' : 'inline-flex items-center gap-2'} ${isActive ? 'active' : ''}`
          }
          style={{ animationDelay: `${idx * 0.06}s` }}
        >
          <item.icon size={18} strokeWidth={1.75} />
          <span className="font-medium">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );

  const sidebarEffectiveWidth = isDesktop ? sidebarWidth ?? 240 : 0;

  return (
    <div className="app-bg-blobs min-h-screen">
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/50 border-b border-white/60">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#4a90a4] to-[#e8c99b] text-white shadow-md group-hover:shadow-lg transition-shadow">
              <Home size={18} strokeWidth={2} />
            </div>
            <span className="font-serif-sc text-xl font-bold bg-gradient-to-r from-[#356d7e] to-[#8b6b3a] bg-clip-text text-transparent">
              合居 Hub
            </span>
          </NavLink>

          <div className="hidden lg:block">{renderSidebar(false)}</div>

          <div className="lg:hidden">
            <button
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/70 hover:bg-white transition-colors"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="菜单"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="lg:hidden border-t border-white/60 bg-white/80 backdrop-blur-xl px-4 py-4 fade-in">
            {renderSidebar(true)}
          </div>
        )}
      </header>

      <div className="max-w-[1400px] mx-auto flex">
        {isDesktop && (
          <>
            <aside
              className="hidden lg:block shrink-0 sticky top-20 self-start mt-6 ml-6 glass-card p-4"
              style={{ width: sidebarEffectiveWidth, height: 'calc(100vh - 6rem)' }}
            >
              <div className="mb-4 px-2 pb-3 border-b border-white/70">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7c8a]">快捷入口</p>
              </div>
              {renderSidebar(true)}
              <div className="absolute bottom-5 left-4 right-4 text-xs text-[#8b9bab] leading-relaxed px-2">
                <p>愿你在这里，遇见合拍的室友</p>
                <p className="mt-1 opacity-70">· 让合租像回家一样温暖 ·</p>
              </div>
            </aside>
            <div
              className={`hidden lg:block mt-6 self-start sticky top-20 h-[calc(100vh-6rem)] resize-handle ${isDragging ? 'dragging' : ''}`}
              onMouseDown={handleResizeStart}
            />
          </>
        )}

        <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 min-w-0">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/my-roommate" element={<MyRoommate initialTab="rent" />} />
            <Route path="/transactions" element={<MyRoommate initialTab="duty" />} />
            <Route path="/rating-center" element={<RatingCenter />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
