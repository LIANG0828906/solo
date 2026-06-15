import { useEffect, useState } from 'react';
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

const AnimatedRoutes = () => {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState<'fadeOut' | 'fadeIn'>('fadeIn');

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      setTransitionStage('fadeOut');
      const timer = setTimeout(() => {
        setDisplayLocation(location);
        setTransitionStage('fadeIn');
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [location, displayLocation]);

  const transitionStyle: React.CSSProperties =
    transitionStage === 'fadeOut'
      ? { opacity: 0, transform: 'translateY(6px)' }
      : { opacity: 1, transform: 'translateY(0)' };

  return (
    <div
      style={{
        ...transitionStyle,
        transition: 'opacity 220ms ease, transform 220ms ease',
      }}
      key={displayLocation.pathname}
    >
      <Routes location={displayLocation}>
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
  const { initStore, isHydrated, isLoading } = useCarbonStore();
  const [inited, setInited] = useState(false);

  useEffect(() => {
    let cancelled = false;
    initStore().finally(() => {
      if (!cancelled) {
        setTimeout(() => setInited(true), 100);
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
        <div className="fixed inset-0 z-[100] bg-gradient-to-br from-primary-50 via-white to-accent-100 flex items-center justify-center animate-fade-in">
          <div className="flex flex-col items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center shadow-2xl shadow-primary-700/30 animate-pulse">
                <Leaf className="w-10 h-10 text-white" strokeWidth={2.2} />
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-primary-800 tracking-tight">
                碳足迹追踪
              </h2>
              <p className="text-sm text-gray-500 mt-1">践行低碳生活，守护绿色地球</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-primary-700">
              <Loader className="w-4 h-4 animate-spin" />
              <span className="font-medium">正在加载数据...</span>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen flex flex-col bg-bg-light">
        <Navbar />
        <main className="flex-1 w-full container max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <AnimatedRoutes />
        </main>
        <footer className="border-t border-gray-100 bg-white/60 backdrop-blur-sm">
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <Leaf className="w-4 h-4 text-primary-600" />
                <span>碳足迹追踪 · 与您一起守护地球</span>
              </div>
              <div>
                所有数据存储于本地浏览器 · 您的隐私完全由您掌控
              </div>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App;
