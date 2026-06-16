import { Routes, Route, NavLink } from 'react-router-dom'
import Home from './pages/Home'
import Stats from './pages/Stats'
import Detail from './pages/Detail'
import './App.css'

function App() {
  return (
    <div className="app">
      <nav className="navbar">
        <div className="navbar-content">
          <div className="navbar-brand">
            <span className="brand-icon">🎨</span>
            <span className="brand-name">MoodMosaic</span>
          </div>
          <div className="navbar-links">
            <NavLink 
              to="/" 
              end
              className={({ isActive }) => 
                `nav-link ${isActive ? 'active' : ''}`
              }
            >
              首页
            </NavLink>
            <NavLink 
              to="/stats" 
              className={({ isActive }) => 
                `nav-link ${isActive ? 'active' : ''}`
              }
            >
              统计
            </NavLink>
          </div>
        </div>
        <div className="navbar-border" />
      </nav>
      
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/detail/:date" element={<Detail />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
