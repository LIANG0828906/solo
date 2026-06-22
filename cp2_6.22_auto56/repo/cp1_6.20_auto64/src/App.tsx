import { createBrowserRouter, Outlet, Link } from 'react-router-dom';
import { Suspense, lazy } from 'react';

const HomePage = lazy(() => import('./pages/HomePage'));
const DetailPage = lazy(() => import('./pages/DetailPage'));
const AddPage = lazy(() => import('./pages/AddPage'));

const Skeleton = () => (
  <div className="skeleton-container">
    <div className="skeleton-header" />
    <div className="skeleton-grid">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="skeleton-card" />
      ))}
    </div>
  </div>
);

const Layout = () => (
  <div className="app-layout">
    <header className="app-header">
      <Link to="/" className="app-logo">
        🧊 食材冰箱
      </Link>
      <nav className="app-nav">
        <Link to="/" className="nav-link">
          🏠 首页
        </Link>
        <Link to="/add" className="nav-link nav-btn">
          ➕ 录入食材
        </Link>
      </nav>
    </header>
    <main className="app-main">
      <Suspense fallback={<Skeleton />}>
        <Outlet />
      </Suspense>
    </main>
  </div>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<Skeleton />}>
            <HomePage />
          </Suspense>
        ),
      },
      {
        path: 'item/:id',
        element: (
          <Suspense fallback={<Skeleton />}>
            <DetailPage />
          </Suspense>
        ),
      },
      {
        path: 'add',
        element: (
          <Suspense fallback={<Skeleton />}>
            <AddPage />
          </Suspense>
        ),
      },
    ],
  },
]);
