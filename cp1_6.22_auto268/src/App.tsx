import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom'
import { LayoutGrid, RefreshCw, Wheat } from 'lucide-react'
import Dashboard from '@/pages/Dashboard'
import Rotation from '@/pages/Rotation'
import Harvest from '@/pages/Harvest'

const navItems = [
  { to: '/', label: '菜园概览', icon: LayoutGrid },
  { to: '/rotation', label: '轮作推荐', icon: RefreshCw },
  { to: '/harvest', label: '收成记录', icon: Wheat },
]

export default function App() {
  return (
    <Router>
      <div className="min-h-screen" style={{ background: '#F5F5DC' }}>
        <header
          className="fixed top-0 left-0 right-0 z-50 flex items-center px-6"
          style={{
            height: 56,
            background: '#4A6741',
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">🌿</span>
            <h1 className="text-white text-base font-bold tracking-wide">城市农夫 · 屋顶菜园</h1>
          </div>
          <nav className="ml-10 flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`
                }
              >
                <Icon size={14} />
                {label}
              </NavLink>
            ))}
          </nav>
        </header>

        <main
          className="pt-[56px]"
          style={{ minWidth: 1024 }}
        >
          <div className="max-w-[1400px] mx-auto px-6 py-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/rotation" element={<Rotation />} />
              <Route path="/harvest" element={<Harvest />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  )
}
