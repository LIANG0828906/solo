import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

interface MenuItem {
  to: string;
  label: string;
  icon: string;
}

const menuItems: MenuItem[] = [
  { to: '/recipes', label: '食谱列表', icon: '📖' },
  { to: '/recipes/new', label: '新建食谱', icon: '✨' },
  { to: '/calendar', label: '饮食日历', icon: '📅' },
  { to: '/profile', label: '个人中心', icon: '👤' },
];

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeMenu();
    }
  };

  return (
    <>
      <nav className="navbar" role="navigation" aria-label="主导航">
        <NavLink to="/recipes" className="navbar-brand" onClick={closeMenu}>
          创意食谱管家
        </NavLink>

        <div className="navbar-links">
          {menuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-btn${isActive ? ' active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        <button
          type="button"
          className={`hamburger-btn${isMenuOpen ? ' open' : ''}`}
          onClick={toggleMenu}
          aria-label={isMenuOpen ? '关闭菜单' : '打开菜单'}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-menu"
          onKeyDown={handleKeyDown}
        >
          <span className="hamburger-line" aria-hidden="true" />
          <span className="hamburger-line" aria-hidden="true" />
          <span className="hamburger-line" aria-hidden="true" />
        </button>
      </nav>

      <div
        className={`menu-overlay${isMenuOpen ? ' visible' : ''}`}
        onClick={closeMenu}
        aria-hidden="true"
      />

      <aside
        id="mobile-menu"
        className={`side-menu${isMenuOpen ? ' open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="移动端导航菜单"
        onKeyDown={handleKeyDown}
      >
        <div className="side-menu-header">
          <span className="side-menu-title">菜单</span>
          <button
            type="button"
            className="side-menu-close"
            onClick={closeMenu}
            aria-label="关闭菜单"
          >
            ✕
          </button>
        </div>
        <ul className="side-menu-list">
          {menuItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `side-menu-item${isActive ? ' active' : ''}`
                }
                onClick={closeMenu}
              >
                <span className="menu-item-icon" aria-hidden="true">
                  {item.icon}
                </span>
                <span className="menu-item-label">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </aside>
    </>
  );
};

export default Navbar;
