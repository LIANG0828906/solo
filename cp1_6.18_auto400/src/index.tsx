import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import store from './store/store'
import CreatePage from './pages/CreatePage'
import HistoryPage from './pages/HistoryPage'
import './styles/global.css'

function NavBar() {
  return (
    <nav className="nav-bar">
      <div className="nav-logo">诗镜</div>
      <div className="nav-links">
        <NavLink 
          to="/create" 
          className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
        >
          创作
        </NavLink>
        <NavLink 
          to="/history" 
          className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
        >
          历史
        </NavLink>
      </div>
    </nav>
  )
}

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <NavBar />
        <div className="page-container">
          <Routes>
            <Route path="/" element={<Navigate to="/create" replace />} />
            <Route path="/create" element={<CreatePage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="*" element={<Navigate to="/create" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </Provider>
  )
}

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
