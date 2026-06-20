import { Link, useLocation } from 'react-router-dom';
import { Heart, PlusCircle, Home, ChefHat } from 'lucide-react';
import './Navbar.css';

function Navbar() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <ChefHat size={28} strokeWidth={2} />
          <span>餐桌灵感库</span>
        </Link>

        <div className="navbar-links">
          <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
            <Home size={18} />
            <span>首页</span>
          </Link>
          <Link to="/publish" className={`nav-link ${isActive('/publish') ? 'active' : ''}`}>
            <PlusCircle size={18} />
            <span>发布</span>
          </Link>
          <Link to="/favorites" className={`nav-link ${isActive('/favorites') ? 'active' : ''}`}>
            <Heart size={18} />
            <span>收藏夹</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
