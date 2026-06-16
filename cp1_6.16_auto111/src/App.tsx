import React, { useRef, useState } from 'react';
import ColorPalette from '@/components/ColorPalette';
import Canvas from '@/components/Canvas';
import { useStore } from '@/store/useStore';
import { generateSvgString } from '@/utils/svgExporter';
import { saveAs } from 'file-saver';
import { toPng } from 'html-to-image';
import { Download, RefreshCw } from 'lucide-react';

const App: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const {
    colors,
    shapes,
    canvasSize,
    regenerateShapes,
    setCanvasSize,
  } = useStore();

  const [widthInput, setWidthInput] = useState(canvasSize.width.toString());
  const [heightInput, setHeightInput] = useState(canvasSize.height.toString());
  const [isExporting, setIsExporting] = useState(false);

  const handleExportSVG = () => {
    setIsExporting(true);
    try {
      const svgString = generateSvgString(colors, shapes, canvasSize);
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      saveAs(blob, 'poster.svg');
    } catch (error) {
      console.error('SVG导出失败:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPNG = async () => {
    setIsExporting(true);
    try {
      const canvasElement = document.querySelector('canvas');
      if (canvasElement) {
        canvasElement.toBlob((blob) => {
          if (blob) {
            saveAs(blob, 'poster.png');
          }
          setIsExporting(false);
        }, 'image/png');
      }
    } catch (error) {
      console.error('PNG导出失败:', error);
      setIsExporting(false);
    }
  };

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWidthInput(e.target.value);
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHeightInput(e.target.value);
  };

  const handleWidthBlur = () => {
    const width = parseInt(widthInput, 10);
    if (!isNaN(width)) {
      setCanvasSize(width, canvasSize.height);
    } else {
      setWidthInput(canvasSize.width.toString());
    }
  };

  const handleHeightBlur = () => {
    const height = parseInt(heightInput, 10);
    if (!isNaN(height)) {
      setCanvasSize(canvasSize.width, height);
    } else {
      setHeightInput(canvasSize.height.toString());
    }
  };

  const handleWidthKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleWidthBlur();
    }
  };

  const handleHeightKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleHeightBlur();
    }
  };

  const handleRegenerate = () => {
    regenerateShapes();
  };

  return (
    <div style={styles.app}>
      <div style={styles.header}>
        <h1 style={styles.title}>情绪调色板与几何海报生成器</h1>
        <div style={styles.exportButtons}>
          <button
            onClick={handleExportSVG}
            disabled={isExporting}
            style={styles.exportButton}
            className="action-button"
          >
            <Download size={16} />
            <span>导出 SVG</span>
          </button>
          <button
            onClick={handleExportPNG}
            disabled={isExporting}
            style={styles.exportButton}
            className="action-button"
          >
            <Download size={16} />
            <span>导出 PNG</span>
          </button>
        </div>
      </div>

      <div style={styles.mainContent}>
        <ColorPalette />
        <div style={styles.canvasSection}>
          <div ref={canvasRef} style={styles.canvasWrapper}>
            <Canvas />
          </div>
          <div style={styles.sizeControls}>
            <div style={styles.sizeControl}>
              <label style={styles.sizeLabel}>宽度 (px)</label>
              <input
                type="number"
                value={widthInput}
                onChange={handleWidthChange}
                onBlur={handleWidthBlur}
                onKeyDown={handleWidthKeyDown}
                min={400}
                max={1920}
                style={styles.sizeInput}
              />
              <span style={styles.sizeHint}>400-1920</span>
            </div>
            <div style={styles.sizeControl}>
              <label style={styles.sizeLabel}>高度 (px)</label>
              <input
                type="number"
                value={heightInput}
                onChange={handleHeightChange}
                onBlur={handleHeightBlur}
                onKeyDown={handleHeightKeyDown}
                min={300}
                max={1080}
                style={styles.sizeInput}
              />
              <span style={styles.sizeHint}>300-1080</span>
            </div>
            <button
              onClick={handleRegenerate}
              style={styles.regenerateButton}
              className="action-button"
            >
              <RefreshCw size={16} />
              <span>重新生成</span>
            </button>
          </div>
          <div style={styles.tips}>
            <p style={styles.tipText}>
              💡 提示：拖拽移动图形 · 双击删除 · Shift+点击空白处新增图形
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  app: {
    minHeight: '100vh',
    backgroundColor: '#1a1a2e',
    display: 'flex',
    flexDirection: 'column',
    color: '#ffffff',
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    backgroundColor: '#16213e',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  title: {
    fontSize: '20px',
    fontWeight: 600,
    margin: 0,
    color: '#ffffff',
  },
  exportButtons: {
    display: 'flex',
    gap: '12px',
  },
  exportButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    backgroundColor: '#4ECDC4',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'filter 0.15s ease, transform 0.1s ease',
  },
  mainContent: {
    display: 'flex',
    flex: 1,
    padding: '20px',
    gap: '20px',
    overflow: 'hidden',
  },
  canvasSection: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#16213e',
    borderRadius: '12px',
    overflow: 'hidden',
  },
  canvasWrapper: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    margin: '20px',
    borderRadius: '8px',
    overflow: 'auto',
  },
  sizeControls: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '20px',
    padding: '16px 20px',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderTop: '1px solid rgba(255,255,255,0.05)',
  },
  sizeControl: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  sizeLabel: {
    fontSize: '12px',
    color: '#8892b0',
  },
  sizeInput: {
    width: '100px',
    padding: '8px 12px',
    backgroundColor: '#1a1a2e',
    color: '#ffffff',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
  },
  sizeHint: {
    fontSize: '11px',
    color: '#5a6a8a',
  },
  regenerateButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
