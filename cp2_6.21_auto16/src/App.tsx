import { Routes, Route, Link } from 'react-router-dom';
import { useState } from 'react';
import Home from '@/pages/Home';
import DetailPage from '@/pages/DetailPage';
import useAuthStore from '@/store/useAuthStore';

function Navbar() {
  const { user, isLoggedIn, login } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="auction-hammer-icon"
          >
            <path
              d="M13.5 6L16.5 3L21 7.5L18 10.5L13.5 6Z"
              fill="#3e2723"
              stroke="#3e2723"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path
              d="M12 7.5L16.5 12L10.5 18L6 13.5L12 7.5Z"
              fill="#3e2723"
              stroke="#3e2723"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path
              d="M10 18.5L5.5 21"
              stroke="#3e2723"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M14.5 14L10 18.5"
              stroke="#3e2723"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <span className="app-name">ArtBid</span>
        </Link>

        <div className="navbar-right desktop-menu">
          {!isLoggedIn ? (
            <button
              className="login-btn"
              onClick={() => login('artlover')}
            >
              登录
            </button>
          ) : (
            <div className="user-info">
              <div className="wallet-balance">
                <span className="wallet-label">余额</span>
                <span className="wallet-amount">¥{user?.wallet?.toLocaleString()}</span>
              </div>
              <div className="user-profile">
                <img
                  src={user?.avatar}
                  alt={user?.username}
                  className="user-avatar"
                />
                <span className="username">{user?.username}</span>
              </div>
            </div>
          )}
        </div>

        <button
          className="hamburger-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="mobile-menu">
          {!isLoggedIn ? (
            <button
              className="login-btn mobile-login-btn"
              onClick={() => {
                login('artlover');
                setMobileMenuOpen(false);
              }}
            >
              登录
            </button>
          ) : (
            <div className="mobile-user-info">
              <div className="user-profile">
                <img
                  src={user?.avatar}
                  alt={user?.username}
                  className="user-avatar"
                />
                <span className="username">{user?.username}</span>
              </div>
              <div className="wallet-balance">
                <span className="wallet-label">余额</span>
                <span className="wallet-amount">¥{user?.wallet?.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

export default function App() {
  return (
    <div className="app-root">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auction/:id" element={<DetailPage />} />
        </Routes>
      </main>
    </div>
  );
}
