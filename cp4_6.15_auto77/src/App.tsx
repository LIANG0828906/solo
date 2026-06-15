import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import HomePage from './pages/HomePage';
import PlantDetailPage from './pages/PlantDetailPage';
import ProfilePage from './pages/ProfilePage';

function AnimatedRoutes() {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionPhase, setTransitionPhase] = useState<'enter' | 'idle'>('enter');

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      setTransitionPhase('enter');
      const timer = setTimeout(() => {
        setDisplayLocation(location);
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [location, displayLocation]);

  useEffect(() => {
    if (transitionPhase === 'enter') {
      const timer = setTimeout(() => {
        setTransitionPhase('idle');
      }, 320);
      return () => clearTimeout(timer);
    }
  }, [transitionPhase, displayLocation]);

  return (
    <div className={transitionPhase === 'enter' ? 'route-enter' : ''}>
      <Routes location={displayLocation}>
        <Route path="/" element={<HomePage />} />
        <Route path="/plant/:id" element={<PlantDetailPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return <AnimatedRoutes />;
}
