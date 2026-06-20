import { NavLink } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="navbar">
      <NavLink to="/recipes" className="navbar-brand">
        创意食谱管家
      </NavLink>
      <div className="navbar-links">
        <NavLink
          to="/recipes/new"
          className={({ isActive }) => `nav-btn${isActive ? ' active' : ''}`}
        >
          新建食谱
        </NavLink>
        <NavLink
          to="/calendar"
          className={({ isActive }) => `nav-btn${isActive ? ' active' : ''}`}
        >
          饮食日历
        </NavLink>
        <NavLink
          to="/profile"
          className={({ isActive }) => `nav-btn${isActive ? ' active' : ''}`}
        >
          个人中心
        </NavLink>
      </div>
    </nav>
  );
};

export default Navbar;
