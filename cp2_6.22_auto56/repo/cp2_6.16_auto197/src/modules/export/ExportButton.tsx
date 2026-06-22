import React from 'react';
import { Download, Loader2 } from 'lucide-react';
import { useSpriteStore } from '@/store/spriteStore';
import './ExportButton.css';

export const ExportButton: React.FC = () => {
  const { exportState, exportSpriteSheet, timeline } = useSpriteStore();

  const handleExport = () => {
    if (timeline.frameIds.length === 0) {
      alert('时间轴上没有帧，无法导出');
      return;
    }
    exportSpriteSheet();
  };

  return (
    <div className="export-container">
      <button
        className="export-btn"
        onClick={handleExport}
        disabled={exportState.isExporting || timeline.frameIds.length === 0}
      >
        {exportState.isExporting ? (
          <Loader2 size={16} className="spinning" />
        ) : (
          <Download size={16} />
        )}
        <span>{exportState.isExporting ? '导出中...' : '导出精灵表'}</span>
      </button>

      {exportState.isExporting && (
        <div className="export-overlay">
          <div className="export-progress-container">
            <div className="export-progress-bar">
              <div
                className="export-progress-fill"
                style={{ width: `${exportState.progress * 100}%` }}
              />
            </div>
            <div className="export-progress-text">
              <Loader2 size={14} className="spinning" />
              <span>正在导出... {Math.round(exportState.progress * 100)}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
