import { Routes, Route, NavLink, Link } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import Gallery from './Gallery';

const PaintingDetail = lazy(() => import('./PaintingDetail'));
const Favorites = lazy(() => import('./Favorites'));

function App() {
  return (
    <div className="app">
      <nav className="navbar">
        <Link to="/" className="navbar-title">虚拟艺术画廊</Link>
        <div className="navbar-links">
          <NavLink to="/" className="navbar-link" end>
            画廊首页
          </NavLink>
          <NavLink to="/favorites" className="navbar-link">
            我的珍藏
          </NavLink>
        </div>
      </nav>

      <Suspense fallback={<div className="loading-spinner">加载中...</div>}>
        <Routes>
          <Route path="/" element={<Gallery />} />
          <Route path="/painting/:id" element={<PaintingDetail />} />
          <Route path="/favorites" element={<Favorites />} />
        </Routes>
      </Suspense>
    </div>
  );
}

export default App;
