import { BrowserRouter, Routes, Route, Link, NavLink } from 'react-router-dom';
import HomePage from './pages/HomePage';
import FavoritesPage from './pages/FavoritesPage';
import SnippetDetail from './pages/SnippetDetail';
import './styles/App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <header className="header">
          <div className="header-content">
            <Link to="/" className="logo">
              <span className="logo-icon">{'</>'}</span>
              <span className="logo-text">CodeSnippets</span>
            </Link>
            <nav className="nav">
              <NavLink to="/" end className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
                首页
              </NavLink>
              <NavLink to="/favorites" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
                我的收藏
              </NavLink>
            </nav>
          </div>
        </header>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/snippet/:id" element={<SnippetDetail />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
