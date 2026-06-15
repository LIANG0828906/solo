import React, { useState } from 'react';
import { BrushType } from './CanvasModule';

interface ToolbarModuleProps {
  onBrushChange: (type: BrushType) => void;
  onEraserToggle: (active: boolean) => void;
  onReset: () => void;
  currentBrush: BrushType;
  eraserActive: boolean;
}

const ToolbarModule: React.FC<ToolbarModuleProps> = ({
  onBrushChange,
  onEraserToggle,
  onReset,
  currentBrush,
  eraserActive
}) => {
  const [animatingBrush, setAnimatingBrush] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleBrushClick = (type: BrushType) => {
    setAnimatingBrush(type);
    onBrushChange(type);
    setTimeout(() => setAnimatingBrush(null), 150);
  };

  const handleEraserClick = () => {
    onEraserToggle(!eraserActive);
  };

  const handleResetClick = () => {
    setShowConfirm(true);
  };

  const confirmReset = () => {
    onReset();
    setShowConfirm(false);
  };

  const cancelReset = () => {
    setShowConfirm(false);
  };

  const brushes = [
    { type: 'circle' as BrushType, icon: '●', label: '圆形' },
    { type: 'bevel' as BrushType, icon: '◆', label: '斜角' },
    { type: 'flat' as BrushType, icon: '■', label: '扁头' }
  ];

  return (
    <div style={styles.container}>
      <div style={styles.brushSection}>
        <span style={styles.sectionLabel}>笔触</span>
        {brushes.map(brush => (
          <button
            key={brush.type}
            onClick={() => handleBrushClick(brush.type)}
            style={{
              ...styles.brushButton,
              ...(currentBrush === brush.type ? styles.brushButtonActive : {}),
              transform: animatingBrush === brush.type ? 'scale(1.2)' : 'scale(1)'
            }}
          >
            <span style={styles.brushIcon}>{brush.icon}</span>
            <span style={styles.brushLabel}>{brush.label}</span>
          </button>
        ))}
      </div>

      <div style={styles.divider} />

      <button
        onClick={handleEraserClick}
        style={{
          ...styles.toolButton,
          ...(eraserActive ? styles.toolButtonActive : {})
        }}
      >
        <span style={styles.toolIcon}>✕</span>
        <span style={styles.toolLabel}>橡皮擦</span>
      </button>

      <div style={styles.divider} />

      <button
        onClick={handleResetClick}
        style={styles.resetButton}
      >
        <span style={styles.resetIcon}>↺</span>
        <span style={styles.resetLabel}>重置</span>
      </button>

      {showConfirm && (
        <div style={styles.confirmOverlay}>
          <div style={styles.confirmDialog}>
            <p style={styles.confirmText}>确定要重置画布吗？</p>
            <div style={styles.confirmButtons}>
              <button onClick={cancelReset} style={styles.cancelButton}>取消</button>
              <button onClick={confirmReset} style={styles.confirmButton}>确定</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 20px',
    backgroundColor: '#E8DFD0',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    marginBottom: '16px'
  },
  brushSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  sectionLabel: {
    fontFamily: "'Noto Sans SC', sans-serif",
    fontSize: '13px',
    color: '#6B5D4D',
    marginRight: '8px',
    fontWeight: 500
  },
  brushButton: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '2px',
    padding: '8px 12px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#FFFAF0',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  brushButtonActive: {
    backgroundColor: '#D4C4A8',
    boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
  },
  brushIcon: {
    fontSize: '16px',
    color: '#4A3F35',
    lineHeight: 1
  },
  brushLabel: {
    fontFamily: "'Noto Sans SC', sans-serif",
    fontSize: '11px',
    color: '#6B5D4D'
  },
  divider: {
    width: '1px',
    height: '32px',
    backgroundColor: '#D4C4A8',
    margin: '0 4px'
  },
  toolButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#FFFAF0',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  toolButtonActive: {
    backgroundColor: '#E67373',
    color: '#FFFAF0'
  },
  toolIcon: {
    fontSize: '14px'
  },
  toolLabel: {
    fontFamily: "'Noto Sans SC', sans-serif",
    fontSize: '12px',
    fontWeight: 500
  },
  resetButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#E63946',
    color: '#FFFAF0',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    boxShadow: '0 2px 6px rgba(230,57,70,0.3)'
  },
  resetIcon: {
    fontSize: '14px'
  },
  resetLabel: {
    fontFamily: "'Noto Sans SC', sans-serif",
    fontSize: '12px',
    fontWeight: 500
  },
  confirmOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  confirmDialog: {
    backgroundColor: '#FFFAF0',
    borderRadius: '12px',
    padding: '24px 32px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
    textAlign: 'center' as const
  },
  confirmText: {
    fontFamily: "'Noto Sans SC', sans-serif",
    fontSize: '15px',
    color: '#4A3F35',
    margin: '0 0 20px 0'
  },
  confirmButtons: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center'
  },
  cancelButton: {
    padding: '8px 20px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#E8DFD0',
    color: '#6B5D4D',
    fontFamily: "'Noto Sans SC', sans-serif",
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease'
  },
  confirmButton: {
    padding: '8px 20px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#E63946',
    color: '#FFFAF0',
    fontFamily: "'Noto Sans SC', sans-serif",
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease'
  }
};

export default ToolbarModule;
