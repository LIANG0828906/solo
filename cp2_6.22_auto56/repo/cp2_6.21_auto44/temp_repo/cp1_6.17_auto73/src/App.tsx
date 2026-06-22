import { useState, useCallback, useRef, useEffect } from 'react';
import { useReviewStore } from './store/reviewStore';
import { LoaderPanel } from './modules/loader/LoaderPanel';
import { ComparisonView } from './modules/comparator/ComparisonView';
import { exportReport } from './modules/comparator/ReportExporter';

export default function App() {
  const { sketchPair, isCompared, isComparing, clearAll, diffPixels, diffPercentage, annotations } = useReviewStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [leftWidth, setLeftWidth] = useState(50);
  const [isResizing, setIsResizing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const leftCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rightCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const canCompare = sketchPair.left !== null && sketchPair.right !== null && !isComparing;
  const canExport = isCompared && annotations.length > 0;

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
    setLeftWidth(Math.max(20, Math.min(80, newWidth)));
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportReport({
        leftCanvasRef: leftCanvasRef.current,
        rightCanvasRef: rightCanvasRef.current,
        annotations,
        diffPixels,
        diffPercentage,
      });
    } catch (err) {
      console.error('Export failed:', err);
      alert('导出报告失败，请重试');
    } finally {
      setIsExporting(false);
    }
  };

  const leftDimensions = sketchPair.leftDimensions;
  const displayWidth = leftDimensions?.width || 0;
  const displayHeight = leftDimensions?.height || 0;

  const statusText = `草图尺寸：${displayWidth}x${displayHeight} | 差异像素数：${diffPixels.length.toLocaleString()}`;

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="navbar-left">
          <span className="app-title">UI Diff Reviewer</span>
        </div>
        <div className={`navbar-right ${menuOpen ? 'mobile-open' : ''}`}>
          <button
            className="btn btn-primary"
            disabled={!canCompare}
            onClick={() => window.dispatchEvent(new Event('run-comparison'))}
          >
            {isComparing ? '对比中...' : '对比差异'}
          </button>
          <button
            className="btn btn-primary"
            disabled={!canExport || isExporting}
            onClick={handleExport}
          >
            {isExporting ? '导出中...' : '导出报告'}
          </button>
          <button className="btn btn-secondary" onClick={clearAll}>
            清空
          </button>
        </div>
        <button className="hamburger-menu" onClick={() => setMenuOpen(!menuOpen)}>
          <span></span>
          <span></span>
          <span></span>
        </button>
      </nav>

      <div className="main-content" ref={containerRef}>
        <div className="splitter-container">
          <div className="panel" style={{ width: `${leftWidth}%` }}>
            <div className="panel-tabs">
              <div className="tab active">
                <span>左侧草图</span>
                <div className="tab-indicator"></div>
              </div>
            </div>
            <div className="panel-content">
              <LoaderPanel side="left" canvasRef={leftCanvasRef} />
            </div>
          </div>

          <div
            className={`divider ${isResizing ? 'divider-active' : ''}`}
            onMouseDown={() => setIsResizing(true)}
          />

          <div className="panel" style={{ width: `${100 - leftWidth}%` }}>
            <div className="panel-tabs">
              <div className="tab active">
                <span>右侧草图</span>
                <div className="tab-indicator"></div>
              </div>
            </div>
            <div className="panel-content">
              <ComparisonView rightCanvasRef={rightCanvasRef} />
            </div>
          </div>
        </div>
      </div>

      <footer className="status-bar">
        <span>{statusText}</span>
      </footer>
    </div>
  );
}
