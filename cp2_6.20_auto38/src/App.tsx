import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Loading from './components/Loading';

const HomePage = lazy(() => import('./pages/HomePage'));
const AssignmentPage = lazy(() => import('./pages/AssignmentPage'));

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <div className="app-root">
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/assignments/:id" element={<AssignmentPage />} />
            </Routes>
          </Suspense>
        </div>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
