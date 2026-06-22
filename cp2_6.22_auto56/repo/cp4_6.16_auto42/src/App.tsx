import { useEffect, useState } from 'react';
import { Routes, Route, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useCoffeeStore } from './store';
import CoffeeList from './components/CoffeeList';
import CoffeeForm from './components/CoffeeForm';
import Dashboard from './components/Dashboard';

export default function App() {
  const init = useCoffeeStore((s) => s.init);
  const location = useLocation();
  const navigate = useNavigate();
  const [key, setKey] = useState(location.pathname);
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    setKey(location.pathname);
  }, [location.pathname]);

  const handleTagFilter = (tag: string) => {
    setTagFilter(tag);
    navigate('/');
  };

  return (
    <div className="page-container">
      <header className="app-header">
        <h1 className="app-title">☕ Coffee Passport</h1>
        <p className="app-subtitle">— 记录每一杯，品味每一天 —</p>
      </header>

      <nav className="nav-bar">
        <NavLink to="/" end className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
          📖 品鉴记录
        </NavLink>
        <NavLink to="/add" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
          ➕ 新记录
        </NavLink>
        <NavLink to="/dashboard" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
          📊 风味地图
        </NavLink>
      </nav>

      <main key={key} className="fade-enter">
        <Routes>
          <Route
            path="/"
            element={
              <CoffeeList
                tagFilter={tagFilter}
                onTagFilterCleared={() => setTagFilter(null)}
              />
            }
          />
          <Route path="/add" element={<CoffeeForm />} />
          <Route path="/dashboard" element={<Dashboard onTagClick={handleTagFilter} />} />
        </Routes>
      </main>
    </div>
  );
}
