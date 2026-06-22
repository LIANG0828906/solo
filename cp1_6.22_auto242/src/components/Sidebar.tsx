import React from 'react';

interface SidebarProps {
  isOpen: boolean;
  children: React.ReactNode;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, children }) => {
  return (
    <>
      <aside
        className="sidebar"
        style={{
          width: isOpen ? '320px' : '0',
          minWidth: isOpen ? '320px' : '0',
          height: 'calc(100vh - 56px)',
          backgroundColor: '#F9F5EB',
          borderRight: isOpen ? '1px solid #E0D6C8' : 'none',
          overflowY: 'auto',
          overflowX: 'hidden',
          transition: 'width 0.3s ease, min-width 0.3s ease',
          position: 'sticky',
          top: '56px',
          boxSizing: 'border-box',
          flexShrink: 0,
        }}
      >
        <div style={{ 
          padding: '20px',
          opacity: isOpen ? 1 : 0,
          transition: 'opacity 0.2s ease',
          transitionDelay: isOpen ? '0.1s' : '0s',
        }}>
          {children}
        </div>
      </aside>

      <style>{`
        @media (max-width: 1024px) {
          .sidebar {
            position: fixed !important;
            left: 0;
            top: 56px;
            bottom: 0;
            z-index: 900;
            box-shadow: 2px 0 10px rgba(60,36,21,0.1);
          }
        }
      `}</style>
    </>
  );
};

export default Sidebar;
