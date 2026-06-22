import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Menu, X, Camera } from 'lucide-react';

const navLinks = [
  { path: '/', label: '作品集' },
  { path: '/booking', label: '预约拍摄' },
  { path: '/admin/upload', label: '作品管理' },
  { path: '/admin/dashboard', label: '数据统计' }
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <NavLink to="/" className="navbar-brand" onClick={() => setMenuOpen(false)}>
          <Camera size={28} color="#D4AF37" />
          <span>光匣</span>
        </NavLink>

        <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          {navLinks.map(link => (
            <NavLink
              key={link.path}
              to={link.path}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `nav-link ${isActive || location.pathname === link.path ? 'active' : ''}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        <button
          className="navbar-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="菜单"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      <style>{`
        .navbar {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(249, 249, 249, 0.9);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border-bottom: 1px solid var(--color-border);
        }
        .navbar-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 68px;
        }
        .navbar-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          font-family: var(--font-display);
          font-size: 22px;
          font-weight: 700;
          color: var(--color-primary);
        }
        .navbar-links {
          display: flex;
          gap: 8px;
        }
        .nav-link {
          padding: 8px 18px;
          border-radius: var(--radius-sm);
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          color: var(--color-primary);
          transition: all var(--transition);
        }
        .nav-link:hover {
          background: rgba(212, 175, 55, 0.1);
          color: var(--color-accent);
        }
        .nav-link.active {
          background: var(--color-accent);
          color: #fff;
        }
        .navbar-toggle {
          display: none;
          padding: 8px;
          border-radius: var(--radius-sm);
          color: var(--color-primary);
        }
        @media (max-width: 768px) {
          .navbar-links {
            position: fixed;
            top: 68px;
            right: 0;
            bottom: 0;
            width: 240px;
            flex-direction: column;
            background: #fff;
            padding: 20px;
            gap: 4px;
            box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1);
            transform: translateX(100%);
            transition: transform var(--transition);
          }
          .navbar-links.open {
            transform: translateX(0);
          }
          .nav-link {
            padding: 12px 16px;
          }
          .navbar-toggle {
            display: flex;
          }
        }
      `}</style>
    </nav>
  );
}
