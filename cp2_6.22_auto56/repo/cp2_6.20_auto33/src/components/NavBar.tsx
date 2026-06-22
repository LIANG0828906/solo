import React from 'react';
import { NavLink } from 'react-router-dom';
import { sfx } from '../utils/audio';

interface Props {
  petName?: string;
  level?: number;
}

export const NavBar: React.FC<Props> = ({ petName, level }) => {
  const linkCls = ({ isActive }: { isActive: boolean }) => ({
    padding: '8px 16px',
    borderRadius: 999,
    fontWeight: 700,
    fontSize: 14,
    textDecoration: 'none',
    background: isActive ? 'linear-gradient(135deg, #FFE58F, #FFA940)' : 'rgba(255,255,255,0.6)',
    color: isActive ? '#fff' : '#5D4037',
    transition: 'var(--transition-fast)',
    boxShadow: isActive ? '0 4px 12px rgba(255,152,0,0.3)' : 'none',
    border: isActive ? '2px solid rgba(255,255,255,0.5)' : '2px solid transparent',
  });
  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', gap: 12,
      padding: '10px 16px',
      background: 'rgba(255, 248, 231, 0.9)',
      backdropFilter: 'blur(8px)',
      borderBottom: '2px solid rgba(255, 204, 128, 0.4)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 28 }}>🐾</span>
        <div>
          <div style={{ fontFamily: 'var(--font-cartoon)', fontSize: 18, color: '#FF6F00' }}>萌宠乐园</div>
          {petName && (
            <div style={{ fontSize: 11, color: '#8D6E63', fontWeight: 600 }}>
              {petName}{level ? ` · Lv.${level}` : ''}
            </div>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <NavLink to="/room" style={linkCls} onClick={() => sfx.click()}>🏠 房间</NavLink>
        <NavLink to="/square" style={linkCls} onClick={() => sfx.click()}>🌳 广场</NavLink>
      </div>
    </nav>
  );
};

export default NavBar;
