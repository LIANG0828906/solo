import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import HomePage from '@/pages/HomePage';
import CalendarPage from '@/pages/CalendarPage';
import PetProfileGrid from '@/components/PetProfileGrid';
import { usePetStore } from '@/store/petStore';

export default function App() {
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = usePetStore();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <Router>
      <div className="flex h-screen flex-col" style={{ background: 'var(--bg-main)' }}>
        <nav
          className="sticky top-0 z-40 flex h-[var(--nav-height)] shrink-0 items-center justify-between border-b border-[#e0d6c8] px-5"
          style={{
            background: 'var(--bg-nav)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">🐾</span>
            <span className="text-lg font-extrabold text-[#3e3228]">PawGroom</span>
          </div>

          <div className="flex items-center gap-1">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `ripple-btn rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-[#4caf50] text-white'
                    : 'text-[#7a6e62] hover:bg-[#fef9f2] hover:text-[#3e3228]'
                }`
              }
            >
              首页
            </NavLink>
            <NavLink
              to="/calendar"
              className={({ isActive }) =>
                `ripple-btn rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-[#4caf50] text-white'
                    : 'text-[#7a6e62] hover:bg-[#fef9f2] hover:text-[#3e3228]'
                }`
              }
            >
              日历
            </NavLink>

            {isMobile && (
              <button
                className="ripple-btn ml-2 rounded-lg p-2 text-xl transition-colors hover:bg-[#fef9f2]"
                onClick={toggleSidebar}
              >
                🐾
              </button>
            )}
          </div>
        </nav>

        <div className="flex flex-1 overflow-hidden">
          {!isMobile && (
            <div className="shrink-0" style={{ width: 'var(--sidebar-width)' }}>
              <PetProfileGrid />
            </div>
          )}

          <main className="flex-1 overflow-hidden">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/calendar" element={<CalendarPage />} />
            </Routes>
          </main>
        </div>

        {isMobile && sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-[#00000040]"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        {isMobile && (
          <div
            className={`fixed bottom-0 left-0 right-0 z-40 transition-transform duration-300 ${
              sidebarOpen ? 'translate-y-0' : 'translate-y-full'
            }`}
            style={{ maxHeight: '70vh' }}
          >
            <div className="h-full overflow-y-auto rounded-t-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#e0d6c8] p-3">
                <span className="text-sm font-bold text-[#3e3228]">🐾 宠物档案</span>
                <button
                  className="ripple-btn rounded-full p-1.5 text-[#a09488] hover:bg-[#fef9f2]"
                  onClick={() => setSidebarOpen(false)}
                >
                  ✕
                </button>
              </div>
              <PetProfileGrid />
            </div>
          </div>
        )}
      </div>
    </Router>
  );
}
