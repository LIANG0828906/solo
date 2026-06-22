import { useState, useCallback, MouseEvent } from 'react';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Subscription from './pages/Subscription';

type Page = 'dashboard' | 'subscription';

interface Ripple {
  id: number;
  x: number;
  y: number;
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const navigate = useCallback((page: Page) => {
    setCurrentPage(page);
  }, []);

  const handleClick = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[data-ripple-trigger]')) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = Date.now();
      setRipples(prev => [...prev, { id, x, y }]);
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== id));
      }, 400);
    }
  }, []);

  return (
    <div 
      className="app-container"
      onClick={handleClick}
      style={{ minHeight: '100vh', position: 'relative' }}
    >
      {ripples.map(ripple => (
        <div
          key={ripple.id}
          className="heart-ripple"
          style={{ left: ripple.x, top: ripple.y }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              fill="#D4AF37"
              opacity="0.6"
            />
          </svg>
        </div>
      ))}
      <Header currentPage={currentPage} onNavigate={navigate} />
      <main style={{ paddingTop: '80px' }}>
        {currentPage === 'dashboard' && <Dashboard onNavigate={navigate} />}
        {currentPage === 'subscription' && <Subscription onNavigate={navigate} />}
      </main>
    </div>
  );
}
