import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import HomePage from './pages/HomePage';
import PlantDetailPage from './pages/PlantDetailPage';
import ProfilePage from './pages/ProfilePage';

function AnimatedRoutes() {
  const location = useLocation();
  const [renderLocations, setRenderLocations] = useState<{ loc: typeof location; key: number; phase: 'enter' | 'exit' }[]>([
    { loc: location, key: 0, phase: 'enter' },
  ]);
  const keyRef = useRef(1);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const current = renderLocations[renderLocations.length - 1];
    if (current.loc.pathname === location.pathname) return;

    setRenderLocations((prev) => {
      const last = prev[prev.length - 1];
      return [
        ...prev.map((item) =>
          item.key === last.key ? { ...item, phase: 'exit' as const } : item
        ),
        { loc: location, key: keyRef.current++, phase: 'enter' as const },
      ];
    });

    if (animationRef.current) {
      clearTimeout(animationRef.current);
    }
    animationRef.current = window.setTimeout(() => {
      setRenderLocations((prev) => prev.slice(-1).map((item) => ({ ...item, phase: 'enter' })));
    }, 320);

    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, [location.pathname]);

  return (
    <div className="relative w-full min-h-screen overflow-hidden">
      {renderLocations.map(({ loc, key, phase }) => (
        <div
          key={key}
          className={`w-full ${phase === 'enter' ? 'route-enter' : 'route-exit'}`}
          style={{
            position: phase === 'exit' ? 'absolute' : 'relative',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          <Routes location={loc}>
            <Route path="/" element={<HomePage />} />
            <Route path="/plant/:id" element={<PlantDetailPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  return <AnimatedRoutes />;
}
