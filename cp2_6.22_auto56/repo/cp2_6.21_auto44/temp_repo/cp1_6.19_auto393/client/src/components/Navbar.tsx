import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, ArrowLeft, RefreshCw } from 'lucide-react';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogoClick = () => {
    navigate('/');
  };

  const handleExchangesClick = () => {
    navigate('/exchanges');
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  const isHomePage = location.pathname === '/';

  return (
    <nav className="navbar">
      <div className="navbar-logo" onClick={handleLogoClick}>
        <BookOpen size={28} />
        <span>书友</span>
      </div>
      <div className="navbar-actions">
        {!isHomePage && (
          <button className="btn btn-back" onClick={handleBackClick}>
            <ArrowLeft size={16} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            返回
          </button>
        )}
        <button className="btn btn-nav" onClick={handleExchangesClick}>
          <RefreshCw size={16} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
          我的交换
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
