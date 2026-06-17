import React, { memo, useState, useEffect } from 'react';

export type PageType = 'my-wishes' | 'community' | 'ranking';

interface NavbarProps {
  currentPage: PageType;
  onPageChange: (page: PageType) => void;
  onCreateWish: () => void;
}

function NavbarComponent({ currentPage, onPageChange, onCreateWish }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    const checkScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    checkMobile();
    checkScroll();
    window.addEventListener('resize', checkMobile);
    window.addEventListener('scroll', checkScroll);
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('scroll', checkScroll);
    };
  }, []);

  const navLinks: { key: PageType; label: string; icon: string }[] = [
    { key: 'my-wishes', label: '我的清单', icon: '📋' },
    { key: 'community', label: '社区广场', icon: '🌐' },
    { key: 'ranking', label: '排行榜', icon: '🏆' }
  ];

  const handleNavClick = (page: PageType) => {
    onPageChange(page);
    setMenuOpen(false);
  };

  return (
    <>
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 60,
          backgroundColor: scrolled ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          boxShadow: scrolled ? '0 2px 12px rgba(0,0,0,0.08)' : 'none',
          transition: 'all 0.3s ease'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            cursor: 'pointer',
            flexShrink: 0
          }}
          onClick={() => handleNavClick('my-wishes')}
        >
          <span style={{ fontSize: 32, lineHeight: 1 }}>🎁</span>
          <span
            style={{
              fontSize: 20,
              fontWeight: 700,
              background: 'linear-gradient(90deg, #6C63FF 0%, #8B7CF5 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            WishWall
          </span>
        </div>

        {!isMobile && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginLeft: 48,
              flex: 1
            }}
          >
            {navLinks.map((link) => {
              const isActive = currentPage === link.key;
              return (
                <button
                  key={link.key}
                  onClick={() => handleNavClick(link.key)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '8px 16px',
                    fontSize: 14,
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? '#6C63FF' : '#636e72',
                    cursor: 'pointer',
                    borderRadius: 8,
                    position: 'relative',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                      isActive ? 'rgba(108, 99, 255, 0.08)' : 'rgba(0, 0, 0, 0.03)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                      'transparent';
                  }}
                >
                  <span>{link.icon}</span>
                  {link.label}
                  <span
                    style={{
                      position: 'absolute',
                      bottom: 2,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: isActive ? '40%' : '0',
                      height: 2,
                      backgroundColor: '#6C63FF',
                      borderRadius: 1,
                      transition: 'width 0.3s ease'
                    }}
                  />
                </button>
              );
            })}
          </div>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          {!isMobile && (
            <button
              onClick={onCreateWish}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: 8,
                backgroundColor: '#6C63FF',
                color: '#fff',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 2px 8px rgba(108, 99, 255, 0.3)'
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#5A52D5';
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  '0 4px 12px rgba(108, 99, 255, 0.4)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#6C63FF';
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  '0 2px 8px rgba(108, 99, 255, 0.3)';
              }}
            >
              <span style={{ fontSize: 16 }}>+</span>
              创建愿望
            </button>
          )}

          {isMobile && (
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                background: 'none',
                border: 'none',
                padding: 8,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: 5,
                borderRadius: 6,
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  'rgba(0, 0, 0, 0.05)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
              }}
            >
              <span
                style={{
                  width: 24,
                  height: 2,
                  backgroundColor: '#2c3e50',
                  borderRadius: 1,
                  transition: 'transform 0.3s',
                  transform: menuOpen ? 'translateY(7px) rotate(45deg)' : 'none'
                }}
              />
              <span
                style={{
                  width: 24,
                  height: 2,
                  backgroundColor: '#2c3e50',
                  borderRadius: 1,
                  transition: 'opacity 0.3s',
                  opacity: menuOpen ? 0 : 1
                }}
              />
              <span
                style={{
                  width: 24,
                  height: 2,
                  backgroundColor: '#2c3e50',
                  borderRadius: 1,
                  transition: 'transform 0.3s',
                  transform: menuOpen ? 'translateY(-7px) rotate(-45deg)' : 'none'
                }}
              />
            </button>
          )}
        </div>
      </nav>

      {isMobile && menuOpen && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 60,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              zIndex: 99,
              animation: 'fadeIn 0.2s ease-out'
            }}
            onClick={() => setMenuOpen(false)}
          />
          <div
            style={{
              position: 'fixed',
              top: 60,
              left: 0,
              right: 0,
              backgroundColor: '#fff',
              zIndex: 99,
              padding: '16px 24px 24px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
              animation: 'slideDown 0.3s ease-out'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {navLinks.map((link) => {
                const isActive = currentPage === link.key;
                return (
                  <button
                    key={link.key}
                    onClick={() => handleNavClick(link.key)}
                    style={{
                      padding: '14px 16px',
                      border: 'none',
                      borderRadius: 10,
                      backgroundColor: isActive ? 'rgba(108, 99, 255, 0.08)' : 'transparent',
                      color: isActive ? '#6C63FF' : '#2c3e50',
                      fontSize: 16,
                      fontWeight: isActive ? 600 : 400,
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                          'rgba(0, 0, 0, 0.03)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = isActive
                        ? 'rgba(108, 99, 255, 0.08)'
                        : 'transparent';
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{link.icon}</span>
                    {link.label}
                  </button>
                );
              })}
            </div>
            <div style={{ height: 1, backgroundColor: '#f0f0f0', margin: '16px 0' }} />
            <button
              onClick={() => {
                onCreateWish();
                setMenuOpen(false);
              }}
              style={{
                width: '100%',
                padding: '14px 20px',
                border: 'none',
                borderRadius: 10,
                backgroundColor: '#6C63FF',
                color: '#fff',
                fontSize: 16,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#5A52D5';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#6C63FF';
              }}
            >
              <span style={{ fontSize: 18 }}>+</span>
              创建新愿望
            </button>
          </div>
        </>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}

export const Navbar = memo(NavbarComponent);
