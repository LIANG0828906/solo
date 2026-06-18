import { useState, useEffect, createContext, useContext } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import BookingPage from './pages/BookingPage';
import AdminPage from './pages/AdminPage';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};

function App() {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('cospace-theme');
    return (saved as Theme) || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('cospace-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <nav className="navbar">
        <div className="navbar-logo">CoSpace</div>
        <div className="navbar-right">
          <NavLink to="/" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} end>
            预订
          </NavLink>
          <NavLink to="/admin" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            管理
          </NavLink>
          <button className="theme-toggle" onClick={toggleTheme} aria-label="切换主题">
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </nav>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<BookingPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>
    </ThemeContext.Provider>
  );
}

export default App;
