import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Publish from './Publish';
import { categoryLabels } from './types';

interface NavbarProps {
  onCategoryChange?: (category: string) => void;
  currentCategory?: string;
}

const Navbar: React.FC<NavbarProps> = ({ onCategoryChange, currentCategory = '' }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showPublish, setShowPublish] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split('')
      .filter((char) => char.match(/[a-zA-Z\u4e00-\u9fa5]/))
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setShowMobileMenu(false);
  };

  const handlePublishClick = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setShowPublish(true);
    setShowMobileMenu(false);
  };

  const handleCategorySelect = (category: string) => {
    if (onCategoryChange) {
      onCategoryChange(category);
    }
    setShowCategoryDropdown(false);
    setShowMobileMenu(false);
  };

  return (
    <>
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '70px',
          background: 'linear-gradient(135deg, #D2A679 0%, #C4956A 100%)',
          borderBottom: '2px solid #8B4513',
          boxShadow: '0 2px 10px rgba(92, 51, 23, 0.2)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link
            to="/"
            style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#5C3317',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span style={{ fontSize: '28px' }}>🎸</span>
            <span>乐器跳蚤市场</span>
          </Link>

          <button
            onClick={handlePublishClick}
            style={{
              background: '#FF8C00',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '600',
              boxShadow: '0 2px 8px rgba(255, 140, 0, 0.4)',
              display: 'none',
            }}
            className="desktop-only"
          >
            + 发布乐器
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }} className="desktop-only">
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              style={{
                background: '#FFF8DC',
                color: '#5C3317',
                padding: '10px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                border: '1px solid #8B4513',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {currentCategory ? categoryLabels[currentCategory] || '全部分类' : '全部分类'}
              <span style={{ fontSize: '12px' }}>▼</span>
            </button>

            {showCategoryDropdown && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  background: '#FFF8DC',
                  border: '1px solid #8B4513',
                  borderRadius: '8px',
                  boxShadow: '0 4px 16px rgba(92, 51, 23, 0.2)',
                  overflow: 'hidden',
                  minWidth: '140px',
                }}
              >
                <button
                  onClick={() => handleCategorySelect('')}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    textAlign: 'left',
                    background: 'transparent',
                    color: '#5C3317',
                    fontSize: '14px',
                    borderBottom: '1px solid #DEB887',
                  }}
                >
                  全部分类
                </button>
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => handleCategorySelect(key)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      textAlign: 'left',
                      background: currentCategory === key ? '#FFE4B5' : 'transparent',
                      color: '#5C3317',
                      fontSize: '14px',
                      borderBottom: key !== 'drum-kit' ? '1px solid #DEB887' : 'none',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Link
                to={`/profile/${user.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#5C3317',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #FF8C00 0%, #FF6B00 100%)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    border: '2px solid #8B4513',
                  }}
                >
                  {getInitials(user.nickname)}
                </div>
                <span style={{ fontSize: '14px', fontWeight: '500' }}>{user.nickname}</span>
              </Link>
              <button
                onClick={handleLogout}
                style={{
                  background: 'transparent',
                  color: '#5C3317',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  border: '1px solid #8B4513',
                }}
              >
                退出
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              style={{
                background: '#FF8C00',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
              }}
            >
              登录 / 注册
            </Link>
          )}
        </div>

        <button
          className="mobile-only"
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          style={{
            display: 'none',
            background: 'transparent',
            color: '#5C3317',
            fontSize: '24px',
            padding: '8px',
          }}
        >
          ☰
        </button>
      </nav>

      {showMobileMenu && (
        <div
          className="mobile-only"
          style={{
            position: 'fixed',
            top: '70px',
            left: 0,
            right: 0,
            background: '#FFF8DC',
            borderBottom: '2px solid #8B4513',
            padding: '16px',
            zIndex: 999,
            display: 'none',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <button
            onClick={handlePublishClick}
            style={{
              background: '#FF8C00',
              color: 'white',
              padding: '14px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              height: '48px',
            }}
          >
            + 发布乐器
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '14px', color: '#8B4513', fontWeight: '600' }}>分类筛选</div>
            <button
              onClick={() => handleCategorySelect('')}
              style={{
                padding: '12px',
                textAlign: 'left',
                background: currentCategory === '' ? '#FFE4B5' : '#FFF8DC',
                border: '1px solid #DEB887',
                borderRadius: '6px',
                height: '48px',
                fontSize: '15px',
              }}
            >
              全部分类
            </button>
            {Object.entries(categoryLabels).map(([key, label]) => (
              <button
                key={key}
                onClick={() => handleCategorySelect(key)}
                style={{
                  padding: '12px',
                  textAlign: 'left',
                  background: currentCategory === key ? '#FFE4B5' : '#FFF8DC',
                  border: '1px solid #DEB887',
                  borderRadius: '6px',
                  height: '48px',
                  fontSize: '15px',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {user ? (
            <>
              <Link
                to={`/profile/${user.id}`}
                onClick={() => setShowMobileMenu(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  background: '#FFE4B5',
                  borderRadius: '8px',
                  height: '48px',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #FF8C00 0%, #FF6B00 100%)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                  }}
                >
                  {getInitials(user.nickname)}
                </div>
                <span style={{ fontSize: '15px' }}>{user.nickname}</span>
              </Link>
              <button
                onClick={handleLogout}
                style={{
                  background: 'transparent',
                  color: '#5C3317',
                  padding: '12px',
                  border: '1px solid #8B4513',
                  borderRadius: '8px',
                  height: '48px',
                  fontSize: '15px',
                }}
              >
                退出登录
              </button>
            </>
          ) : (
            <Link
              to="/login"
              onClick={() => setShowMobileMenu(false)}
              style={{
                background: '#FF8C00',
                color: 'white',
                padding: '14px',
                borderRadius: '8px',
                textAlign: 'center',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                fontWeight: '600',
              }}
            >
              登录 / 注册
            </Link>
          )}
        </div>
      )}

      {showPublish && <Publish onClose={() => setShowPublish(false)} />}

      <style>{`
        @media (min-width: 769px) {
          .desktop-only {
            display: flex !important;
          }
          .mobile-only {
            display: none !important;
          }
        }
        @media (max-width: 768px) {
          .desktop-only {
            display: none !important;
          }
          .mobile-only {
            display: flex !important;
          }
        }
      `}</style>
    </>
  );
};

export default Navbar;
