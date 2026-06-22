import React, { useCallback } from 'react';
import { Camera, FileImage } from 'lucide-react';

interface ExportCardProps {
  onExportScreenshot: () => void;
  onExportHeatmap: () => void;
  heatmapAvailable: boolean;
  isExportingScreenshot: boolean;
}

const ExportCard: React.FC<ExportCardProps> = ({
  onExportScreenshot,
  onExportHeatmap,
  heatmapAvailable,
  isExportingScreenshot,
}) => {
  const createRipple = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    button.appendChild(ripple);
    setTimeout(() => {
      ripple.remove();
    }, 300);
  }, []);

  const handleExportScreenshot = (e: React.MouseEvent<HTMLButtonElement>) => {
    createRipple(e);
    onExportScreenshot();
  };

  const handleExportHeatmap = (e: React.MouseEvent<HTMLButtonElement>) => {
    createRipple(e);
    onExportHeatmap();
  };

  return (
    <div className="card">
      <div className="card-title">
        <FileImage className="card-title-icon" />
        <span>数据导出</span>
      </div>

      <button
        className="secondary-btn"
        onClick={handleExportScreenshot}
      >
        {isExportingScreenshot ? (
          <>
            <span className="loading-spinner" />
            <span>导出中...</span>
          </>
        ) : (
          <>
            <Camera className="btn-icon" />
            <span>导出场景截图</span>
          </>
        )}
      </button>

      <button
        className={`primary-btn ${!heatmapAvailable ? 'btn-disabled' : ''}`}
        onClick={handleExportHeatmap}
        disabled={!heatmapAvailable}
      >
        <FileImage className="btn-icon" />
        <span>导出热力图SVG</span>
      </button>

      <div className="hint-text">截图分辨率 1920×1080 · SVG 矢量格式</div>
    </div>
  );
};

export default ExportCard;
