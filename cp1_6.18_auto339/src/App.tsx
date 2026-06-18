import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'
import { BookOpen, Search, User, LogOut, Home, Plus } from 'lucide-react'
import { useAuthStore } from './stores/authStore'
import HomePage from './pages/HomePage'
import BookListPage from './pages/BookListPage'
import SearchPage from './pages/SearchPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-[#3E2723] text-[#F5F0E1] sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold">
          <BookOpen size={28} />
          <span>书旅驿站</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
              location.pathname === '/' ? 'bg-[#5D4037]' : 'hover:bg-[#5D4037]'
            }`}
          >
            <Home size={18} />
            <span className="hidden sm:inline">首页</span>
          </Link>
          <Link
            to="/search"
            className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
              location.pathname === '/search' ? 'bg-[#5D4037]' : 'hover:bg-[#5D4037]'
            }`}
          >
            <Search size={18} />
            <span className="hidden sm:inline">搜索</span>
          </Link>
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <span className="hidden md:inline text-sm text-[#D7CCC8]">
                你好，{user?.username}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-[#5D4037] transition-colors"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">退出</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-[#5D4037] transition-colors"
              >
                <User size={18} />
                <span>登录</span>
              </Link>
              <Link
                to="/register"
                className="flex items-center gap-1 px-4 py-2 rounded-lg bg-[#4ECDC4] text-[#3E2723] font-medium hover:bg-[#3DB9B0] transition-colors"
              >
                <Plus size={18} />
                <span>注册</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

function AppContent() {
  const restoreAuth = useAuthStore((s) => s.restoreAuth)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    restoreAuth()
  }, [restoreAuth])

  useEffect(() => {
    const protectedRoutes = ['/', '/booklist', '/search']
    const needsAuth = protectedRoutes.some((r) => location.pathname.startsWith(r))
    if (needsAuth && !isAuthenticated && !localStorage.getItem('token')) {
      navigate('/login')
    }
  }, [isAuthenticated, location.pathname, navigate])

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F0E1]">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/booklist/:id" element={<BookListPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </main>
      <footer className="bg-[#3E2723] text-[#D7CCC8] text-center py-4 text-sm">
        © 2024 书旅驿站 · 让阅读成为一场美好的旅程
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}
