import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

interface NavbarProps {
  cartItemCount?: number;
  onCartClick?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ cartItemCount = 0, onCartClick }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { path: '/', label: '商品' },
    { path: '/orders', label: '我的订单' },
    { path: '/admin', label: '管理后台' },
    { path: '/login', label: '登录' },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav style={{
      backgroundColor: '#ffffff',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      width: '100%',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '64px',
      }}>
        <div style={{
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#1f2937',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span style={{ fontSize: '24px' }}>🛒</span>
          <span>团购助手</span>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <div style={{
            display: 'flex',
            gap: '4px',
            '@media (max-width: 768px)': {
              display: 'none',
            },
          }}>
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: isActive(link.path) ? '#4f46e5' : '#6b7280',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                  backgroundColor: isActive(link.path) ? 'rgba(79, 70, 229, 0.1)' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (!isActive(link.path)) {
                    e.currentTarget.style.color = '#4f46e5';
                    e.currentTarget.style.backgroundColor = 'rgba(79, 70, 229, 0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(link.path)) {
                    e.currentTarget.style.color = '#6b7280';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          <button
            onClick={onCartClick}
            style={{
              position: 'relative',
              padding: '10px',
              borderRadius: '8px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(79, 70, 229, 0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: '#4b5563' }}
            >
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {cartItemCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '2px',
                right: '2px',
                minWidth: '18px',
                height: '18px',
                borderRadius: '9px',
                backgroundColor: '#ef4444',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px',
              }}>
                {cartItemCount > 99 ? '99+' : cartItemCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{
              display: 'none',
              '@media (max-width: 768px)': {
                display: 'block',
              },
              padding: '8px',
              borderRadius: '6px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: '#4b5563' }}
            >
              {isMobileMenuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div style={{
          display: 'none',
          '@media (max-width: 768px)': {
            display: 'block',
          },
          borderTop: '1px solid #e5e7eb',
          backgroundColor: '#ffffff',
        }}>
          <div style={{
            padding: '12px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}>
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                style={{
                  padding: '12px 16px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: isActive(link.path) ? '#4f46e5' : '#6b7280',
                  textDecoration: 'none',
                  backgroundColor: isActive(link.path) ? 'rgba(79, 70, 229, 0.1)' : 'transparent',
                }}
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          nav > div > div:nth-child(2) > div:first-child {
            display: none !important;
          }
          nav > div > div:nth-child(2) > button:last-child {
            display: block !important;
          }
          nav > div:last-child {
            display: block !important;
          }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
