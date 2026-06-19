import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from '@/components/Navbar';

const Home = lazy(() => import('@/pages/Home'));
const BookDetail = lazy(() => import('@/pages/BookDetail'));
const CheckInPage = lazy(() => import('@/pages/CheckInPage'));
const ReviewsPage = lazy(() => import('@/pages/ReviewsPage'));
const AchievementsPage = lazy(() => import('@/pages/AchievementsPage'));
const BookListsPage = lazy(() => import('@/pages/BookListsPage'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-orange border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-text-muted">加载中...</span>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Navbar />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/book/:id" element={<BookDetail />} />
          <Route path="/checkin" element={<CheckInPage />} />
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/achievements" element={<AchievementsPage />} />
          <Route path="/booklists" element={<BookListsPage />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
