import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import RecordPage from './pages/RecordPage';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <nav className="navbar">
          <div className="nav-inner">
            <div className="nav-logo">📚 亲子绘本</div>
            <div className="nav-links">
              <NavLink
                to="/home"
                className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}
              >
                <span className="nav-text">首页推荐</span>
                <span className="nav-underline" />
              </NavLink>
              <NavLink
                to="/record"
                className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}
              >
                <span className="nav-text">阅读记录</span>
                <span className="nav-underline" />
              </NavLink>
            </div>
          </div>
        </nav>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/record" element={<RecordPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
