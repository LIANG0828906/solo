import React from 'react';
import { motion } from 'framer-motion';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  isMobile?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
}

const menuItems = [
  { id: 'overview', label: '故事总览', icon: '📊' },
  { id: 'story', label: '故事创作', icon: '📝' },
  { id: 'characters', label: '角色管理', icon: '👥' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onPageChange,
  isMobile = false,
  isOpen = true,
  onToggle,
}) => {
  if (isMobile) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '56px',
          backgroundColor: '#1A1A2E',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          zIndex: 1000,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        }}
      >
        <button
          onClick={onToggle}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '4px 8px',
          }}
        >
          ☰
        </button>
        <span style={{ color: 'white', fontSize: '16px', fontWeight: 600, marginLeft: '12px' }}>
          故事工坊
        </span>

        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              position: 'absolute',
              top: '56px',
              left: 0,
              right: 0,
              backgroundColor: '#1A1A2E',
              padding: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
          >
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onPageChange(item.id);
                  onToggle?.();
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  backgroundColor: currentPage === item.id ? 'rgba(52, 152, 219, 0.2)' : 'transparent',
                  color: currentPage === item.id ? '#3498DB' : 'rgba(255,255,255,0.7)',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                }}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        width: '280px',
        backgroundColor: '#1A1A2E',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          padding: '24px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #3498DB 0%, #9B59B6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
            }}
          >
            ✨
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700 }}>故事工坊</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
              Story Workshop
            </div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, padding: '12px 12px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                backgroundColor: currentPage === item.id ? 'rgba(52, 152, 219, 0.2)' : 'transparent',
                color: currentPage === item.id ? '#3498DB' : 'rgba(255,255,255,0.7)',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
                fontWeight: currentPage === item.id ? 600 : 400,
              }}
              onMouseEnter={(e) => {
                if (currentPage !== item.id) {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== item.id) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <span style={{ fontSize: '18px', width: '24px', textAlign: 'center' }}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <div
          style={{
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              color: 'rgba(255,255,255,0.4)',
              marginBottom: '10px',
              padding: '0 16px',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          >
            快捷操作
          </div>
          <button
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              backgroundColor: 'transparent',
              color: 'rgba(255,255,255,0.7)',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <span>📤</span>
            <span>导出项目</span>
          </button>
          <button
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              backgroundColor: 'transparent',
              color: 'rgba(255,255,255,0.7)',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <span>⚙️</span>
            <span>项目设置</span>
          </button>
        </div>
      </div>

      <div
        style={{
          padding: '16px 20px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: '#3498DB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 600,
            fontSize: '14px',
          }}
        >
          张
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: 500 }}>张编剧</div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>项目主笔</div>
        </div>
      </div>
    </div>
  );
};
