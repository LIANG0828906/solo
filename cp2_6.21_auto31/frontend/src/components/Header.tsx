import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../modules/auth/AuthContext'
import './Header.css'

const Header: React.FC = () => {
  const { user, isAuthenticated, isTeacher, logout } = useAuth()
  const [showDropdown, setShowDropdown] = useState(false)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
    setShowDropdown(false)
  }

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo">
          家教平台
        </Link>

        <nav className="nav">
          <Link to="/" className="nav-link">
            首页
          </Link>
          {isAuthenticated && (
            <Link to="/my-bookings" className="nav-link">
              我的预约
            </Link>
          )}
          {isTeacher && (
            <>
              <Link to="/teacher/slots" className="nav-link">
                课时管理
              </Link>
              <Link to="/teacher/reviews" className="nav-link">
                评价管理
              </Link>
            </>
          )}
        </nav>

        <div className="user-section">
          {isAuthenticated ? (
            <div className="user-dropdown">
              <button
                className="user-avatar-btn"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <div className="user-avatar">
                  {user?.name?.charAt(0)}
                </div>
                <span className="username">{user?.name}</span>
                <span className="dropdown-arrow">▼</span>
              </button>
              {showDropdown && (
                <div className="dropdown-menu">
                  <div className="dropdown-info">
                    <p className="dropdown-name">{user?.name}</p>
                    <p className="dropdown-role">
                      {user?.role === 'teacher' ? '教师' : '家长'}
                    </p>
                  </div>
                  <button className="dropdown-item logout-btn" onClick={handleLogout}>
                    退出登录
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-login">
                登录
              </Link>
              <Link to="/register" className="btn btn-register">
                注册
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
