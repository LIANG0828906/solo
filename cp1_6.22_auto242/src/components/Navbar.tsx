import React, { useState } from 'react';

type Page = 'ingredients' | 'recipes' | 'testing' | 'reports';

interface NavbarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate, onToggleSidebar, sidebarOpen }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { key: Page; label: string }[] = [
    { key: 'ingredients', label: '原料库' },
    { key: 'recipes', label: '配方' },
    { key: 'testing', label: '试香记录' },
    { key: 'reports', label: '报告' },
  ];

  return (
    <>
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '56px',
        backgroundColor: '#F5F0E6',
        borderBottom: '1px solid #E0D6C8',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        zIndex: 1000,
      }}>
        <button
          onClick={onToggleSidebar}
          style={{
            display: 'none',
            width: '36px',
            height: '36px',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            color: '#3C2415',
            fontSize: '20px',
            marginRight: '12px',
            borderRadius: '4px',
            transition: 'background-color 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#E0D6C8';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          ☰
        </button>
        
        <div style={{
          fontSize: '20px',
          fontWeight: 700,
          color: '#3C2415',
          fontFamily: "'Playfair Display', 'Noto Serif SC', serif",
          marginRight: '40px',
          letterSpacing: '1px',
        }}>
          ✦ 调香台
        </div>
        
        <div style={{
          display: 'flex',
          gap: '8px',
          flex: 1,
        }}
        className="desktop-nav">
          {navItems.map(item => (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              style={{
                padding: '8px 16px',
                border: 'none',
                backgroundColor: currentPage === item.key ? '#E0D6C8' : 'transparent',
                color: currentPage === item.key ? '#3C2415' : '#5C4033',
                fontSize: '14px',
                fontWeight: currentPage === item.key ? 600 : 400,
                fontFamily: "'Inter', sans-serif",
                cursor: 'pointer',
                borderRadius: '6px',
                transition: 'background-color 0.15s, color 0.15s',
              }}
              onMouseEnter={(e) => {
                if (currentPage !== item.key) {
                  e.currentTarget.style.backgroundColor = '#F0EBE0';
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== item.key) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
        
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{
            display: 'none',
            width: '36px',
            height: '36px',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            color: '#3C2415',
            fontSize: '20px',
            borderRadius: '4px',
          }}
          className="mobile-menu-btn"
        >
          ☰
        </button>
      </nav>
      
      {mobileMenuOpen && (
        <div style={{
          position: 'fixed',
          top: '56px',
          left: 0,
          right: 0,
          backgroundColor: '#F5F0E6',
          borderBottom: '1px solid #E0D6C8',
          padding: '8px',
          zIndex: 999,
          display: 'none',
        }}
        className="mobile-menu">
          {navItems.map(item => (
            <button
              key={item.key}
              onClick={() => {
                onNavigate(item.key);
                setMobileMenuOpen(false);
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                backgroundColor: currentPage === item.key ? '#E0D6C8' : 'transparent',
                color: currentPage === item.key ? '#3C2415' : '#5C4033',
                fontSize: '14px',
                fontWeight: currentPage === item.key ? 600 : 400,
                fontFamily: "'Inter', sans-serif",
                cursor: 'pointer',
                borderRadius: '6px',
                textAlign: 'left',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-menu-btn {
            display: block !important;
          }
          .mobile-menu {
            display: block !important;
          }
        }
      `}</style>
    </>
  );
};

export default Navbar;
