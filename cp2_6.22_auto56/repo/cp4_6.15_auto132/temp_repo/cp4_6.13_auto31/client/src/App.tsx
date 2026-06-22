import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import HomePage from './pages/HomePage'
import CreateExhibition from './pages/CreateExhibition'
import ExhibitionEditor from './components/ExhibitionEditor'
import ExhibitionViewer from './components/ExhibitionViewer'
import ExhibitDetail from './pages/ExhibitDetail'
import AdminPanel from './pages/AdminPanel'
import './App.css'

function App() {
  return (
    <Router>
      <div className="app-container">
        <header className="app-header glass-panel">
          <Link to="/" className="logo">
            <span className="logo-icon">🖼️</span>
            <span className="logo-text">虚拟展览馆</span>
          </Link>
          <nav className="nav-links">
            <Link to="/" className="nav-link">首页</Link>
            <Link to="/create" className="nav-link btn-primary">创建展览</Link>
          </nav>
        </header>
        <main className="app-main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/create" element={<CreateExhibition />} />
            <Route path="/edit/:id" element={<ExhibitionEditor />} />
            <Route path="/view/:id" element={<ExhibitionViewer />} />
            <Route path="/exhibit/:id" element={<ExhibitDetail />} />
            <Route path="/admin/:id" element={<AdminPanel />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
