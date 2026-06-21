import React from 'react';
import { Download, Upload, Trash2, Layers } from 'lucide-react';

interface ToolbarProps {
  onExport: () => void;
  onImport: () => void;
  onClear: () => void;
  onGroup: () => void;
}

export default function Toolbar({ onExport, onImport, onClear, onGroup }: ToolbarProps) {
  const buttonStyle: React.CSSProperties = {
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    borderRadius: '10px',
    backgroundColor: '#FFFFFF',
    color: '#616161',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = '#F5F5F5';
    e.currentTarget.style.color = '#2196F3';
    e.currentTarget.style.transform = 'translateY(-1px)';
    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = '#FFFFFF';
    e.currentTarget.style.color = '#616161';
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '16px',
        left: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        zIndex: 100,
      }}
    >
      <button
        onClick={onExport}
        title="导出"
        style={buttonStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Download size={20} />
      </button>
      <button
        onClick={onImport}
        title="导入"
        style={buttonStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Upload size={20} />
      </button>
      <button
        onClick={onClear}
        title="清空"
        style={buttonStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#FFEBEE';
          e.currentTarget.style.color = '#D32F2F';
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
        }}
        onMouseLeave={handleMouseLeave}
      >
        <Trash2 size={20} />
      </button>
      <button
        onClick={onGroup}
        title="语义分组"
        style={buttonStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Layers size={20} />
      </button>
    </div>
  );
}
