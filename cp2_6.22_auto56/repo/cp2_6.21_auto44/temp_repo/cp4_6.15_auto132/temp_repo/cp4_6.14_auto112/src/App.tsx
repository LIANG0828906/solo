import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import PlantListPage from '@/pages/PlantListPage'
import PlantDetailPage from '@/pages/PlantDetailPage'
import DashboardPage from '@/pages/DashboardPage'
import { Leaf, Activity } from 'lucide-react'

function NavBar() {
  const location = useLocation()
  return (
    <nav
      style={{ height: 56, background: '#166534', borderRadius: 0 }}
      className="flex items-center px-6 sticky top-0 z-50"
    >
      <Link to="/" className="flex items-center gap-2 text-white no-underline mr-8">
        <Leaf size={24} />
        <span className="text-lg font-semibold">绿植管家</span>
      </Link>
      <div className="flex items-center gap-6">
        <Link
          to="/"
          className={`flex items-center gap-1.5 no-underline text-sm font-medium transition-colors ${
            location.pathname === '/' ? 'text-white' : 'text-green-200 hover:text-white'
          }`}
        >
          <Leaf size={16} />
          我的植物
        </Link>
        <Link
          to="/dashboard"
          className={`flex items-center gap-1.5 no-underline text-sm font-medium transition-colors ${
            location.pathname === '/dashboard' ? 'text-white' : 'text-green-200 hover:text-white'
          }`}
        >
          <Activity size={16} />
          健康看板
        </Link>
      </div>
    </nav>
  )
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen" style={{ background: '#f0fdf4' }}>
        <NavBar />
        <Routes>
          <Route path="/" element={<PlantListPage />} />
          <Route path="/plant/:id" element={<PlantDetailPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </div>
    </Router>
  )
}
