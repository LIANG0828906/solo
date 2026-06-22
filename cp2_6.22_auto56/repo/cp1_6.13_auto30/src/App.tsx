import React, { useMemo, useRef, useState, useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { LayoutManager } from './layout/LayoutManager';
import { MaterialPanel } from './components/MaterialPanel';
import { PropertyPanel } from './components/PropertyPanel';
import { Toolbar } from './components/Toolbar';
import { Canvas } from './components/Canvas';
import { MaterialDragItem, ElementType } from './types';
import { ExportService } from './export/ExportService';

const App: React.FC = () => {
  const layoutManager = useMemo(() => new LayoutManager(), []);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');

  React.useEffect(() => {
    return layoutManager.subscribe((s) => {
      setBackgroundColor(s.backgroundColor);
    });
  }, [layoutManager]);

  const handleDropMaterial = useCallback(
    (elementType: MaterialDragItem['elementType'], x: number, y: number) => {
      if (elementType === ElementType.TEXT) {
        layoutManager.addTextElement(x, y);
      } else {
        layoutManager.addImageElement(x, y);
      }
    },
    [layoutManager]
  );

  const handleExport = useCallback(async () => {
    if (!canvasRef.current || isExporting) return;
    setIsExporting(true);
    try {
      const snapshot = layoutManager.getSnapshot();
      const timeout = new Promise<never>(
        (_, reject) =>
          setTimeout(() => reject(new Error('导出超时')),
          10000
      );
      const exportTask = ExportService.exportToPng(canvasRef.current, snapshot);
      const blob = await Promise.race([exportTask, timeout]);
      ExportService.downloadBlob(blob, ExportService.generateFilename());
    } catch (err) {
      console.error('导出失败:', err);
      alert('导出失败，请重试');
    } finally {
      setIsExporting(false);
    }
  }, [layoutManager, isExporting]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div
        style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          color: '#2B3A4D',
          background: '#E8ECF0',
          minWidth: 1280,
        }}
      >
        <Toolbar
          layoutManager={layoutManager}
          onExport={handleExport}
          isExporting={isExporting}
        />

        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          <MaterialPanel />

          <Canvas
            layoutManager={layoutManager}
            backgroundColor={backgroundColor}
            onDropMaterial={handleDropMaterial}
            canvasRef={canvasRef}
          />

          <PropertyPanel layoutManager={layoutManager} />
        </div>

        {isExporting && (
          <ExportOverlay />
        )}
      </div>
    </DndProvider>
  );
};

const ExportOverlay: React.FC = () => (
  <div
    style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(43,58,77,0.5)',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: 16,
      pointerEvents: 'none',
      animation: 'fadeIn 0.2s ease',
    }}
  >
    <div
      style={{
        width: 56,
        height: 56,
        border: '4px solid rgba(255,255,255,0.2)',
        borderTopColor: '#FFFFFF',
        borderRadius: '50%',
        animation: 'spinLoader 0.6s linear infinite',
      }}
    />
    <div
      style={{
        color: '#fff',
        fontSize: 14,
        fontWeight: 600,
        letterSpacing: 1,
        animation: 'pulse 1.2s ease-in-out infinite',
      }}
    >
      生成中...
    </div>
    <div
      style={{
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        marginTop: 4,
      }}
    >
      正在生成高分辨率图片
    </div>
    <style>{`
      @keyframes spinLoader {
        to { transform: rotate(360deg); }
      }
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }
    `}</style>
  </div>
);

export default App;
