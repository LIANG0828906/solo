import React, { useState } from 'react';
import { exportToPNG } from '@/utils/canvas';

interface ExportButtonProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export const ExportButton: React.FC<ExportButtonProps> = ({ canvasRef }) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    if (!canvasRef.current) return;

    setIsExporting(true);
    try {
      exportToPNG(canvasRef.current, 'character-animation.png');
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败，请重试');
    } finally {
      setTimeout(() => setIsExporting(false), 1000);
    }
  };

  return (
    <div className="export-section">
      <button
        type="button"
        className={`export-btn ${isExporting ? 'exporting' : ''}`}
        onClick={handleExport}
        disabled={isExporting}
      >
        {isExporting ? '⏳ 导出中...' : '📥 导出 PNG'}
      </button>
      <p className="export-hint">导出当前画布内容（包含动画轨迹效果）</p>
    </div>
  );
};
