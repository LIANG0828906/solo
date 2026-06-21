import React, { useEffect, useRef } from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  visible: boolean;
  cardId: string | null;
  onDelete: () => void;
  onDuplicate: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onResize: () => void;
  onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  visible,
  onDelete,
  onDuplicate,
  onBringToFront,
  onSendToBack,
  onResize,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!visible) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [visible, onClose]);

  if (!visible) return null;

  const menuItemStyle: React.CSSProperties = {
    padding: '10px 16px',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '14px',
    color: 'var(--text)',
    userSelect: 'none',
    borderRadius: '8px',
  };

  const handleItemClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="glass fade-in"
      style={{
        position: 'fixed',
        left: x,
        top: y,
        padding: '6px',
        minWidth: '160px',
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
      }}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div
        style={menuItemStyle}
        onClick={(e) => handleItemClick(e, onDuplicate)}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(59,130,246,0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <span>📋</span>
        <span>复制</span>
      </div>
      <div
        style={menuItemStyle}
        onClick={(e) => handleItemClick(e, onBringToFront)}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(59,130,246,0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <span>⬆️</span>
        <span>置顶</span>
      </div>
      <div
        style={menuItemStyle}
        onClick={(e) => handleItemClick(e, onSendToBack)}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(59,130,246,0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <span>⬇️</span>
        <span>置底</span>
      </div>
      <div
        style={menuItemStyle}
        onClick={(e) => handleItemClick(e, onResize)}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(59,130,246,0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <span>📐</span>
        <span>调整大小</span>
      </div>
      <div
        style={{
          width: '100%',
          height: '1px',
          background: 'rgba(0,0,0,0.08)',
          margin: '4px 0',
        }}
      />
      <div
        style={{
          ...menuItemStyle,
          color: '#EF4444',
        }}
        onClick={(e) => handleItemClick(e, onDelete)}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <span>🗑️</span>
        <span>删除</span>
      </div>
    </div>
  );
};

export default ContextMenu;
