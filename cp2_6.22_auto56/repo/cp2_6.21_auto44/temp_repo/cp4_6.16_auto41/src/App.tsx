import { useEffect, useState, useCallback } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from 'react-router-dom';
import Navbar from '@/components/Layout/Navbar';
import Dashboard from '@/pages/Dashboard';
import Activities from '@/pages/Activities';
import Leaderboard from '@/pages/Leaderboard';
import Settings from '@/pages/Settings';
import { useCarbonStore } from '@/store/carbonStore';
import { Loader, Leaf } from 'lucide-react';

const PageTransition = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [displayedLocation, setDisplayedLocation] = useState(location);
  const [phase, setPhase] = useState<'idle' | 'fade-out' | 'fade-in'>('idle');
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (location.pathname === displayedLocation.pathname) return;

    setIsTransitioning(true);
    setPhase('fade-out');

    const fadeOutTimer = setTimeout(() => {
      setDisplayedLocation(location);
      setPhase('fade-in');
    }, 220);

    const fadeInTimer = setTimeout(() => {
      setPhase('idle');
      setIsTransitioning(false);
    }, 220 + 280);

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(fadeInTimer);
    };
  }, [location, displayedLocation]);

  const getStyle = (): React.CSSProperties => {
    switch (phase) {
      case 'fade-out':
        return {
          opacity: 0,
          transform: 'translateY(-6px)',
          transition: 'opacity 220ms ease-in, transform 220ms ease-in',
        };
      case 'fade-in':
        return {
          opacity: 1,
          transform: 'translateY(0)',
          transition: 'opacity 280ms ease-out, transform 280ms ease-out',
        };
      default:
        return {
          opacity: 1,
          transform: 'translateY(0)',
          transition: 'opacity 280ms ease-out, transform 280ms ease-out',
        };
    }
  };

  return (
    <div style={getStyle()} key={displayedLocation.pathname}>
      <Routes location={displayedLocation}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/activities" element={<Activities />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Dashboard />} />
      </Routes>
    </div>
  );
};

const App = () => {
  const { initStore, isHydrated, isLoading, error } = useCarbonStore();
  const [inited, setInited] = useState(false);

  useEffect(() => {
    let cancelled = false;
    initStore().finally(() => {
      if (!cancelled) {
        setTimeout(() => setInited(true), 120);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [initStore]);

  const showSplash = !inited || isLoading;

  return (
    <Router>
      {showSplash && (
        <div className="fixed inset-0 z-[100] bg-gradient-to-br from-primary-50 via-white to-accent-100 flex items-center justify-center">
          <div className="flex flex-col items-center gap-5 animate-fade-in">
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center shadow-2xl shadow-primary-700/30 animate-pulse">
                <Leaf className="w-10 h-10 text-white" strokeWidth={2.2} />
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-primary-800 tracking-tight">
                碳足迹追踪
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                践行低碳生活，守护绿色地球
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-primary-700">
              <Loader className="w-4 h-4 animate-spin" />
              <span className="font-medium">正在加载数据...</span>
            </div>
            {error && (
              <div className="text-xs text-danger-500 bg-danger-50 px-3 py-1.5 rounded-lg">
                {error}
              </div>
            )}
          </div>
        </div>
      )}

      <div
        className={`min-h-screen flex flex-col bg-bg-light transition-opacity duration-300 ${
          showSplash ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <Navbar />
        <main className="flex-1 w-full container max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <PageTransition>
            <></>
          </PageTransition>
        </main>
        <footer className="border-t border-gray-100 bg-white/60 backdrop-blur-sm">
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <Leaf className="w-4 h-4 text-primary-600" />
                <span>碳足迹追踪 · 与您一起守护地球</span>
              </div>
              <div>所有数据存储于本地浏览器 · 您的隐私完全由您掌控</div>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App;
