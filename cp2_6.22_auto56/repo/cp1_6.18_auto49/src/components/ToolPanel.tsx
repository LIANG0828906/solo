import React, { useRef, useState } from 'react';
import { useTimelineStore } from '../store/timelineStore';

export const ToolPanel: React.FC = () => {
  const {
    addNode,
    undo,
    redo,
    togglePlay,
    isPlaying,
    historyIndex,
    history,
    exportJSON,
    importJSON,
    isExporting,
  } = useTimelineStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  const handleExport = async () => {
    const jsonStr = await exportJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timeline-story-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('导出成功！', 'success');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = importJSON(content);
      if (result.success) {
        showToast('导入成功！', 'success');
      } else {
        showToast(`导入失败: ${result.error}`, 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <>
      <div className="tool-panel">
        <div className="tool-panel-title">时间轴编辑器</div>

        <button className="tool-button primary" onClick={() => addNode()}>
          <span className="tool-button-icon">＋</span>
          <span>添加节点</span>
        </button>

        <div className="tool-divider" />

        <button
          className="tool-button"
          onClick={undo}
          disabled={historyIndex <= 0}
        >
          <span className="tool-button-icon">↶</span>
          <span>撤销</span>
        </button>

        <button
          className="tool-button"
          onClick={redo}
          disabled={historyIndex >= history.length - 1}
        >
          <span className="tool-button-icon">↷</span>
          <span>重做</span>
        </button>

        <div className="tool-divider" />

        <button className="tool-button" onClick={togglePlay}>
          <span className="tool-button-icon">{isPlaying ? '⏹' : '▶'}</span>
          <span>{isPlaying ? '停止播放' : '播放故事'}</span>
        </button>

        <div className="tool-divider" />

        <button
          className="tool-button"
          onClick={handleExport}
          disabled={isExporting}
        >
          {isExporting ? (
            <span className="spinner" />
          ) : (
            <span className="tool-button-icon">↓</span>
          )}
          <span>{isExporting ? '导出中...' : '导出 JSON'}</span>
        </button>

        <button className="tool-button" onClick={handleImportClick}>
          <span className="tool-button-icon">↑</span>
          <span>导入 JSON</span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="import-file-input"
          onChange={handleFileChange}
        />
      </div>

      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      )}
    </>
  );
};
