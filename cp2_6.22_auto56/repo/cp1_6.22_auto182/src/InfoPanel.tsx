import React from 'react';
import { AtomData } from './DataLoader';

interface InfoPanelProps {
  atom: AtomData | null;
  onClose: () => void;
}

const InfoPanel: React.FC<InfoPanelProps> = ({ atom, onClose }) => {
  if (!atom) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        width: '300px',
        backgroundColor: 'rgba(30, 30, 46, 0.85)',
        borderRadius: '12px',
        padding: '20px',
        color: 'white',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(10px)',
        transform: 'translateX(0)',
        transition: 'transform 0.3s ease-out, opacity 0.3s ease-out',
        opacity: 1,
        zIndex: 100,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>原子信息</h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#888',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '0 4px',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#888')}
        >
          ×
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: atom.color,
            boxShadow: `0 0 20px ${atom.color}40`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            color: atom.element === 'H' || atom.element === 'C' ? '#333' : 'white',
            fontSize: '14px',
          }}
        >
          {atom.element}
        </div>
        <div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#6366F1' }}>
            {atom.element}
          </div>
          <div style={{ fontSize: '14px', color: '#aaa' }}>{atom.name}</div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid #333', paddingTop: '12px' }}>
        <div style={{ marginBottom: '8px' }}>
          <span style={{ color: '#888', fontSize: '13px' }}>原子编号</span>
          <div style={{ fontSize: '14px', marginTop: '2px' }}>#{atom.id}</div>
        </div>
        <div style={{ marginBottom: '8px' }}>
          <span style={{ color: '#888', fontSize: '13px' }}>相对原子质量</span>
          <div style={{ fontSize: '14px', marginTop: '2px' }}>{atom.mass.toFixed(3)} u</div>
        </div>
        <div style={{ marginBottom: '8px' }}>
          <span style={{ color: '#888', fontSize: '13px' }}>共价半径</span>
          <div style={{ fontSize: '14px', marginTop: '2px' }}>{atom.covalentRadius} Å</div>
        </div>
        <div>
          <span style={{ color: '#888', fontSize: '13px' }}>空间坐标</span>
          <div
            style={{
              fontSize: '14px',
              marginTop: '2px',
              fontFamily: 'monospace',
              color: '#8B5CF6',
            }}
          >
            ({atom.x.toFixed(2)}, {atom.y.toFixed(2)}, {atom.z.toFixed(2)})
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfoPanel;
