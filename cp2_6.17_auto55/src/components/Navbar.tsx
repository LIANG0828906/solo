import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../store';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <>
      <nav className="navbar">
        <Link to="/browse" className="nav-link" style={{ fontSize: '20px', fontWeight: 'bold' }}>
          BookNook
        </Link>

        <div className="nav-links">
          <Link
            to="/browse"
            className={`nav-link ${isActive('/browse') ? 'active' : ''}`}
          >
            浏览
          </Link>
          {currentUser && (
            <Link
              to={`/profile/${currentUser.username}`}
              className={`nav-link ${isActive('/profile') ? 'active' : ''}`}
            >
              我的主页
            </Link>
          )}
        </div>

        <button
          className="hamburger-btn"
          onClick={() => setShowMobileMenu(!showMobileMenu)}
        >
          {showMobileMenu ? '✕' : '☰'}
        </button>

        <div className="nav-user">
          {currentUser ? (
            <>
              <div
                className="avatar-sm"
                style={{ background: currentUser.avatarColor }}
                onClick={() => setShowDropdown(!showDropdown)}
              >
                {currentUser.username.charAt(0).toUpperCase()}
              </div>
              {showDropdown && (
                <div className="dropdown-menu">
                  <Link
                    to={`/profile/${currentUser.username}`}
                    className="dropdown-item"
                    onClick={() => setShowDropdown(false)}
                  >
                    个人主页
                  </Link>
                  <div className="dropdown-item" onClick={handleLogout}>
                    退出登录
                  </div>
                </div>
              )}
            </>
          ) : (
            <Link to="/login" className="nav-link">
              登录
            </Link>
          )}
        </div>
      </nav>

      {showMobileMenu && (
        <div className="mobile-menu">
          <Link
            to="/browse"
            className="nav-link"
            onClick={() => setShowMobileMenu(false)}
          >
            浏览
          </Link>
          {currentUser && (
            <Link
              to={`/profile/${currentUser.username}`}
              className="nav-link"
              onClick={() => setShowMobileMenu(false)}
            >
              我的主页
            </Link>
          )}
          {currentUser ? (
            <div
              className="nav-link"
              onClick={() => {
                handleLogout();
                setShowMobileMenu(false);
              }}
            >
              退出登录
            </div>
          ) : (
            <Link
              to="/login"
              className="nav-link"
              onClick={() => setShowMobileMenu(false)}
            >
              登录
            </Link>
          )}
        </div>
      )}
    </>
  );
};

export default Navbar;
