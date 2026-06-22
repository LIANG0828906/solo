import React, { useState, useRef, useEffect, useCallback } from 'react';

export interface ExportButtonHandle {
  renderPreview: () => void;
}

interface ExportButtonProps {
  canvasRef: React.RefObject<{ renderForExport: () => HTMLCanvasElement } | null>;
  disabled?: boolean;
}

const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}>
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const ExportButton: React.FC<ExportButtonProps> = ({ canvasRef, disabled }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fileName, setFileName] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleOpen = useCallback(() => {
    if (disabled) return;
    setFileName(`墨韵作品_${formatDate(new Date())}`);
    setIsModalOpen(true);
  }, [disabled]);

  const handleClose = useCallback(() => {
    setIsModalOpen(false);
    setIsExporting(false);
  }, []);

  useEffect(() => {
    if (isModalOpen && previewCanvasRef.current && canvasRef.current) {
      const previewCtx = previewCanvasRef.current.getContext('2d');
      const sourceCanvas = canvasRef.current.renderForExport();
      if (previewCtx && sourceCanvas) {
        previewCanvasRef.current.width = previewCanvasRef.current.clientWidth;
        previewCanvasRef.current.height = previewCanvasRef.current.clientHeight;
        previewCtx.drawImage(
          sourceCanvas,
          0, 0, sourceCanvas.width, sourceCanvas.height,
          0, 0, previewCanvasRef.current.width, previewCanvasRef.current.height
        );
      }
    }
  }, [isModalOpen, canvasRef, mounted]);

  const handleExport = useCallback(async () => {
    if (!canvasRef.current || !fileName.trim()) return;
    setIsExporting(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 200));

      const exportCanvas = canvasRef.current.renderForExport();
      const dataUrl = exportCanvas.toDataURL('image/png', 1.0);

      const link = document.createElement('a');
      link.download = `${fileName.trim()}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        handleClose();
      }, 500);
    } catch (error) {
      console.error('Export failed:', error);
      setIsExporting(false);
    }
  }, [canvasRef, fileName, handleClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <>
      <button
        className="btn btn-primary btn-icon"
        onClick={handleOpen}
        disabled={disabled}
        title="导出为PNG图片"
        style={{ padding: '10px 16px', width: 'auto' }}
      >
        <DownloadIcon />
        <span style={{ fontSize: 14 }}>导出</span>
      </button>

      {isModalOpen && (
        <div
          className="modal-overlay active"
          onClick={handleOverlayClick}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 className="modal-title" style={{ marginBottom: 0, textAlign: 'left' }}>导出图片</h2>
              <button
                className="btn btn-icon"
                onClick={handleClose}
                style={{ width: 32, height: 32, padding: 6 }}
              >
                <CloseIcon />
              </button>
            </div>

            <div className="preview-thumbnail">
              <canvas ref={previewCanvasRef} />
            </div>

            <div style={{ marginBottom: 8 }}>
              <label className="control-label" style={{ display: 'block', marginBottom: 6 }}>
                文件名称
              </label>
              <input
                type="text"
                className="name-input"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="请输入文件名称"
                autoFocus
              />
            </div>

            <div style={{
              padding: '10px 14px',
              background: 'rgba(139, 69, 19, 0.05)',
              borderRadius: 8,
              marginBottom: 20,
              fontSize: 12,
              color: 'var(--color-ochre)',
              lineHeight: 1.8
            }}>
              <div>📐 输出尺寸：<strong>1600 × 800 像素</strong>（2倍分辨率）</div>
              <div>🎯 输出格式：<strong>PNG</strong>（300 DPI 高清晰度）</div>
            </div>

            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={handleClose}
                disabled={isExporting}
              >
                取消
              </button>
              <button
                className="btn btn-primary"
                onClick={handleExport}
                disabled={isExporting || !fileName.trim()}
                style={{ position: 'relative' }}
              >
                {isExporting ? (
                  <>
                    <span style={{
                      width: 16,
                      height: 16,
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#fff',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                      display: 'inline-block'
                    }} />
                    导出中...
                  </>
                ) : (
                  <>
                    <DownloadIcon />
                    确认下载
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}${month}${day}_${hours}${minutes}`;
}

export default ExportButton;
