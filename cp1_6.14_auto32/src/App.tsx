import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom'
import { Home as HomeIcon, PlusCircle, User } from 'lucide-react'
import Home from '@/pages/Home'
import ItemDetail from '@/pages/ItemDetail'
import Publish from '@/pages/Publish'
import Profile from '@/pages/Profile'
import CreditProfile from '@/pages/CreditProfile'

const navItems = [
  { to: '/', label: '首页', icon: HomeIcon, end: true },
  { to: '/publish', label: '发布', icon: PlusCircle, end: true },
  { to: '/profile', label: '我的', icon: User, end: false },
]

export default function App() {
  return (
    <Router>
      <nav className="sticky top-0 z-50 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary">旧物交换</span>
          </div>
          <div className="flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-gray-600 hover:text-primary'
                  }`
                }
              >
                <Icon size={18} />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </nav>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/item/:id" element={<ItemDetail />} />
          <Route path="/publish" element={<Publish />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:userId" element={<CreditProfile />} />
        </Routes>
      </main>
    </Router>
  )
}
