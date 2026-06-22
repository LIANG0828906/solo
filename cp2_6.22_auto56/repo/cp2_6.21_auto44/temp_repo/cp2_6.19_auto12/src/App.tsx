import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { BuilderPage } from './modules/builder/BuilderPage';
import { StatsPage } from './modules/stats/StatsPage';

function App() {
  const location = useLocation();
  const [displayedLocation, setDisplayedLocation] = useState(location);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (location.pathname !== displayedLocation.pathname) {
      const newPath = location.pathname;
      const oldPath = displayedLocation.pathname;

      if (newPath === '/stats' && oldPath === '/builder') {
        setSlideDirection('right');
      } else if (newPath === '/builder' && oldPath === '/stats') {
        setSlideDirection('left');
      } else if (newPath === '/' && oldPath === '/stats') {
        setSlideDirection('left');
      } else {
        setSlideDirection('right');
      }

      setIsAnimating(true);

      const timer = setTimeout(() => {
        setDisplayedLocation(location);
        setIsAnimating(false);
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [location, displayedLocation]);

  const getAnimationClass = () => {
    if (slideDirection === 'right') {
      return 'animate-[slideInRight_400ms_ease-out]';
    }
    return 'animate-[slideInLeft_400ms_ease-out]';
  };

  return (
    <div className="w-full min-h-screen overflow-hidden">
      <div key={displayedLocation.pathname} className={getAnimationClass()}>
        <Routes location={displayedLocation}>
          <Route path="/builder" element={<BuilderPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/" element={<Navigate to="/builder" replace />} />
          <Route path="*" element={<Navigate to="/builder" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
