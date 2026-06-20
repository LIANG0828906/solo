import { ThemeType, THEMES } from '../types';

interface ToolbarProps {
  onUndo: () => void;
  onRedo: () => void;
  onDelete: () => void;
  canUndo: boolean;
  canRedo: boolean;
  hasSelection: boolean;
  docId: string;
  onCopyDocId: () => void;
  theme: ThemeType;
}

function Toolbar({
  onUndo,
  onRedo,
  onDelete,
  canUndo,
  canRedo,
  hasSelection,
  docId,
  onCopyDocId,
  theme,
}: ToolbarProps) {
  return (
    <div className="toolbar">
      <button
        className="toolbar-btn"
        onClick={onUndo}
        disabled={!canUndo}
        title="撤销 (Ctrl+Z)"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 7v6h6" />
          <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
        </svg>
      </button>

      <button
        className="toolbar-btn"
        onClick={onRedo}
        disabled={!canRedo}
        title="重做 (Ctrl+Y)"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 7v6h-6" />
          <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
        </svg>
      </button>

      <div className="toolbar-divider" />

      <button
        className="toolbar-btn"
        onClick={onDelete}
        disabled={!hasSelection}
        title="删除节点 (Delete)"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      </button>

      <div className="toolbar-divider" />

      <div className="doc-id-display" title="点击复制文档ID">
        <span>ID:</span>
        <span className="id" onClick={onCopyDocId}>
          {docId.slice(0, 8)}...
        </span>
      </div>

      <div className="toolbar-divider" />

      <div
        style={{
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: THEMES[theme].primary,
          marginRight: 4,
        }}
        title={THEMES[theme].name}
      />
    </div>
  );
}

export default Toolbar;
