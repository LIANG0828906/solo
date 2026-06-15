import React, { useState, useCallback } from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  onCopy: () => void;
  onDelete: () => void;
  onBringToTop: () => void;
  onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, onCopy, onDelete, onBringToTop, onClose }) => {
  return (
    <>
      <div className="context-menu-overlay" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }} />
      <div className="context-menu" style={{ left: x, top: y }}>
        <button className="context-menu-item" onClick={() => { onCopy(); onClose(); }}>
          <span className="context-menu-icon">📋</span> 复制卡片
        </button>
        <button className="context-menu-item" onClick={() => { onBringToTop(); onClose(); }}>
          <span className="context-menu-icon">📌</span> 置顶卡片
        </button>
        <div className="context-menu-divider" />
        <button className="context-menu-item danger" onClick={() => { onDelete(); onClose(); }}>
          <span className="context-menu-icon">🗑️</span> 删除卡片
        </button>
      </div>
    </>
  );
};

export default ContextMenu;
