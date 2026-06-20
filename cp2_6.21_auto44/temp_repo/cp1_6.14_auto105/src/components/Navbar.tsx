import { NavLink } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <span className="navbar-logo-icon">🌍</span>
        <span>旅行足迹</span>
      </div>
      <div className="navbar-nav">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `navbar-link${isActive ? ' active' : ''}`
          }
        >
          地图
        </NavLink>
        <NavLink
          to="/stats"
          className={({ isActive }) =>
            `navbar-link${isActive ? ' active' : ''}`
          }
        >
          统计
        </NavLink>
      </div>
    </nav>
  )
}
