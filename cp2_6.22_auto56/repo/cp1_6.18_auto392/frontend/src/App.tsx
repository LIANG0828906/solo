import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import ProductList from './pages/ProductList';
import Admin from './pages/Admin';
import './App.css';

function Navbar() {
  return (
    <nav className="navbar">
      <div className="container navbar-content">
        <NavLink to="/" className="navbar-brand">
          <span className="brand-icon">👜</span>
          <span className="brand-text">皮具工坊</span>
        </NavLink>
        <div className="navbar-links">
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            首页
          </NavLink>
          <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            管理后台
          </NavLink>
        </div>
      </div>
    </nav>
  );
}

function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionClass, setTransitionClass] = useState('page-enter');

  useEffect(() => {
    setTransitionClass('page-exit');
    const timer = setTimeout(() => {
      setDisplayChildren(children);
      setTransitionClass('page-enter');
      setTimeout(() => setTransitionClass('page-enter-active'), 10);
    }, 300);
    return () => clearTimeout(timer);
  }, [location.pathname, children]);

  return (
    <div className={`page-transition ${transitionClass}`}>
      {displayChildren}
    </div>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-content">
        <p>© 2024 皮具工坊 - 每一件作品都凝聚匠心</p>
      </div>
    </footer>
  );
}

function App() {
  return (
    <Router>
      <Navbar />
      <main className="main-content">
        <PageTransition>
          <Routes>
            <Route path="/" element={<ProductList />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </PageTransition>
      </main>
      <Footer />
    </Router>
  );
}

export default App;
