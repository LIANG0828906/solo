import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import Marketplace from './pages/Marketplace'
import IngredientDetail from './pages/IngredientDetail'
import Profile from './pages/Profile'
import ChatList from './pages/ChatList'
import ChatPage from './pages/ChatPage'
import Login from './pages/Login'
import Publish from './pages/Publish'

const NAV_ITEMS = [
  { path: '/', label: '食材广场', icon: '🥬' },
  { path: '/publish', label: '发布', icon: '➕' },
  { path: '/chat', label: '消息', icon: '💬' },
  { path: '/profile', label: '我的', icon: '👤' },
]

function BottomNav() {
  const location = useLocation()
  const currentPath = location.pathname

  const getActivePath = (path: string) => {
    if (path === '/') return currentPath === '/'
    return currentPath.startsWith(path)
  }

  const hideNav = currentPath.startsWith('/ingredient/') || currentPath.startsWith('/chat/') || currentPath === '/login'

  if (hideNav) return null

  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={`bottom-nav__item ${getActivePath(item.path) ? 'bottom-nav__item--active' : ''}`}
        >
          <span className="bottom-nav__icon">{item.icon}</span>
          <span className="bottom-nav__label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

export default function App() {
  return (
    <div className="page-container">
      <Routes>
        <Route path="/" element={<Marketplace />} />
        <Route path="/ingredient/:id" element={<IngredientDetail />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/:id" element={<Profile />} />
        <Route path="/chat" element={<ChatList />} />
        <Route path="/chat/:id" element={<ChatPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/publish" element={<Publish />} />
      </Routes>
      <BottomNav />
    </div>
  )
}
