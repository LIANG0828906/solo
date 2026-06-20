import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { ShowcasePage } from '@/pages/ShowcasePage';
import { TimelinePage } from '@/pages/TimelinePage';
import { MaterialsPage } from '@/pages/MaterialsPage';
import { ProductDetail } from '@/pages/ProductDetail';
import { useProjectStore } from '@/store/useProjectStore';

function PageTransition() {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);
  return null;
}

function App() {
  const { hydrate } = useProjectStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <BrowserRouter>
      <PageTransition />
      <div className="app-container">
        <Navbar />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Navigate to="/showcase" replace />} />
            <Route path="/showcase" element={<ShowcasePage />} />
            <Route path="/timeline" element={<TimelinePage />} />
            <Route path="/timeline/:projectId" element={<TimelinePage />} />
            <Route path="/materials" element={<MaterialsPage />} />
            <Route path="/product/:productId" element={<ProductDetail />} />
            <Route path="*" element={<Navigate to="/showcase" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
