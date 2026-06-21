import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import SearchBox from '@/SearchBox'
import './Navbar.css'

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    setShowUserMenu(false)
    navigate('/')
  }

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/" className="logo">
          <span className="logo-icon">🍳</span>
          <span className="logo-text">美食工坊</span>
        </Link>

        <div className="navbar-search">
          <SearchBox placeholder="搜索食谱、食材..." />
        </div>

        <div className="navbar-actions">
          <Link to="/search" className="nav-link ingredient-match-link">
            <span>🥗</span>
            <span>食材反查</span>
          </Link>

          {isAuthenticated ? (
            <>
              <Link to="/create" className="create-recipe-btn">
                + 创建食谱
              </Link>

              <div className="user-menu-container">
                <button
                  className="user-avatar-btn"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <img
                    src={user?.avatar}
                    alt={user?.username}
                    className="user-avatar"
                  />
                </button>

                {showUserMenu && (
                  <div className="user-dropdown">
                    <div className="user-dropdown-header">
                      <img
                        src={user?.avatar}
                        alt={user?.username}
                        className="dropdown-avatar"
                      />
                      <div>
                        <div className="dropdown-username">{user?.username}</div>
                      </div>
                    </div>
                    <div className="dropdown-divider" />
                    <Link
                      to="/favorites"
                      className="dropdown-item"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <span>❤️</span>
                      <span>我的收藏</span>
                    </Link>
                    <Link
                      to="/profile"
                      className="dropdown-item"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <span>👤</span>
                      <span>个人中心</span>
                    </Link>
                    <div className="dropdown-divider" />
                    <button className="dropdown-item logout-item" onClick={handleLogout}>
                      <span>🚪</span>
                      <span>退出登录</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="login-btn">
                登录
              </Link>
              <Link to="/register" className="register-btn">
                注册
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
