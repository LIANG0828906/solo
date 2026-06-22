import React from 'react';
import { NavLink } from 'react-router-dom';
import './Navbar.css';

const Navbar: React.FC = () => {
  return (
    <nav className="navbar">
      <div className="container navbar-container">
        <NavLink to="/" className="navbar-logo">
          <span className="logo-icon">🎨</span>
          <span className="logo-text">PaletteHub</span>
        </NavLink>
        <div className="navbar-links">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `nav-link ${isActive ? 'active' : ''}`
            }
            end
          >
            探索
          </NavLink>
          <NavLink
            to="/create"
            className={({ isActive }) =>
              `nav-link create-btn ${isActive ? 'active' : ''}`
            }
          >
            + 创建色卡
          </NavLink>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
