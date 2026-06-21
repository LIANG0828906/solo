import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchText.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchText.trim())}`);
    }
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-logo" onClick={() => navigate('/')}>
          <span>🍳</span>
          <span>美味菜谱</span>
        </div>

        <form className="navbar-search" onSubmit={handleSearch}>
          <span>🔍</span>
          <input
            type="text"
            placeholder="搜索菜谱..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </form>

        <div className="navbar-right">
          <Link to="/search" style={{ fontSize: '20px', cursor: 'pointer' }}>🔍</Link>
          <Link to="/profile">
            <div className="navbar-avatar">👤</div>
          </Link>
          <div className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
            <span />
            <span />
            <span />
          </div>
        </div>
      </nav>

      {menuOpen && (
        <div className="mobile-menu">
          <Link to="/" onClick={() => setMenuOpen(false)}>首页</Link>
          <Link to="/search" onClick={() => setMenuOpen(false)}>搜索</Link>
          <Link to="/profile" onClick={() => setMenuOpen(false)}>个人中心</Link>
        </div>
      )}
    </>
  );
};
