import { Link } from 'react-router-dom';
import { useFavorites } from '../hooks/useFavorites';

interface NavbarProps {
  currentPage: string;
}

export default function Navbar({ currentPage }: NavbarProps) {
  const { favoriteIds } = useFavorites();

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/" className="navbar-logo">
          <svg className="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
          <span>CodeSnippet</span>
        </Link>

        <div className="navbar-nav">
          <Link
            to="/"
            className={`nav-link ${currentPage === 'home' ? 'active' : ''}`}
          >
            首页
          </Link>
          <Link
            to="/favorites"
            className={`nav-link ${currentPage === 'favorites' ? 'active' : ''}`}
          >
            我的收藏
            {favoriteIds.length > 0 && (
              <span className="nav-badge">{favoriteIds.length}</span>
            )}
          </Link>
          <Link to="/add" className="nav-link nav-add-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            添加代码
          </Link>
        </div>
      </div>
    </nav>
  );
}
