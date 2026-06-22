import { NavLink, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();

  return (
    <nav className="navbar">
      <span className="logo">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="6" y="0" width="4" height="3" fill="#00d9ff" />
          <rect x="5" y="3" width="6" height="2" fill="#00d9ff" />
          <rect x="5" y="5" width="4" height="3" fill="#00d9ff" />
          <rect x="2" y="6" width="3" height="2" fill="#00d9ff" />
          <rect x="9" y="5" width="3" height="2" fill="#00d9ff" />
          <rect x="4" y="8" width="3" height="4" fill="#00d9ff" />
          <rect x="9" y="7" width="3" height="4" fill="#00d9ff" />
          <rect x="2" y="12" width="3" height="4" fill="#00d9ff" />
          <rect x="10" y="11" width="3" height="4" fill="#00d9ff" />
        </svg>
        NEON PARKOUR
      </span>
      <div className="nav-links">
        <NavLink to="/editor" className={({ isActive }) => 'nav-btn' + (isActive ? ' active' : '')}>
          编辑器
        </NavLink>
        <NavLink to="/arena" className={({ isActive }) => 'nav-btn' + (isActive ? ' active' : '')}>
          竞技场
        </NavLink>
        <NavLink to="/leaderboard" className={({ isActive }) => 'nav-btn' + (isActive ? ' active' : '')}>
          排行榜
        </NavLink>
      </div>
    </nav>
  );
}
