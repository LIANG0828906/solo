import React from 'react';

interface HighlightInfo {
  level: number;
  angle: number;
  length: number;
}

interface BranchInfoPanelProps {
  info: HighlightInfo | null;
}

export const BranchInfoPanel: React.FC<BranchInfoPanelProps> = ({ info }) => {
  if (!info) return null;

  return (
    <div
      className="fade-in"
      style={{
        position: 'absolute',
        top: 72,
        right: 16,
        width: 200,
        backgroundColor: '#1E1E2ECC',
        borderRadius: 8,
        border: '1px solid #FFD700',
        padding: 16,
        zIndex: 10,
      }}
    >
      <div
        style={{
          color: '#FFD700',
          fontSize: 14,
          fontWeight: 600,
          marginBottom: 12,
        }}
      >
        分支信息
      </div>
      <div style={{ color: '#FFFFFF', fontSize: 13, marginBottom: 8 }}>
        <span style={{ color: '#8888AA' }}>层级：</span>
        {info.level}
      </div>
      <div style={{ color: '#FFFFFF', fontSize: 13, marginBottom: 8 }}>
        <span style={{ color: '#8888AA' }}>角度：</span>
        {info.angle}°
      </div>
      <div style={{ color: '#FFFFFF', fontSize: 13 }}>
        <span style={{ color: '#8888AA' }}>长度：</span>
        {info.length.toFixed(2)}
      </div>
    </div>
  );
};
