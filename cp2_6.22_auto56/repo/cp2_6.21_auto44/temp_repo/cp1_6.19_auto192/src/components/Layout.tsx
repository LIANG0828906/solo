import { useState, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LayoutProps {
  children: ReactNode;
  activePage: string;
  onNavigate: (page: string) => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: string;
}

const menuItems: MenuItem[] = [
  { id: 'beans', label: '咖啡豆档案', icon: '☕' },
  { id: 'brews', label: '冲煮记录', icon: '⏱️' },
  { id: 'compare', label: '对比分析', icon: '📊' },
];

export const Layout = ({ children, activePage, onNavigate }: LayoutProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setSidebarCollapsed(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F5E6CC',
        fontFamily: "'Source Serif Pro', serif",
      }}
    >
      <div
        style={{
          height: 56,
          backgroundColor: '#4E342E',
          color: '#FFFFFF',
          borderRadius: 8,
          margin: 8,
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'all 0.2s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 24 }}>☕</span>
          <h1
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 600,
              fontFamily: "'Playfair Display', serif",
            }}
          >
            Brew Journal
          </h1>
        </div>
        <div style={{ fontSize: 13, opacity: 0.8 }}>
          咖啡冲煮记录与分享
        </div>
      </div>

      <div style={{ display: 'flex', padding: '0 8px 8px 8px' }}>
        <aside
          style={{
            width: sidebarCollapsed ? 60 : 240,
            flexShrink: 0,
            backgroundColor: '#FFFFFF',
            borderRadius: 8,
            padding: 12,
            marginRight: 12,
            minHeight: 'calc(100vh - 80px)',
            transition: 'width 0.3s ease',
          }}
        >
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                style={{
                  height: 44,
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor:
                    activePage === item.id ? '#D7CCC8' : 'transparent',
                  color: '#4E342E',
                  fontSize: sidebarCollapsed ? 18 : 14,
                  fontWeight: activePage === item.id ? 600 : 400,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                  gap: 12,
                  padding: sidebarCollapsed ? 0 : '0 16px',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (activePage !== item.id) {
                    e.currentTarget.style.backgroundColor = '#F5E6CC';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activePage !== item.id) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <span>{item.icon}</span>
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            ))}
          </nav>
        </aside>

        <main
          style={{
            flex: 1,
            minWidth: 980,
            maxWidth: '100%',
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};
