import { useEffect, useRef } from 'react';
import { SelectedPathInfo } from '../modules/ThreeRenderer';
import { extractPathSegment } from '../modules/CanvasParser';

interface InfoPopupProps {
  info: SelectedPathInfo;
  originalImage: HTMLCanvasElement | null;
  onClose: () => void;
}

export function InfoPopup({ info, originalImage, onClose }: InfoPopupProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!canvasRef.current || !originalImage) return;
    
    const segmentCanvas = extractPathSegment(originalImage, info.path);
    const ctx = canvasRef.current.getContext('2d')!;
    
    canvasRef.current.width = segmentCanvas.width;
    canvasRef.current.height = segmentCanvas.height;
    
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.drawImage(segmentCanvas, 0, 0);
    
    const containerWidth = 288;
    const containerHeight = 120;
    const scale = Math.min(
      containerWidth / segmentCanvas.width,
      containerHeight / segmentCanvas.height
    );
    
    canvasRef.current.style.width = `${segmentCanvas.width * scale}px`;
    canvasRef.current.style.height = `${segmentCanvas.height * scale}px`;
  }, [info, originalImage]);
  
  return (
    <div className="info-popup">
      <div className="popup-title">
        <span>线轨详情</span>
        <button className="popup-close" onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <canvas
        ref={canvasRef}
        className="popup-canvas"
        style={{
          display: 'block',
          margin: '0 auto 12px auto',
          objectFit: 'contain'
        }}
      />
      
      <div className="popup-stats">
        <div className="stat-item">
          <div className="stat-label">路径点数量</div>
          <div className="stat-value">{info.pointCount}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">曲线长度</div>
          <div className="stat-value">{info.length}px</div>
        </div>
      </div>
    </div>
  );
}
