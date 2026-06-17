import React, { useRef, useEffect, useState, useCallback } from 'react';
import { usePoemStore, Imagery } from '../stores/poemStore';
import { parsePoem } from '../engine/poemParser';
import { renderCanvas, getImageryAtPosition } from '../renderer/canvasRenderer';
import InfoCard from './InfoCard';
import './App.css';

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    poemText,
    imageries,
    selectedImageryId,
    setPoemText,
    setImageries,
    updateImagery,
    selectImagery,
    clearCanvas,
  } = usePoemStore();

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set());
  const [infoCardPos, setInfoCardPos] = useState<{ x: number; y: number } | null>(null);
  const lastClickTimeRef = useRef<number>(0);
  const lastClickImageryRef = useRef<string | null>(null);

  const selectedImagery = imageries.find((img) => img.id === selectedImageryId) || null;

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCanvasSize({
          width: Math.max(600, rect.width),
          height: Math.max(500, rect.height),
        });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasSize.width * dpr;
    canvas.height = canvasSize.height * dpr;
    canvas.style.width = `${canvasSize.width}px`;
    canvas.style.height = `${canvasSize.height}px`;
    ctx.scale(dpr, dpr);

    renderCanvas(ctx, canvasSize.width, canvasSize.height, imageries, {
      draggingId,
      dragPosition,
    });
  }, [canvasSize, imageries, draggingId, dragPosition]);

  const easeOut = (t: number): number => 1 - Math.pow(1 - t, 3);

  const animateToPosition = useCallback(
    (id: string, fromX: number, fromY: number, toX: number, toY: number) => {
      const duration = 300;
      const startTime = performance.now();
      setAnimatingIds((prev) => new Set(prev).add(id));

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeOut(progress);
        const currentX = fromX + (toX - fromX) * eased;
        const currentY = fromY + (toY - fromY) * eased;

        updateImagery(id, { position: { x: currentX, y: currentY } });

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setAnimatingIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        }
      };

      requestAnimationFrame(animate);
    },
    [updateImagery]
  );

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (animatingIds.size > 0) return;
    const { x, y } = getCanvasCoords(e);
    const imagery = getImageryAtPosition(imageries, x, y);

    if (imagery) {
      const now = performance.now();
      if (
        lastClickTimeRef.current &&
        now - lastClickTimeRef.current < 300 &&
        lastClickImageryRef.current === imagery.id
      ) {
        selectImagery(imagery.id);
        setInfoCardPos({ x, y });
        lastClickTimeRef.current = 0;
        lastClickImageryRef.current = null;
        return;
      }
      lastClickTimeRef.current = now;
      lastClickImageryRef.current = imagery.id;

      setDraggingId(imagery.id);
      setDragPosition({ x, y });
      setDragOffset({
        x: x - imagery.position.x,
        y: y - imagery.position.y,
      });
    } else {
      selectImagery(null);
      setInfoCardPos(null);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);
    const canvas = canvasRef.current;
    if (canvas) {
      const hovered = getImageryAtPosition(imageries, x, y);
      canvas.style.cursor = hovered ? 'grab' : 'default';
    }

    if (draggingId) {
      const newX = Math.max(30, Math.min(canvasSize.width - 30, x - dragOffset.x));
      const newY = Math.max(30, Math.min(canvasSize.height - 30, y - dragOffset.y));
      setDragPosition({ x: newX, y: newY });
      if (canvas) {
        canvas.style.cursor = 'grabbing';
      }
    }
  };

  const handleCanvasMouseUp = () => {
    if (draggingId && dragPosition) {
      const imagery = imageries.find((img) => img.id === draggingId);
      if (imagery) {
        animateToPosition(
          draggingId,
          imagery.position.x,
          imagery.position.y,
          dragPosition.x,
          dragPosition.y
        );
      }
    }
    setDraggingId(null);
    setDragPosition(null);
  };

  const handleGenerate = () => {
    const parsed = parsePoem(poemText);
    setImageries(parsed);
    setInfoCardPos(null);
  };

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = '诗词画境.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleSelectSimilarPoem = (poem: string) => {
    setPoemText(poem);
    const parsed = parsePoem(poem);
    setImageries(parsed);
    setInfoCardPos(null);
  };

  const handleSliderChange = (id: string, field: 'posX' | 'posY' | 'size' | 'opacity', value: number) => {
    const imagery = imageries.find((img) => img.id === id);
    if (!imagery) return;

    if (field === 'posX') {
      updateImagery(id, { position: { ...imagery.position, x: 300 + value } });
    } else if (field === 'posY') {
      updateImagery(id, { position: { ...imagery.position, y: 250 + value } });
    } else if (field === 'size') {
      updateImagery(id, { size: value });
    } else if (field === 'opacity') {
      updateImagery(id, { opacity: value });
    }
  };

  return (
    <div className="app">
      <div className="toolbar">
        <button className="toolbar-btn primary" onClick={handleGenerate}>
          生成诗画
        </button>
        <button className="toolbar-btn primary" onClick={handleExport}>
          导出图片
        </button>
        <button className="toolbar-btn danger" onClick={clearCanvas}>
          清空画布
        </button>
      </div>

      <div className="main-content">
        <div className="input-panel">
          <div className="panel-title">诗词输入</div>
          <textarea
            className="poem-input"
            value={poemText}
            onChange={(e) => setPoemText(e.target.value)}
            placeholder="请输入一句古诗词..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                handleGenerate();
              }
            }}
          />
          <div className="input-hint">提示：输入诗句后点击"生成诗画"或按 Ctrl+Enter</div>
          <div className="example-poems">
            <div className="example-title">示例诗句：</div>
            {['两个黄鹂鸣翠柳', '床前明月光', '孤舟蓑笠翁', '竹外桃花三两枝'].map((p) => (
              <button
                key={p}
                className="example-btn"
                onClick={() => {
                  setPoemText(p);
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="canvas-panel" ref={containerRef}>
          <canvas
            ref={canvasRef}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
          />
          {selectedImagery && infoCardPos && (
            <InfoCard
              imagery={selectedImagery}
              position={infoCardPos}
              onClose={() => {
                selectImagery(null);
                setInfoCardPos(null);
              }}
              onSelectPoem={handleSelectSimilarPoem}
            />
          )}
        </div>

        <div className="palette-panel">
          <div className="panel-title">意象调色板</div>
          {imageries.length === 0 ? (
            <div className="empty-palette">暂无意象，请先输入诗句并生成</div>
          ) : (
            <div className="imagery-list">
              {imageries.map((imagery) => (
                <div
                  key={imagery.id}
                  className={`imagery-card ${
                    selectedImageryId === imagery.id ? 'selected' : ''
                  }`}
                  onClick={() => selectImagery(imagery.id)}
                >
                  <div className="imagery-color" style={{ background: imagery.color }} />
                  <div className="imagery-info">
                    <div className="imagery-name">{imagery.name}</div>
                    <div className="imagery-mini-preview">
                      <div
                        className="mini-dot"
                        style={{ background: imagery.color, opacity: imagery.opacity, transform: `scale(${imagery.size})` }}
                      />
                    </div>
                  </div>
                  {selectedImageryId === imagery.id && (
                    <div className="imagery-controls">
                      <div className="control-row">
                        <span className="control-label">水平</span>
                        <input
                          type="range"
                          min="-50"
                          max="50"
                          step="1"
                          value={Math.round(imagery.position.x - 300)}
                          onChange={(e) =>
                            handleSliderChange(imagery.id, 'posX', Number(e.target.value))
                          }
                          className="control-slider"
                        />
                      </div>
                      <div className="control-row">
                        <span className="control-label">垂直</span>
                        <input
                          type="range"
                          min="-50"
                          max="50"
                          step="1"
                          value={Math.round(imagery.position.y - 250)}
                          onChange={(e) =>
                            handleSliderChange(imagery.id, 'posY', Number(e.target.value))
                          }
                          className="control-slider"
                        />
                      </div>
                      <div className="control-row">
                        <span className="control-label">大小</span>
                        <input
                          type="range"
                          min="0.5"
                          max="2"
                          step="0.1"
                          value={imagery.size}
                          onChange={(e) =>
                            handleSliderChange(imagery.id, 'size', Number(e.target.value))
                          }
                          className="control-slider"
                        />
                      </div>
                      <div className="control-row">
                        <span className="control-label">透明度</span>
                        <input
                          type="range"
                          min="0.1"
                          max="1"
                          step="0.1"
                          value={imagery.opacity}
                          onChange={(e) =>
                            handleSliderChange(imagery.id, 'opacity', Number(e.target.value))
                          }
                          className="control-slider"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
