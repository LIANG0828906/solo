import React from 'react';
import { NavLink } from 'react-router-dom';

export const Navbar: React.FC = () => {
  return (
    <nav className="nav-bar">
      <div className="nav-content">
        <div className="nav-logo">🍳 配方魔方</div>
        <ul className="nav-links">
          <li>
            <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
              首页
            </NavLink>
          </li>
          <li>
            <NavLink to="/add" className={({ isActive }) => (isActive ? 'active' : '')}>
              添加食谱
            </NavLink>
          </li>
          <li>
            <NavLink to="/shopping" className={({ isActive }) => (isActive ? 'active' : '')}>
              购物清单
            </NavLink>
          </li>
        </ul>
      </div>
    </nav>
  );
};
