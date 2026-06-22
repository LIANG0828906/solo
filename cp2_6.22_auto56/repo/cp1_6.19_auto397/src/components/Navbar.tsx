import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar: React.FC = () => {
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo" title="首页">
        <span role="img" aria-label="logo">😊</span>
      </Link>
      <div className="navbar-right">
        <Link to="/maker" className="navbar-make-btn ripple-btn">
          ✏️ 制作
        </Link>
        <button className="navbar-auth-btn ripple-btn">
          登录 / 注册
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
