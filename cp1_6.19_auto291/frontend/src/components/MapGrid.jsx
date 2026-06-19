import React from 'react';
import useCabinetStore from '../store/useCabinetStore';

const statusConfig = {
  available: { color: '#27AE60', label: '空闲' },
  occupied: { color: '#95A5A6', label: '占用' },
  overdue: { color: '#E74C3C', label: '超时' },
  locked: { color: '#F39C12', label: '锁定' },
};

export default function MapGrid({ cabinets }) {
  const { selectCompartment } = useCabinetStore();

  const grid = Array.from({ length: 10 }, () => Array.from({ length: 10 }, () => null));
  cabinets.forEach((cabinet) => {
    const row = parseInt(cabinet.id.split('-')[1], 10);
    cabinet.compartments.forEach((comp, col) => {
      grid[row][col] = { ...comp, cabinetName: cabinet.name, cabinetId: cabinet.id };
    });
  });

  return (
    <div style={{
      background: '#fff',
      borderRadius: 12,
      padding: 24,
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: '#333', marginBottom: 8 }}>
        储物柜地图
      </h2>
      <p style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>
        点击格口查看详情 · 每行代表一个储物柜站点
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '76px repeat(10, 1fr)', gap: 4, marginBottom: 4 }}>
        <div />
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 11, color: '#999' }}>
            格{i + 1}
          </div>
        ))}
      </div>

      {grid.map((row, rowIdx) => (
        <div key={rowIdx} style={{ display: 'grid', gridTemplateColumns: '76px repeat(10, 1fr)', gap: 4, marginBottom: 4 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: 12,
            color: '#555',
            fontWeight: 500,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            paddingRight: 4,
          }}>
            {cabinets[rowIdx]?.name || ''}
          </div>
          {row.map((cell, colIdx) => {
            if (!cell) {
              return <div key={colIdx} style={{ aspectRatio: '1', borderRadius: 6, background: '#F0F0F0' }} />;
            }
            const config = statusConfig[cell.status] || statusConfig.available;
            const isAvailable = cell.status === 'available';
            const isOverdue = cell.status === 'overdue';
            return (
              <div
                key={colIdx}
                onClick={() => selectCompartment(cell)}
                style={{
                  aspectRatio: '1',
                  borderRadius: 6,
                  background: isAvailable ? '#E8F8F0' : isOverdue ? '#FDEDEC' : '#F2F3F4',
                  border: `2px solid ${config.color}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.08)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                title={`${cell.cabinetName} - 格口${colIdx + 1} (${config.label} / ${cell.size})`}
              >
                <div style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: config.color,
                  animation: isAvailable ? 'breathe 2s ease-in-out infinite' : 'none',
                }} />
              </div>
            );
          })}
        </div>
      ))}

      <div style={{ display: 'flex', gap: 20, marginTop: 16, justifyContent: 'center' }}>
        {Object.entries(statusConfig).map(([key, val]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#666' }}>
            <div style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: val.color,
              animation: key === 'available' ? 'breathe 2s ease-in-out infinite' : 'none',
            }} />
            {val.label}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes breathe {
          0%, 100% { opacity: 0.4; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
