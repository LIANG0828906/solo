import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { useEffect } from 'react'
import { useOKRStore } from './store/okrStore'
import OKRBoard from './pages/OKRBoard'
import MilestoneGantt from './pages/MilestoneGantt'

const logoSvg = (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="14" stroke="#6366f1" strokeWidth="2.5" />
    <circle cx="16" cy="16" r="8" stroke="#6366f1" strokeWidth="2.5" />
    <circle cx="16" cy="16" r="2.5" fill="#6366f1" />
  </svg>
)

function App() {
  const { initSocket, disconnectSocket, toasts, removeToast } = useOKRStore()

  useEffect(() => {
    initSocket()
    return () => { disconnectSocket() }
  }, [])

  return (
    <BrowserRouter>
      <div className="app-layout">
        <aside className="sidebar">
          <div className="sidebar-logo">
            {logoSvg}
            <span>OKR 看板</span>
          </div>
          <nav className="sidebar-nav">
            <NavLink to="/" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} end>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/></svg>
              OKR 看板
            </NavLink>
            <NavLink to="/gantt" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="3" width="16" height="2" rx="1" fill="currentColor" opacity="0.3"/><rect x="2" y="9" width="12" height="2" rx="1" fill="currentColor" opacity="0.3"/><rect x="2" y="15" width="8" height="2" rx="1" fill="currentColor" opacity="0.3"/><rect x="5" y="2" width="6" height="4" rx="1" fill="#6366f1"/><rect x="3" y="8" width="8" height="4" rx="1" fill="#6366f1" opacity="0.7"/><rect x="2" y="14" width="5" height="4" rx="1" fill="#6366f1" opacity="0.5"/></svg>
              里程碑甘特图
            </NavLink>
          </nav>
        </aside>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<OKRBoard />} />
            <Route path="/gantt" element={<MilestoneGantt />} />
          </Routes>
        </main>
      </div>
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className="toast">
            <svg className="toast-ring" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" fill="none" stroke="#4338ca" strokeWidth="2" opacity="0.3" />
              <circle cx="12" cy="12" r="9" fill="none" stroke="#6366f1" strokeWidth="2" strokeDasharray="56.55" strokeDashoffset="0" style={{ animation: 'toastRing 3s linear forwards', transformOrigin: 'center', transform: 'rotate(-90deg)' }} />
            </svg>
            {toast.message}
          </div>
        ))}
      </div>
    </BrowserRouter>
  )
}

export default App
