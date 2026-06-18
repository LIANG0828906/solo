import React, { useRef, useEffect, useCallback } from 'react';
import { useStore, Point } from '../store';

const CanvasPanel: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paths = useStore((s) => s.paths);
  const currentPath = useStore((s) => s.currentPath);
  const recognitionResult = useStore((s) => s.recognitionResult);
  const startDrawing = useStore((s) => s.startDrawing);
  const continueDrawing = useStore((s) => s.continueDrawing);
  const stopDrawing = useStore((s) => s.stopDrawing);
  const undo = useStore((s) => s.undo);
  const clearCanvas = useStore((s) => s.clearCanvas);
  const recognize = useStore((s) => s.recognize);
  const selectCandidate = useStore((s) => s.selectCandidate);
  const saveToHistory = useStore((s) => s.saveToHistory);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const drawPoints = (points: Point[]) => {
      if (points.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();
    };

    for (const path of paths) {
      drawPoints(path.points);
    }

    if (currentPath.length > 0) {
      drawPoints(currentPath);
    }
  }, [paths, currentPath]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const point = getCanvasPoint(e);
    startDrawing(point);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    continueDrawing(getCanvasPoint(e));
  };

  const handleMouseUp = () => {
    stopDrawing();
  };

  const handleMouseLeave = () => {
    const { isDrawing } = useStore.getState();
    if (isDrawing) {
      stopDrawing();
    }
  };

  const handleRecognize = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const startTime = performance.now();
    recognize(canvas);
    const elapsed = performance.now() - startTime;

    if (elapsed > 300) {
      console.warn(`Recognition took ${elapsed.toFixed(1)}ms (target: <300ms)`);
    }
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const thumbnail = canvas.toDataURL('image/png');
    saveToHistory(thumbnail);
  };

  const hasPaths = paths.length > 0;
  const hasCandidates = recognitionResult.candidates.length > 0;
  const hasSelected = recognitionResult.selected !== null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{
          borderRadius: '12px',
          border: '8px solid #E0E0E0',
          cursor: 'crosshair',
          maxWidth: '100%',
          height: 'auto',
          touchAction: 'none',
        }}
      />

      <div style={{ display: 'flex', gap: '16px' }}>
        <button
          onClick={undo}
          disabled={!hasPaths}
          style={{
            ...buttonStyle,
            opacity: hasPaths ? 1 : 0.5,
          }}
        >
          撤销
        </button>
        <button
          onClick={handleRecognize}
          disabled={!hasPaths}
          style={{
            ...buttonStyle,
            opacity: hasPaths ? 1 : 0.5,
          }}
        >
          识别
        </button>
        <button
          onClick={clearCanvas}
          disabled={!hasPaths}
          style={{
            ...buttonStyle,
            opacity: hasPaths ? 1 : 0.5,
          }}
        >
          清空
        </button>
      </div>

      {hasCandidates && (
        <div
          style={{
            borderRadius: '8px',
            background: '#F5F5F5',
            padding: '16px',
            minHeight: '60px',
          }}
        >
          <div style={{ fontSize: '14px', color: '#2C3E50', marginBottom: '10px', fontWeight: 600 }}>
            候选结果（点击选择）：
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {recognitionResult.candidates.map((c, i) => (
              <span
                key={i}
                onClick={() => selectCandidate(c)}
                style={{
                  fontFamily: '"SimHei", "Microsoft YaHei", "Heiti SC", sans-serif',
                  fontSize: '20px',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  background: recognitionResult.selected === c ? '#3498DB' : '#FFFFFF',
                  color: recognitionResult.selected === c ? '#FFFFFF' : '#2C3E50',
                  border: recognitionResult.selected === c ? '2px solid #2980B9' : '2px solid #E0E0E0',
                  transition: 'all 0.2s ease-in-out',
                  userSelect: 'none',
                }}
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {hasSelected && (
        <button
          onClick={handleSave}
          style={{
            ...buttonStyle,
            background: 'linear-gradient(135deg, #27AE60, #219A52)',
          }}
        >
          保存到历史
        </button>
      )}
    </div>
  );
};

const buttonStyle: React.CSSProperties = {
  padding: '10px 28px',
  borderRadius: '6px',
  border: 'none',
  background: 'linear-gradient(135deg, #3498DB, #2980B9)',
  color: '#FFFFFF',
  fontSize: '15px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'filter 0.2s ease-in-out',
};

export default CanvasPanel;
