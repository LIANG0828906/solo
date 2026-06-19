import { useRef, useEffect, useCallback, useState } from 'react';
import { useMapStore } from './store';
import {
  GRID_SIZE,
  CELL_SIZE,
  CANVAS_BG_COLOR,
  GRID_BG_COLOR,
  PRESET_COLORS,
} from './types';

const Canvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawing = useRef(false);
  const isPanning = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const lastGridPos = useRef({ x: -1, y: -1 });
  const animationRef = useRef<number>(0);

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const {
    mapData,
    currentTool,
    brushColor,
    selectedTileId,
    tiles,
    zoom,
    offsetX,
    offsetY,
    selection,
    isSelecting,
    setZoom,
    setOffset,
    drawPixel,
    erasePixel,
    startSelection,
    updateSelection,
    endSelection,
    drawTile,
    pushHistory,
  } = useMapStore();

  const selectedTile = tiles.find((t) => t.id === selectedTileId);

  useEffect(() => {
    let attempts = 0;
    const tryCenter = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        if (attempts < 20) {
          attempts++;
          requestAnimationFrame(tryCenter);
        }
        return;
      }

      const gridPixelWidth = GRID_SIZE * CELL_SIZE * zoom;
      const gridPixelHeight = GRID_SIZE * CELL_SIZE * zoom;
      const centerX = (rect.width - gridPixelWidth) / 2;
      const centerY = (rect.height - gridPixelHeight) / 2;

      setOffset(centerX, centerY);
    };

    tryCenter();
  }, []);

  const screenToGrid = useCallback(
    (screenX: number, screenY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: -1, y: -1 };

      const rect = canvas.getBoundingClientRect();
      const x = (screenX - rect.left - offsetX) / (zoom * CELL_SIZE);
      const y = (screenY - rect.top - offsetY) / (zoom * CELL_SIZE);

      return { x: Math.floor(x), y: Math.floor(y) };
    },
    [zoom, offsetX, offsetY]
  );

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;

    ctx.fillStyle = CANVAS_BG_COLOR;
    ctx.fillRect(0, 0, rect.width, rect.height);

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(zoom, zoom);

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const color = mapData[y][x];
        ctx.fillStyle = color;
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 1 / zoom;
    for (let x = 0; x <= GRID_SIZE; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL_SIZE, 0);
      ctx.lineTo(x * CELL_SIZE, GRID_SIZE * CELL_SIZE);
      ctx.stroke();
    }
    for (let y = 0; y <= GRID_SIZE; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL_SIZE);
      ctx.lineTo(GRID_SIZE * CELL_SIZE, y * CELL_SIZE);
      ctx.stroke();
    }

    if (selection) {
      const minX = Math.min(selection.startX, selection.endX);
      const maxX = Math.max(selection.startX, selection.endX);
      const minY = Math.min(selection.startY, selection.endY);
      const maxY = Math.max(selection.startY, selection.endY);

      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2 / zoom;
      ctx.setLineDash([4 / zoom, 4 / zoom]);
      ctx.strokeRect(
        minX * CELL_SIZE,
        minY * CELL_SIZE,
        (maxX - minX + 1) * CELL_SIZE,
        (maxY - minY + 1) * CELL_SIZE
      );
      ctx.setLineDash([]);
    }

    if (currentTool === 'tile' && selectedTile) {
      const gridPos = screenToGrid(lastPos.current.x, lastPos.current.y);
      if (gridPos.x >= 0 && gridPos.y >= 0) {
        ctx.globalAlpha = 0.6;
        for (let ty = 0; ty < selectedTile.height; ty++) {
          for (let tx = 0; tx < selectedTile.width; tx++) {
            ctx.fillStyle = selectedTile.data[ty][tx];
            ctx.fillRect(
              (gridPos.x + tx) * CELL_SIZE,
              (gridPos.y + ty) * CELL_SIZE,
              CELL_SIZE,
              CELL_SIZE
            );
          }
        }
        ctx.globalAlpha = 1;
      }
    }

    if (currentTool === 'brush') {
      const gridPos = screenToGrid(lastPos.current.x, lastPos.current.y);
      if (gridPos.x >= 0 && gridPos.y >= 0 && gridPos.x < GRID_SIZE && gridPos.y < GRID_SIZE) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2 / zoom;
        ctx.strokeRect(
          gridPos.x * CELL_SIZE,
          gridPos.y * CELL_SIZE,
          CELL_SIZE,
          CELL_SIZE
        );
      }
    }

    ctx.restore();

    animationRef.current = requestAnimationFrame(render);
  }, [mapData, zoom, offsetX, offsetY, selection, currentTool, selectedTile, screenToGrid]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationRef.current);
  }, [render]);

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    lastPos.current = { x: e.clientX, y: e.clientY };

    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      isPanning.current = true;
      canvas.style.cursor = 'grabbing';
      return;
    }

    const gridPos = screenToGrid(e.clientX, e.clientY);
    setMousePos(gridPos);

    if (currentTool === 'select') {
      startSelection(gridPos.x, gridPos.y);
      isDrawing.current = true;
    } else if (currentTool === 'brush') {
      pushHistory();
      isDrawing.current = true;
      lastGridPos.current = { x: -1, y: -1 };
      if (e.shiftKey) {
        erasePixel(gridPos.x, gridPos.y);
      } else {
        drawPixel(gridPos.x, gridPos.y, brushColor);
      }
      lastGridPos.current = gridPos;
    } else if (currentTool === 'tile' && selectedTile) {
      pushHistory();
      drawTile(gridPos.x, gridPos.y, selectedTile);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gridPos = screenToGrid(e.clientX, e.clientY);
    setMousePos(gridPos);

    if (isPanning.current) {
      const dx = e.clientX - lastPos.current.x;
      const dy = e.clientY - lastPos.current.y;
      setOffset(offsetX + dx, offsetY + dy);
      lastPos.current = { x: e.clientX, y: e.clientY };
      return;
    }

    lastPos.current = { x: e.clientX, y: e.clientY };

    if (!isDrawing.current) return;

    if (currentTool === 'select') {
      updateSelection(gridPos.x, gridPos.y);
    } else if (currentTool === 'brush') {
      if (gridPos.x === lastGridPos.current.x && gridPos.y === lastGridPos.current.y) return;

      const x0 = lastGridPos.current.x;
      const y0 = lastGridPos.current.y;
      const x1 = gridPos.x;
      const y1 = gridPos.y;

      const dx = Math.abs(x1 - x0);
      const dy = Math.abs(y1 - y0);
      const sx = x0 < x1 ? 1 : -1;
      const sy = y0 < y1 ? 1 : -1;
      let err = dx - dy;

      let px = x0;
      let py = y0;

      while (true) {
        if (e.shiftKey) {
          erasePixel(px, py);
        } else {
          drawPixel(px, py, brushColor);
        }

        if (px === x1 && py === y1) break;
        const e2 = 2 * err;
        if (e2 > -dy) {
          err -= dy;
          px += sx;
        }
        if (e2 < dx) {
          err += dx;
          py += sy;
        }
      }

      lastGridPos.current = gridPos;
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isPanning.current) {
      isPanning.current = false;
      canvas.style.cursor = 'default';
      return;
    }

    if (isDrawing.current) {
      isDrawing.current = false;
      if (currentTool === 'select') {
        endSelection();
      }
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(0.5, Math.min(3, zoom + delta));

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const scaleRatio = newZoom / zoom;
    const newOffsetX = mouseX - (mouseX - offsetX) * scaleRatio;
    const newOffsetY = mouseY - (mouseY - offsetY) * scaleRatio;

    setZoom(newZoom);
    setOffset(newOffsetX, newOffsetY);
  };

  const handleMouseLeave = () => {
    isDrawing.current = false;
    isPanning.current = false;
    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'default';
    }
  };

  const getColorName = (color: string): string => {
    const index = PRESET_COLORS.findIndex((c) => c.toLowerCase() === color.toLowerCase());
    if (index !== -1) {
      const names = ['红', '绿', '蓝', '黄', '紫', '橙', '青', '粉', '褐', '白', '浅灰', '黑'];
      return names[index];
    }
    return color;
  };

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: CANVAS_BG_COLOR,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          cursor: currentTool === 'select' ? 'crosshair' : 'default',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          backgroundColor: '#fff',
          color: '#000',
          padding: '4px 8px',
          fontSize: '12px',
          fontFamily: 'monospace',
          borderRadius: '4px',
          pointerEvents: 'none',
          imageRendering: 'pixelated',
        }}
      >
        坐标: ({mousePos.x}, {mousePos.y}) | 缩放: {(zoom * 100).toFixed(0)}%
        {currentTool === 'brush' && ` | 笔刷: ${getColorName(brushColor)}`}
        {currentTool === 'tile' && selectedTile && ` | 图块: ${selectedTile.name}`}
      </div>
    </div>
  );
};

export default Canvas;
