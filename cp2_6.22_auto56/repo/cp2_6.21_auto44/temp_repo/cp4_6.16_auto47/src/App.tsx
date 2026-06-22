import { useEffect } from 'react';
import { HashRouter, Routes, Route, NavLink } from 'react-router-dom';
import MapPage from '@/pages/MapPage';
import CheckinPage from '@/pages/CheckinPage';
import StatsPage from '@/pages/StatsPage';
import { useDeskStore } from '@/stores/deskStore';

function Navbar() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-2 rounded-lg font-medium transition-colors ${
      isActive
        ? 'bg-[#4CAF50] text-white'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
    }`;

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-40">
      <div className="max-w-[90%] mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#4CAF50] rounded-lg flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </div>
          <span className="text-lg font-bold text-gray-800">DeskHive</span>
        </div>
        <div className="flex gap-1">
          <NavLink to="/" end className={linkClass}>
            工位地图
          </NavLink>
          <NavLink to="/checkin" className={linkClass}>
            签到
          </NavLink>
          <NavLink to="/stats" className={linkClass}>
            统计
          </NavLink>
        </div>
      </div>
    </nav>
  );
}

function AppContent() {
  const { initializeData, initialized } = useDeskStore();

  useEffect(() => {
    if (!initialized) {
      initializeData();
    }
  }, [initialized, initializeData]);

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<MapPage />} />
          <Route path="/checkin" element={<CheckinPage />} />
          <Route path="/stats" element={<StatsPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
}
