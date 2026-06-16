import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import { useUserStore } from './store/userStore';

const HomePage = lazy(() => import('./pages/HomePage'));
const BookListPage = lazy(() => import('./pages/BookListPage'));
const LendingPage = lazy(() => import('./pages/LendingPage'));
const EventsPage = lazy(() => import('./pages/EventsPage'));
const DriftPage = lazy(() => import('./pages/DriftPage'));

export default function App() {
  const userName = useUserStore((s) => s.userName);

  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar userName={userName} />
        <main className="main-content">
          <Suspense
            fallback={
              <div className="loading-container">
                <div className="loading-spinner" />
                <p>加载中...</p>
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/books" element={<BookListPage />} />
              <Route path="/lending" element={<LendingPage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/drift" element={<DriftPage />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </BrowserRouter>
  );
}
