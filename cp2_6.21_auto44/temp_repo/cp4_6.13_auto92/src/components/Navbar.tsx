import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav style={{
      background: '#fff',
      borderBottom: '2px solid #8B5E3C',
      padding: '16px 0',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 2px 8px rgba(139, 94, 60, 0.1)',
    }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: '#E67E22',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '20px',
            fontWeight: 'bold',
          }}>
            手
          </div>
          <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#E67E22' }}>手工坊社区</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link to="/" style={{
            color: '#333',
            fontSize: '16px',
            padding: '8px 16px',
            borderRadius: '8px',
            transition: 'background 0.2s',
          }}>
            课程墙
          </Link>
          {user ? (
            <>
              <Link to="/dashboard" style={{
                color: '#333',
                fontSize: '16px',
                padding: '8px 16px',
                borderRadius: '8px',
                transition: 'background 0.2s',
              }}>
                {user.role === 'instructor' ? '我的管理' : '个人中心'}
              </Link>
              <span style={{ color: '#666', fontSize: '14px' }}>
                你好, {user.username}
                {user.role === 'instructor' && (
                  <span style={{
                    background: '#8B5E3C',
                    color: '#fff',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    marginLeft: '8px',
                  }}>手工艺人</span>
                )}
              </span>
              <button onClick={handleLogout} style={{
                background: 'transparent',
                color: '#E74C3C',
                fontSize: '14px',
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid #E74C3C',
              }}>
                退出登录
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={{
                color: '#E67E22',
                fontSize: '16px',
                padding: '8px 16px',
                borderRadius: '8px',
              }}>
                登录
              </Link>
              <Link to="/register" style={{
                background: '#E67E22',
                color: '#fff',
                fontSize: '16px',
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: '500',
              }}>
                注册
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
