import React, { useState, useCallback } from 'react';
import { BuilderPage } from './modules/builder/BuilderPage';
import { StatsPage } from './modules/stats/StatsPage';
import type { Page } from './types';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('builder');
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');

  const handleNavigate = useCallback((page: Page) => {
    setSlideDirection(page === 'stats' ? 'right' : 'left');
    setCurrentPage(page);
  }, []);

  const getAnimationClass = () => {
    const baseClass = 'w-full h-full transition-transform duration-[400ms] ease-out';
    if (slideDirection === 'right') {
      return `${baseClass} animate-[slideInRight_400ms_ease-out]`;
    }
    return `${baseClass} animate-[slideInLeft_400ms_ease-out]`;
  };

  return (
    <div className="w-full min-h-screen overflow-hidden">
      <div className={getAnimationClass()}>
        {currentPage === 'builder' && (
          <BuilderPage onNavigate={handleNavigate} />
        )}
        {currentPage === 'stats' && (
          <StatsPage onNavigate={handleNavigate} />
        )}
      </div>
    </div>
  );
}

export default App;
