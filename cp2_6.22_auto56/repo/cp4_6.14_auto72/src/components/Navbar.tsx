import React from 'react';
import { Menu, Clock, Users, FileText } from 'lucide-react';
import { useDocStore } from '@/store/docStore';

const Navbar: React.FC = () => {
  const { toggleHistoryPanel, toggleUserPanel, currentDoc, users } = useDocStore();

  return (
    <nav
      style={{
        height: 60,
        backgroundColor: '#1e293b',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      }}
    >
      <button
        onClick={toggleUserPanel}
        style={{
          display: 'none',
          background: 'transparent',
          color: '#ffffff',
          padding: 8,
          borderRadius: 6,
          marginRight: 12,
        }}
        className="md:hidden"
        aria-label="菜单"
      >
        <Menu size={20} />
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <FileText size={22} color="#3b82f6" />
        <h1 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
          {currentDoc.title}
        </h1>
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: 20,
            fontSize: 13,
          }}
        >
          <Users size={14} />
          <span>{users.length} 人在线</span>
        </div>

        <button
          onClick={toggleHistoryPanel}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
            color: '#ffffff',
            borderRadius: 6,
            fontSize: 13,
          }}
          aria-label="历史记录"
        >
          <Clock size={14} />
          <span className="hidden sm:inline">历史</span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
