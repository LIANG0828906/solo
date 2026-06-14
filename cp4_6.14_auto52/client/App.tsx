import { useState, useEffect } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import axios from 'axios';
import Exhibition from './Exhibition';
import Tour from './Tour';
import Stats from './Stats';

interface ExhibitionData {
  id: string;
  name: string;
  openingDate: string;
  backgroundColor: string;
  backgroundMode: 'solid' | 'gradient';
  backgroundGradientEnd?: string;
  artworks: any[];
}

function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [exhibition, setExhibition] = useState<ExhibitionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    fetchExhibition();
  }, []);

  const fetchExhibition = async () => {
    try {
      const res = await axios.get('/api/exhibitions');
      if (res.data.length > 0) {
        setExhibition(res.data[0]);
      }
    } catch (err) {
      console.error('获取展览失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  if (loading) {
    return (
      <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>加载中...</div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <button className="theme-toggle" onClick={toggleTheme} title="切换主题">
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      <nav className="nav-bar">
        <div className="nav-brand">🎨 虚拟展厅</div>
        <ul className="nav-links">
          <li>
            <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
              策展后台
            </NavLink>
          </li>
          <li>
            <NavLink to="/tour" className={({ isActive }) => isActive ? 'active' : ''}>
              参观导览
            </NavLink>
          </li>
          <li>
            <NavLink to="/stats" className={({ isActive }) => isActive ? 'active' : ''}>
              数据统计
            </NavLink>
          </li>
        </ul>
      </nav>

      <div className="main-content">
        <Routes>
          <Route 
            path="/" 
            element={
              <Exhibition 
                exhibition={exhibition} 
                onUpdate={setExhibition} 
              />
            } 
          />
          <Route 
            path="/tour" 
            element={
              <Tour 
                exhibition={exhibition} 
              />
            } 
          />
          <Route 
            path="/stats" 
            element={
              <Stats 
                exhibition={exhibition} 
              />
            } 
          />
        </Routes>
      </div>
    </div>
  );
}

export default App;
