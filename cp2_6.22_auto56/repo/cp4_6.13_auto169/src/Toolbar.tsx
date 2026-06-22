import React from 'react';

interface ToolbarProps {
  isPreviewMode: boolean;
  onTogglePreview: () => void;
  onExport: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ isPreviewMode, onTogglePreview, onExport }) => {
  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <span className="toolbar-title">🎨 Landing Page Builder</span>
      </div>
      <div className="toolbar-right">
        <button className="toolbar-btn" onClick={onTogglePreview}>
          {isPreviewMode ? '✏️ 编辑模式' : '👁️ 预览模式'}
        </button>
        <button className="toolbar-btn primary" onClick={onExport}>
          📦 导出源码
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
