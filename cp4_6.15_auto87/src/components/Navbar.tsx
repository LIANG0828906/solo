import { Link, useLocation } from 'react-router-dom';
import SearchBar from './SearchBar';
import './Navbar.css';

function Navbar() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/" className="navbar-logo">
          <i className="fa-solid fa-utensils"></i>
          <span>美食食谱</span>
        </Link>
        {isHome && (
          <div className="navbar-search">
            <SearchBar />
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
