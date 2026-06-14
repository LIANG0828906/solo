import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Dashboard from '@/components/Dashboard';
import StatisticsPanel from '@/components/StatisticsPanel';
import SavingsGoal from '@/components/SavingsGoal';
import Sidebar from '@/components/Sidebar';
import { cn } from '@/lib/utils';

function AnimatedRoutes() {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState<'fadeIn' | 'fadeOut'>('fadeIn');

  useEffect(() => {
    if (location !== displayLocation) {
      setTransitionStage('fadeOut');
    }
  }, [location, displayLocation]);

  const handleAnimationEnd = () => {
    if (transitionStage === 'fadeOut') {
      setDisplayLocation(location);
      setTransitionStage('fadeIn');
    }
  };

  return (
    <div
      className={cn(
        'flex-1 h-screen transition-all duration-300 ease-out md:pl-64 pb-20',
        transitionStage === 'fadeIn' ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
      )}
      onAnimationEnd={handleAnimationEnd}
      onTransitionEnd={handleAnimationEnd}
    >
      <Routes location={displayLocation}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/stats" element={<StatisticsPanel />} />
        <Route path="/savings" element={<SavingsGoal />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-navy-500 dark:to-navy-600">
        <Sidebar />
        <AnimatedRoutes />
      </div>
    </Router>
  );
}
