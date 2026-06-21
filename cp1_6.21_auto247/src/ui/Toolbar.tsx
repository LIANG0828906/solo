interface ToolbarProps {
  onSave: () => void;
  onExport: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isExporting: boolean;
}

export default function Toolbar({ onSave, onExport, onUndo, onRedo, canUndo, canRedo, isExporting }: ToolbarProps) {
  return (
    <div style={styles.toolbar}>
      <div style={styles.left}>
        <h1 style={styles.logo}>🧱 乐高3D建模</h1>
      </div>

      <div style={styles.right}>
        <button style={styles.btn} onClick={onUndo} disabled={!canUndo} title="撤销 (Ctrl+Z)">
          ↶ 撤销
        </button>
        <button style={styles.btn} onClick={onRedo} disabled={!canRedo} title="重做 (Ctrl+Shift+Z)">
          ↷ 重做
        </button>
        <button style={styles.btn} onClick={onSave}>
          💾 保存
        </button>
        <button style={{ ...styles.btn, ...styles.primaryBtn }} onClick={onExport} disabled={isExporting}>
          {isExporting ? <span style={styles.spinner}></span> : null}
          {isExporting ? '导出中...' : '📤 导出STL'}
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  toolbar: {
    height: 56,
    backgroundColor: '#1E293B',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    borderBottom: '1px solid #334155',
  },
  left: {
    display: 'flex',
    alignItems: 'center',
  },
  logo: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: 600,
    margin: 0,
  },
  right: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
  btn: {
    padding: '10px 16px',
    backgroundColor: '#1E293B',
    color: '#E2E8F0',
    border: '1px solid #334155',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    transition: 'all 0.2s ease-out',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  primaryBtn: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
    color: 'white',
  },
  spinner: {
    width: 14,
    height: 14,
    border: '2px solid #ffffff33',
    borderTop: '2px solid white',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    display: 'inline-block',
  },
};
