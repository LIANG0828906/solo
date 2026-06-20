import { usePosterStore } from '../store';

interface ToolbarProps {
  onExport: () => void;
}

function Toolbar({ onExport }: ToolbarProps) {
  const { undo, redo, clear, historyIndex, history } = usePosterStore();
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <div style={styles.toolbar}>
      <button
        style={{
          ...styles.toolBtn,
          ...(canUndo ? {} : styles.toolBtnDisabled),
        }}
        onClick={undo}
        disabled={!canUndo}
        title="撤销"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={styles.icon}>
          <path d="M3 10h10a5 5 0 0 1 5 5v2" />
          <path d="M3 10l4-4M3 10l4 4" />
        </svg>
        <span style={styles.btnText}>撤销</span>
      </button>

      <button
        style={{
          ...styles.toolBtn,
          ...(canRedo ? {} : styles.toolBtnDisabled),
        }}
        onClick={redo}
        disabled={!canRedo}
        title="重做"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={styles.icon}>
          <path d="M21 10H11a5 5 0 0 0-5 5v2" />
          <path d="M21 10l-4-4M21 10l-4 4" />
        </svg>
        <span style={styles.btnText}>重做</span>
      </button>

      <div style={styles.divider} />

      <button style={styles.toolBtn} onClick={clear} title="清空画布">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={styles.icon}>
          <path d="M3 6h18" />
          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        </svg>
        <span style={styles.btnText}>清空</span>
      </button>

      <div style={styles.divider} />

      <button
        style={{ ...styles.toolBtn, ...styles.exportBtn }}
        onClick={onExport}
        title="导出PNG"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={styles.icon}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <path d="M7 10l5 5 5-5" />
          <path d="M12 15V3" />
        </svg>
        <span style={styles.btnText}>导出PNG</span>
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  toolbar: {
    position: 'absolute',
    bottom: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '8px 12px',
    backgroundColor: 'rgba(26, 26, 26, 0.85)',
    borderRadius: '12px',
    backdropFilter: 'blur(12px)',
    zIndex: 100,
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
  },
  toolBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: 'transparent',
    color: '#fff',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  toolBtnDisabled: {
    opacity: 0.35,
    cursor: 'not-allowed',
  },
  exportBtn: {
    backgroundColor: '#D4AF37',
    color: '#2C0E0E',
    fontWeight: 600,
  },
  divider: {
    width: '1px',
    height: '20px',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    margin: '0 4px',
  },
  icon: {
    width: '16px',
    height: '16px',
  },
  btnText: {
    fontSize: '12px',
  },
};

export default Toolbar;
