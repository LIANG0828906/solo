import React, { useState, useRef, useCallback } from 'react';
import DrawingCanvas, { type DrawingCanvasHandle } from './components/drawingCanvas';
import ToolPanel from './components/toolPanel';
import ExportButton from './components/exportButton';
import { processStrokesAsync, type CalligraphyStyle, type PaperTexture, type ProcessedStroke } from './modules/styleTransfer';
import type { Stroke } from './modules/strokeAnalyzer';

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-2 14a2 2 0 01-2 2H9a2 2 0 01-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a2 2 0 012-2h2a2 2 0 012 2v2" />
  </svg>
);

const UndoIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
    <path d="M3 7v6h6" />
    <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6.7 3L3 13" />
  </svg>
);

const App: React.FC = () => {
  const canvasRef = useRef<DrawingCanvasHandle>(null);

  const [selectedStyle, setSelectedStyle] = useState<CalligraphyStyle>('kaishu');
  const [brushWidth, setBrushWidth] = useState(5);
  const [inkDepth, setInkDepth] = useState(1);
  const [paperTexture, setPaperTexture] = useState<PaperTexture>('rice');
  const [brushColor, setBrushColor] = useState('#1a1a1a');

  const [isConverting, setIsConverting] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [processedStrokes, setProcessedStrokes] = useState<ProcessedStroke[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [comparePosition, setComparePosition] = useState(0.5);

  const hasStrokes = strokes.length > 0;
  const hasProcessed = processedStrokes.length > 0;

  const handleStrokesChange = useCallback((newStrokes: Stroke[]) => {
    setStrokes(newStrokes);
    if (newStrokes.length < strokes.length) {
      setProcessedStrokes([]);
      setShowCompare(false);
    }
  }, [strokes.length]);

  const handleConvert = useCallback(async () => {
    if (!canvasRef.current || isConverting) return;
    
    const currentStrokes = canvasRef.current.getStrokes();
    if (currentStrokes.length === 0) return;

    setIsConverting(true);
    setShowLoading(true);
    setShowCompare(false);

    try {
      const processed = await processStrokesAsync(
        currentStrokes,
        selectedStyle,
      );

      setProcessedStrokes(processed);
      canvasRef.current.setProcessedStrokes(processed);
      setShowCompare(true);
    } catch (error) {
      console.error('Style conversion failed:', error);
    } finally {
      setIsConverting(false);
      setShowLoading(false);
    }
  }, [isConverting, selectedStyle]);

  const handleClear = useCallback(() => {
    if (canvasRef.current) {
      canvasRef.current.clearCanvas();
      setStrokes([]);
      setProcessedStrokes([]);
      setShowCompare(false);
    }
  }, []);

  const handleUndo = useCallback(() => {
    if (canvasRef.current) {
      canvasRef.current.undoStroke();
      setProcessedStrokes([]);
      setShowCompare(false);
    }
  }, []);

  const handleToggleCompare = useCallback(() => {
    setShowCompare(prev => !prev);
  }, []);

  const handleComparePositionChange = useCallback((pos: number) => {
    setComparePosition(pos);
  }, []);

  return (
    <div className="app-container">
      <header className="app-header">
        <div>
          <h1 className="app-title">墨韵</h1>
          <p className="app-subtitle">手写体风格转换与签名设计</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <ExportButton
            canvasRef={canvasRef as React.RefObject<{ renderForExport: () => HTMLCanvasElement }>}
            disabled={!hasStrokes}
          />
        </div>
      </header>

      <div className="main-content">
        <section className="canvas-section">
          <DrawingCanvas
            ref={canvasRef}
            brushColor={brushColor}
            brushWidth={brushWidth}
            inkDepth={inkDepth}
            paperTexture={paperTexture}
            showLoading={showLoading}
            showCompare={showCompare}
            comparePosition={comparePosition}
            onComparePositionChange={handleComparePositionChange}
            processedStrokes={processedStrokes}
            onStrokesChange={handleStrokesChange}
          />

          <div className="canvas-controls">
            <span className="canvas-hint">
              提示：使用鼠标或触控板在画布上书写，速度影响笔触浓淡
            </span>
            <div className="canvas-actions">
              <button
                className="btn btn-secondary"
                onClick={handleUndo}
                disabled={!hasStrokes || isConverting}
                title="撤销上一笔"
              >
                <UndoIcon />
                撤销
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleClear}
                disabled={!hasStrokes || isConverting}
                title="清空画布"
              >
                <TrashIcon />
                清空
              </button>
            </div>
          </div>
        </section>

        <aside>
          <ToolPanel
            selectedStyle={selectedStyle}
            onStyleChange={setSelectedStyle}
            brushWidth={brushWidth}
            onBrushWidthChange={setBrushWidth}
            inkDepth={inkDepth}
            onInkDepthChange={setInkDepth}
            paperTexture={paperTexture}
            onPaperTextureChange={setPaperTexture}
            brushColor={brushColor}
            onBrushColorChange={setBrushColor}
            onConvert={handleConvert}
            isConverting={isConverting}
            hasStrokes={hasStrokes}
            hasProcessed={hasProcessed}
            onToggleCompare={handleToggleCompare}
            showCompare={showCompare}
          />
        </aside>
      </div>
    </div>
  );
};

export default App;
