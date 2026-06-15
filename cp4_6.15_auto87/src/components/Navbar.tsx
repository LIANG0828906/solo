import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import SearchBar from './SearchBar';
import './Navbar.css';

function Navbar() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/" className="navbar-logo">
          <i className="fa-solid fa-utensils"></i>
          <span>美食食谱</span>
        </Link>
        
        {isHome && (
          <div className="navbar-search desktop-search">
            <SearchBar />
          </div>
        )}

        <button
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="菜单"
        >
          <i className={`fa-solid ${mobileMenuOpen ? 'fa-xmark' : 'fa-bars'}`}></i>
        </button>
      </div>

      {isHome && (
        <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
          <div className="mobile-search">
            <SearchBar />
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
