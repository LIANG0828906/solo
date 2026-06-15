interface ActionButtonsProps {
  onRandomize: () => void;
  onExport: () => void;
  isAnimating: boolean;
  isExporting: boolean;
}

export default function ActionButtons({
  onRandomize,
  onExport,
  isAnimating,
  isExporting,
}: ActionButtonsProps) {
  return (
    <div className="control-card actions-card">
      <div className="control-title">操作</div>
      <div className="actions-row">
        <button
          type="button"
          className="action-btn primary"
          onClick={onRandomize}
          disabled={isAnimating || isExporting}
        >
          <span className="btn-icon">🎲</span>
          <span className="btn-text">
            {isAnimating ? '生成中...' : '随机生成'}
          </span>
        </button>
        <button
          type="button"
          className="action-btn secondary"
          onClick={onExport}
          disabled={isAnimating || isExporting}
        >
          <span className="btn-icon">💾</span>
          <span className="btn-text">
            {isExporting ? '导出中...' : '导出PNG'}
          </span>
        </button>
      </div>
      <div className="actions-hint">
        <span className="hint-chip">100 × 100 透明背景 PNG</span>
      </div>
    </div>
  );
}
