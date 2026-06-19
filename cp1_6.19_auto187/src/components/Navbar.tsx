import React from 'react';
import { motion } from 'framer-motion';
import { useRecipeStore } from '../store/useRecipeStore';

export const Navbar: React.FC = () => {
  const { toggleCreateModal, toggleSidebar } = useRecipeStore();

  return (
    <nav
      style={{
        height: '60px',
        background: 'var(--color-nav-bg)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: '16px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        position: 'relative',
        zIndex: 100,
      }}
    >
      <motion.button
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.05 }}
        onClick={toggleSidebar}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          padding: '6px 8px',
          borderRadius: '6px',
          color: '#FFFFFF',
        }}
      >
        <div
          style={{
            width: '22px',
            height: '2px',
            background: '#FFFFFF',
            borderRadius: '2px',
          }}
        />
        <div
          style={{
            width: '22px',
            height: '2px',
            background: '#FFFFFF',
            borderRadius: '2px',
          }}
        />
        <div
          style={{
            width: '22px',
            height: '2px',
            background: '#FFFFFF',
            borderRadius: '2px',
          }}
        />
      </motion.button>

      <div
        style={{
          fontFamily: 'var(--font-handwriting)',
          fontSize: '32px',
          color: '#FFFFFF',
          fontWeight: 700,
          letterSpacing: '1px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span>🍜</span>
        <span>风味食谱地图</span>
      </div>

      <div style={{ flex: 1 }} />

      <motion.button
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.03, backgroundColor: 'rgba(255,255,255,0.2)' }}
        onClick={toggleCreateModal}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 16px',
          borderRadius: '999px',
          background: 'rgba(255, 255, 255, 0.15)',
          border: '1.5px dashed rgba(255, 255, 255, 0.5)',
          color: '#FFFFFF',
          fontSize: '14px',
          fontWeight: 600,
          transition: 'background 0.2s',
        }}
      >
        <span style={{ fontSize: '16px' }}>✏️</span>
        <span>创建食谱</span>
      </motion.button>

      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #FFE4B5 0%, #DEB887 100%)',
          border: '2px solid rgba(255, 255, 255, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          cursor: 'pointer',
        }}
      >
        👨‍🍳
      </div>
    </nav>
  );
};
