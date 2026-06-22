import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { BookList } from '@/pages/BookList';
import { BookDetail } from '@/pages/BookDetail';

function App() {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState('page-enter page-enter-active');

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      setTransitionStage('page-enter');
      const t1 = requestAnimationFrame(() => {
        setTransitionStage('page-enter page-enter-active');
      });
      setDisplayLocation(location);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return () => cancelAnimationFrame(t1);
    }
  }, [location, displayLocation]);

  return (
    <>
      <Navbar />
      <div className={transitionStage} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Routes location={displayLocation}>
          <Route path="/" element={<BookList />} />
          <Route path="/book/:id" element={<BookDetail />} />
          <Route path="*" element={<BookList />} />
        </Routes>
      </div>
    </>
  );
}

export default App;
