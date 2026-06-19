import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { InventoryPage } from '@/pages/InventoryPage';
import { ProductDetailPage } from '@/pages/ProductDetailPage';
import { TrackingPage } from '@/pages/TrackingPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { useNotification } from '@/hooks/useNotification';

const PageTransition = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionClass, setTransitionClass] = useState('');

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      setTransitionClass('translate-x-full opacity-0');
      const timer = setTimeout(() => {
        setDisplayLocation(location);
        setTransitionClass('-translate-x-full opacity-0');
        setTimeout(() => setTransitionClass(''), 50);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [location, displayLocation]);

  return (
    <div
      className={`transition-all duration-300 ease-out ${transitionClass}`}
      key={displayLocation.pathname}
    >
      {children}
    </div>
  );
};

const AppContent = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <PageTransition>
          <Routes location={location}>
            <Route path="/" element={<Navigate to="/inventory" replace />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/product/:id" element={<ProductDetailPage />} />
            <Route path="/tracking" element={<TrackingPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/inventory" replace />} />
          </Routes>
        </PageTransition>
      </main>
    </div>
  );
};

function App() {
  useNotification();

  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
