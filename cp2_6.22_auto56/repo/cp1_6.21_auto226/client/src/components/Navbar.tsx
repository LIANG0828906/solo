import React, { useState } from 'react';

interface NavbarProps {
  totalCount: number;
}

const Navbar: React.FC<NavbarProps> = ({ totalCount }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <nav className="navbar">
        <button
          className="hamburger-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="菜单"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E2E8F0" strokeWidth="2">
            {mobileMenuOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
        <div className="navbar-content">
          <span className="navbar-title">灵感收集器</span>
          <span className="navbar-count">{totalCount} 条灵感</span>
        </div>
      </nav>
      {mobileMenuOpen && (
        <div className="mobile-menu">
          <div className="mobile-menu-content">
            <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
              共收集 {totalCount} 条灵感
            </span>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
