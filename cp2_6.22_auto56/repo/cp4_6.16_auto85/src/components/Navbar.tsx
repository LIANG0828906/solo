import { Link, useLocation } from 'react-router-dom';
import { Leaf, Plus, Menu } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';

const navLinks = [
  { to: '/', label: '市场' },
  { to: '/exchange', label: '交换' },
  { to: '/history', label: '历史' },
  { to: '/profile', label: '个人' },
];

export default function Navbar() {
  const location = useLocation();
  const mobileMenuOpen = useUIStore((s) => s.mobileMenuOpen);
  const toggleMobileMenu = useUIStore((s) => s.toggleMobileMenu);

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/" className="navbar-brand">
          <Leaf size={24} />
          <span>CraftSwap</span>
        </Link>

        <div className="navbar-links">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`navbar-link${location.pathname === link.to ? ' active' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <Link to="/publish" className="btn btn-primary">
          <Plus size={18} />
          发布材料
        </Link>

        <button className="mobile-menu-btn" onClick={toggleMobileMenu}>
          <Menu size={24} />
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="mobile-nav">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`navbar-link${location.pathname === link.to ? ' active' : ''}`}
              onClick={toggleMobileMenu}
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/publish"
            className="btn btn-primary"
            onClick={toggleMobileMenu}
          >
            <Plus size={18} />
            发布材料
          </Link>
        </div>
      )}
    </nav>
  );
}
