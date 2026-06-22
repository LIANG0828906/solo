import { NavLink, useLocation } from 'react-router-dom';
import { ScrollText, Package, Palette, Home } from 'lucide-react';

export function Navbar() {
  const location = useLocation();
  const isDetailPage = location.pathname.startsWith('/product/');

  return (
    <>
      <nav className={`navbar ${isDetailPage ? 'detail-navbar' : ''}`}>
        <div className="navbar-inner">
          <div className="navbar-logo">
            <Palette size={24} />
            <span>匠人工坊</span>
          </div>
          <div className="navbar-links">
            <NavLink to="/showcase" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Palette size={18} />
              <span>作品展示架</span>
            </NavLink>
            <NavLink to="/timeline" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <ScrollText size={18} />
              <span>创作记录</span>
            </NavLink>
            <NavLink to="/materials" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Package size={18} />
              <span>材料库存</span>
            </NavLink>
          </div>
        </div>
      </nav>
      <nav className="mobile-tabbar">
        <NavLink to="/showcase" className={({ isActive }) => `tab-item ${isActive ? 'active' : ''}`}>
          <Palette size={22} />
          <span>展示架</span>
        </NavLink>
        <NavLink to="/timeline" className={({ isActive }) => `tab-item ${isActive ? 'active' : ''}`}>
          <ScrollText size={22} />
          <span>创作记录</span>
        </NavLink>
        <NavLink to="/materials" className={({ isActive }) => `tab-item ${isActive ? 'active' : ''}`}>
          <Package size={22} />
          <span>材料</span>
        </NavLink>
      </nav>
    </>
  );
}
