import { Routes, Route, NavLink } from 'react-router-dom';
import { BrowserRouter } from 'react-router-dom';
import Configurator from './pages/Configurator';
import Admin from './pages/Admin';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <nav className="top-nav">
          <div className="nav-logo">匠心皮具定制</div>
          <div className="nav-links">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''}`
              }
            >
              配置器
            </NavLink>
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''}`
              }
            >
              管理后台
            </NavLink>
          </div>
        </nav>
        <div className="page-content">
          <Routes>
            <Route path="/" element={<Configurator />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
