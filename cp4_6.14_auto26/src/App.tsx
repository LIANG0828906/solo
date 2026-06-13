import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

const GalleryPage = lazy(() => import('@/pages/GalleryPage').then((m) => ({ default: m.GalleryPage })));
const ExhibitionPage = lazy(() =>
  import('@/pages/ExhibitionPage').then((m) => ({ default: m.ExhibitionPage }))
);

function PageLoader() {
  return (
    <div className="page-loader">
      <div className="page-loader__spinner" />
    </div>
  );
}

function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="app__main">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<GalleryPage />} />
            <Route path="/exhibition/:id" element={<ExhibitionPage />} />
            <Route path="*" element={<GalleryPage />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

export default App;
