import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={{
      padding: '16px 0',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      marginBottom: '32px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'rgba(26, 42, 58, 0.9)',
      backdropFilter: 'blur(10px)',
    }}>
      <div className="container" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <Link to="/" style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: 'var(--accent-orange)',
          textDecoration: 'none',
        }}>
          💪 Fitness Challenge
        </Link>
        
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <Link to="/" style={linkStyle}>首页</Link>
            <Link to="/profile" style={linkStyle}>个人中心</Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img 
                src={user.avatar} 
                alt={user.nickname}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                }}
              />
              <span style={{ color: 'var(--text-secondary)' }}>{user.nickname}</span>
              <button className="btn btn-secondary" onClick={handleLogout} style={{
                padding: '8px 16px',
                fontSize: '14px',
              }}>
                退出
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '12px' }}>
            <Link to="/login" className="btn btn-secondary" style={{
              padding: '10px 24px',
              fontSize: '14px',
            }}>登录</Link>
            <Link to="/register" className="btn" style={{
              padding: '10px 24px',
              fontSize: '14px',
            }}>注册</Link>
          </div>
        )}
      </div>
    </nav>
  );
};

const linkStyle: React.CSSProperties = {
  color: 'var(--text-secondary)',
  textDecoration: 'none',
  fontWeight: 500,
  transition: 'color 0.3s ease',
};

export default Navbar;
