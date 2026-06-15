import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { clearAuth, getToken } from '../utils/auth'

interface NavbarProps {
  isLoggedIn: boolean
}

function Navbar({ isLoggedIn }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigate = useNavigate()

  const handleLogout = () => {
    clearAuth()
    setMobileMenuOpen(false)
    navigate('/')
    window.location.reload()
  }

  const navLinks = [
    { path: '/', label: '首页', end: true },
    { path: '/create', label: '创建胶囊', requireAuth: true },
    { path: '/capsules', label: '我的胶囊', requireAuth: true },
    { path: '/drift', label: '漂流收件箱', requireAuth: true },
  ]

  return (
    <>
      <nav className="navbar">
        <NavLink to="/" className="navbar-brand" onClick={() => setMobileMenuOpen(false)}>
          ✨ 时间胶囊
        </NavLink>

        <div className="navbar-links">
          {navLinks.map(link => {
            if (link.requireAuth && !isLoggedIn) return null
            return (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.end}
                className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
              >
                {link.label}
              </NavLink>
            )
          })}
          {isLoggedIn ? (
            <span className="navbar-link" onClick={handleLogout} style={{ cursor: 'pointer' }}>
              退出
            </span>
          ) : (
            <NavLink to="/login" className="navbar-link">
              登录
            </NavLink>
          )}
        </div>

        <div className="hamburger" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          <span style={{ transform: mobileMenuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
          <span style={{ opacity: mobileMenuOpen ? 0 : 1 }} />
          <span style={{ transform: mobileMenuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
        </div>
      </nav>

      <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        {navLinks.map(link => {
          if (link.requireAuth && !isLoggedIn) return null
          return (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.end}
              className={({ isActive }) => `mobile-menu-link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </NavLink>
          )
        })}
        {isLoggedIn ? (
          <div className="mobile-menu-link" onClick={handleLogout}>
            退出登录
          </div>
        ) : (
          <NavLink to="/login" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>
            登录 / 注册
          </NavLink>
        )}
      </div>
    </>
  )
}

export default Navbar
