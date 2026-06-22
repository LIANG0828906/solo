import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import PlantList from './PlantList';
import PlantDetail from './PlantDetail';
import Settings from './Settings';

const globalStyles = `
  :root {
    --color-primary: #2e7d32;
    --color-primary-light: #66bb6a;
    --color-primary-dark: #1b5e20;
    --color-bg-start: #e8f5e9;
    --color-bg-end: #ffffff;
    --color-accent-orange: #ff9800;
    --color-accent-red: #f44336;
    --color-border-gray-green: #81c784;
    --color-text: #263238;
    --color-text-light: #546e7a;
    --color-bg-water: #e3f2fd;
    --color-bg-fertilize: #e8f5e9;
    --color-bg-repot: #efebe9;
    --color-bg-light: #fff8e1;
    --border-radius: 16px;
    --shadow-card: 0 2px 8px rgba(0,0,0,0.08);
    --shadow-hover: 0 4px 16px rgba(0,0,0,0.12);
    --transition: all 0.3s ease-in-out;
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html, body, #root {
    height: 100%;
    width: 100%;
  }

  body {
    font-family: 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
    background: linear-gradient(135deg, var(--color-bg-start) 0%, var(--color-bg-end) 100%);
    background-attachment: fixed;
    color: var(--color-text);
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
  }

  a {
    text-decoration: none;
    color: inherit;
  }

  button {
    font-family: inherit;
    cursor: pointer;
    border: none;
    outline: none;
    background: none;
  }

  input, textarea, select {
    font-family: inherit;
    outline: none;
  }

  .app-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .navbar {
    padding: 16px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(46, 125, 50, 0.1);
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .navbar-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 20px;
    font-weight: 700;
    color: var(--color-primary);
  }

  .navbar-brand span {
    font-size: 28px;
  }

  .navbar-links {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .nav-link {
    padding: 8px 18px;
    border-radius: 12px;
    color: var(--color-text-light);
    font-weight: 500;
    font-size: 14px;
    transition: var(--transition);
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .nav-link:hover {
    background: rgba(46, 125, 50, 0.08);
    color: var(--color-primary);
    transform: translateY(-1px);
  }

  .nav-link.active {
    background: var(--color-primary);
    color: white;
    box-shadow: 0 2px 8px rgba(46, 125, 50, 0.3);
  }

  .main-content {
    flex: 1;
    padding: 24px;
    max-width: 1400px;
    margin: 0 auto;
    width: 100%;
  }

  .glass-card {
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-radius: var(--border-radius);
    box-shadow: var(--shadow-card);
    border: 1px solid rgba(255, 255, 255, 0.6);
  }

  .btn {
    padding: 10px 20px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    transition: var(--transition);
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .btn:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-hover);
  }

  .btn-primary {
    background: var(--color-primary);
    color: white;
  }

  .btn-primary:hover {
    background: var(--color-primary-dark);
  }

  .btn-secondary {
    background: rgba(46, 125, 50, 0.1);
    color: var(--color-primary);
  }

  .btn-secondary:hover {
    background: rgba(46, 125, 50, 0.2);
  }

  .btn-danger {
    background: rgba(244, 67, 54, 0.1);
    color: var(--color-accent-red);
  }

  .btn-danger:hover {
    background: rgba(244, 67, 54, 0.2);
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.7; transform: scale(1.05); }
  }

  @keyframes dropIn {
    0% { opacity: 0; transform: translateY(-30px); }
    60% { opacity: 1; transform: translateY(8px); }
    100% { opacity: 1; transform: translateY(0); }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @media (max-width: 768px) {
    .navbar {
      padding: 12px 16px;
      flex-direction: column;
      gap: 12px;
    }

    .main-content {
      padding: 16px;
    }
  }
`;

const Navbar: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <span>🌿</span>
        植物养护助手
      </Link>
      <div className="navbar-links">
        <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
          🏠 我的植物
        </Link>
        <Link to="/settings" className={`nav-link ${location.pathname === '/settings' ? 'active' : ''}`}>
          ⚙️ 设置
        </Link>
      </div>
    </nav>
  );
};

const App: React.FC = () => {
  return (
    <div className="app-container">
      <style>{globalStyles}</style>
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<PlantList />} />
          <Route path="/plant/:id" element={<PlantDetail />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

export default App;
