import React from 'react';

interface ToolbarProps {
  zoom: number;
  onAddImage: () => void;
  onAddText: () => void;
  onAddLink: () => void;
  onResetView: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  zoom,
  onAddImage,
  onAddText,
  onAddLink,
  onResetView,
}) => {
  const buttonStyle: React.CSSProperties = {
    padding: '8px 12px',
    borderRadius: '10px',
    background: 'transparent',
    border: '1px solid transparent',
    transition: 'all 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    lineHeight: 1,
  };

  return (
    <div
      className="glass fade-in"
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '8px',
        zIndex: 1000,
      }}
    >
      <button
        onClick={onAddImage}
        style={buttonStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(59,130,246,0.1)';
          e.currentTarget.style.borderColor = 'rgba(59,130,246,0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.borderColor = 'transparent';
        }}
        title="添加图片"
      >
        🖼️
      </button>
      <button
        onClick={onAddText}
        style={buttonStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(59,130,246,0.1)';
          e.currentTarget.style.borderColor = 'rgba(59,130,246,0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.borderColor = 'transparent';
        }}
        title="添加文字"
      >
        📝
      </button>
      <button
        onClick={onAddLink}
        style={buttonStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(59,130,246,0.1)';
          e.currentTarget.style.borderColor = 'rgba(59,130,246,0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.borderColor = 'transparent';
        }}
        title="添加链接"
      >
        🔗
      </button>
      <div
        style={{
          width: '1px',
          height: '24px',
          background: 'rgba(0,0,0,0.1)',
          margin: '0 4px',
        }}
      />
      <button
        onClick={onResetView}
        style={buttonStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(59,130,246,0.1)';
          e.currentTarget.style.borderColor = 'rgba(59,130,246,0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.borderColor = 'transparent';
        }}
        title="重置视图"
      >
        ↺
      </button>
      <div
        style={{
          width: '1px',
          height: '24px',
          background: 'rgba(0,0,0,0.1)',
          margin: '0 4px',
        }}
      />
      <span
        style={{
          fontSize: '12px',
          color: '#64748B',
          padding: '0 8px',
          minWidth: '48px',
          textAlign: 'center',
        }}
      >
        {Math.round(zoom * 100)}%
      </span>
    </div>
  );
};

export default Toolbar;
