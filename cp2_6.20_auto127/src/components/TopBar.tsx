interface TopBarProps {
  onExport: () => void;
  onClear: () => void;
}

function TopBar({ onExport, onClear }: TopBarProps) {
  return (
    <div className="top-bar glass-panel">
      <div className="app-title">3D 抽象雕塑编辑器</div>
      <div className="top-bar-actions">
        <button className="icon-button" onClick={onClear}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
          <span className="tooltip">清空场景</span>
        </button>
        <button className="icon-button" onClick={onExport}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          <span className="tooltip">导出配置</span>
        </button>
      </div>
    </div>
  );
}

export default TopBar;
