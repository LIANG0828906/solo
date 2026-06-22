import { Routes, Route, Link, useLocation } from 'react-router-dom'
import Dashboard from './components/Dashboard'
import ProjectDetail from './components/ProjectDetail'
import PublicPage from './components/PublicPage'

function Navbar() {
  const location = useLocation()
  const isPublicPage = location.pathname.startsWith('/public/')
  
  if (isPublicPage) {
    return null
  }
  
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-title">🎨 创意市集项目管理器</Link>
    </nav>
  )
}

function App() {
  const location = useLocation()
  
  return (
    <>
      <Navbar />
      <main className={location.pathname.startsWith('/public/') ? '' : 'main-content'}>
        <div key={location.pathname} className="page-transition">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/project/:id" element={<ProjectDetail />} />
            <Route path="/public/:projectId" element={<PublicPage />} />
          </Routes>
        </div>
      </main>
    </>
  )
}

export default App
