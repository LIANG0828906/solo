import React, { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { ColorItem } from './BrandLibrary';

export type BrushType = 'circle' | 'bevel' | 'flat';

export interface LayerData {
  id: string;
  brandName: string;
  colorName: string;
  colorHex: string;
  opacity: number;
  x: number;
  y: number;
  brushType: BrushType;
  timestamp: number;
}

interface CanvasModuleProps {
  onLayersChange?: (layers: LayerData[]) => void;
}

export interface CanvasModuleRef {
  addLayer: (color: ColorItem, brandName: string, x: number, y: number) => void;
  getLayers: () => LayerData[];
  deleteLayer: (id: string) => void;
  resetCanvas: () => void;
  setBrushType: (type: BrushType) => void;
  setEraserMode: (active: boolean) => void;
  getCanvasSnapshot: () => HTMLCanvasElement | null;
  getCanvasElement: () => HTMLCanvasElement | null;
}

const BRUSH_SIZE = 60;

const CanvasModule = forwardRef<CanvasModuleRef, CanvasModuleProps>(({ onLayersChange }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const [layers, setLayers] = useState<LayerData[]>([]);
  const [brushType, setBrushType] = useState<BrushType>('circle');
  const [eraserMode, setEraserMode] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartTime, setDragStartTime] = useState(0);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
  const [currentDragColor, setCurrentDragColor] = useState<{ color: ColorItem; brandName: string } | null>(null);
  const [resettingColumns, setResettingColumns] = useState<number>(-1);
  const [deletingLayerId, setDeletingLayerId] = useState<string | null>(null);
  const [eraserPositions, setEraserPositions] = useState<{ x: number; y: number; time: number }[]>([]);

  const lastMousePos = useRef({ x: 0, y: 0 });
  const needsRender = useRef(false);
  const currentLayersRef = useRef<LayerData[]>([]);

  useEffect(() => {
    currentLayersRef.current = layers;
    onLayersChange?.(layers);
  }, [layers, onLayersChange]);

  useImperativeHandle(ref, () => ({
    addLayer: (color: ColorItem, brandName: string, x: number, y: number, customOpacity?: number) => {
      const finalOpacity = customOpacity !== undefined ? customOpacity : 0.8;
      const newLayer: LayerData = {
        id: `layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        brandName,
        colorName: color.name,
        colorHex: color.hex,
        opacity: finalOpacity,
        x,
        y,
        brushType,
        timestamp: Date.now()
      };
      setLayers(prev => [...prev, newLayer]);
    },
    getLayers: () => layers,
    deleteLayer: (id: string) => {
      setDeletingLayerId(id);
      setTimeout(() => {
        setLayers(prev => prev.filter(l => l.id !== id));
        setDeletingLayerId(null);
      }, 300);
    },
    resetCanvas: () => {
      const totalColumns = 10;
      let col = 0;
      const animateReset = () => {
        setResettingColumns(col);
        col++;
        if (col <= totalColumns) {
          setTimeout(animateReset, 40);
        } else {
          setLayers([]);
          setScale(1);
          setOffset({ x: 0, y: 0 });
          setTimeout(() => setResettingColumns(-1), 100);
        }
      };
      animateReset();
    },
    setBrushType: (type: BrushType) => setBrushType(type),
    setEraserMode: (active: boolean) => setEraserMode(active),
    getCanvasSnapshot: () => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const snapshot = document.createElement('canvas');
      snapshot.width = canvas.width;
      snapshot.height = canvas.height;
      const ctx = snapshot.getContext('2d');
      if (ctx) {
        drawBackground(ctx, canvas.width, canvas.height);
        drawLayers(ctx, layers);
      }
      return snapshot;
    },
    getCanvasElement: () => canvasRef.current
  }));

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };

  const rgbToHex = (r: number, g: number, b: number) => {
    return '#' + [r, g, b].map(x => {
      const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  };

  const multiplyBlend = (base: number, blend: number) => (base * blend) / 255;
  const linearBurnBlend = (base: number, blend: number) => Math.max(0, base + blend - 255);

  const blendColors = (baseHex: string, blendHex: string, opacity: number) => {
    const base = hexToRgb(baseHex);
    const blend = hexToRgb(blendHex);
    const multiply = {
      r: multiplyBlend(base.r, blend.r),
      g: multiplyBlend(base.g, blend.g),
      b: multiplyBlend(base.b, blend.b)
    };
    const linearBurn = {
      r: linearBurnBlend(base.r, blend.r),
      g: linearBurnBlend(base.g, blend.g),
      b: linearBurnBlend(base.b, blend.b)
    };
    const result = {
      r: multiply.r * 0.6 + linearBurn.r * 0.4,
      g: multiply.g * 0.6 + linearBurn.g * 0.4,
      b: multiply.b * 0.6 + linearBurn.b * 0.4
    };
    const finalColor = {
      r: base.r * (1 - opacity) + result.r * opacity,
      g: base.g * (1 - opacity) + result.g * opacity,
      b: base.b * (1 - opacity) + result.b * opacity
    };
    return rgbToHex(finalColor.r, finalColor.g, finalColor.b);
  };

  const drawBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width);
    gradient.addColorStop(0, '#F5F0E6');
    gradient.addColorStop(1, '#E8DFD0');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = 0.03;
    for (let i = 0; i < width; i += 2) {
      for (let j = 0; j < height; j += 2) {
        if (Math.random() > 0.7) {
          ctx.fillStyle = '#8B7355';
          ctx.fillRect(i, j, 1, 1);
        }
      }
    }
    ctx.globalAlpha = 1;
  };

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (scale < 0.8) return;
    const gridSize = 50 * scale;
    ctx.strokeStyle = 'rgba(180, 170, 150, 0.3)';
    ctx.lineWidth = 0.5;
    for (let x = offset.x % gridSize; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = offset.y % gridSize; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };

  const drawBrushShape = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    type: BrushType,
    color: string,
    opacity: number
  ) => {
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.fillStyle = color;
    ctx.shadowColor = 'rgba(0,0,0,0.1)';
    ctx.shadowBlur = 4;

    switch (type) {
      case 'circle':
        ctx.beginPath();
        ctx.arc(x, y, size / 2, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'bevel':
        ctx.beginPath();
        ctx.moveTo(x - size / 2, y + size / 3);
        ctx.lineTo(x - size / 3, y - size / 2);
        ctx.lineTo(x + size / 2, y - size / 3);
        ctx.lineTo(x + size / 3, y + size / 2);
        ctx.closePath();
        ctx.fill();
        break;
      case 'flat':
        ctx.beginPath();
        ctx.roundRect(x - size / 2, y - size / 4, size, size / 2, 4);
        ctx.fill();
        break;
    }
    ctx.restore();
  };

  const drawLayers = (ctx: CanvasRenderingContext2D, layersToDraw: LayerData[]) => {
    let baseColor = '#F5F0E6';
    const sortedLayers = [...layersToDraw].sort((a, b) => a.timestamp - b.timestamp);
    
    sortedLayers.forEach(layer => {
      const isDeleting = layer.id === deletingLayerId;
      const drawX = layer.x * scale + offset.x;
      const drawY = layer.y * scale + offset.y;
      const drawSize = BRUSH_SIZE * scale;
      const blendColor = blendColors(baseColor, layer.colorHex, layer.opacity);
      
      if (isDeleting) {
        const scaleFactor = 1 + (Date.now() % 300) / 300;
        ctx.save();
        ctx.globalAlpha = 1 - (Date.now() % 300) / 300;
        ctx.strokeStyle = layer.colorHex;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(drawX, drawY, drawSize / 2 * scaleFactor, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else {
        drawBrushShape(ctx, drawX, drawY, drawSize, layer.brushType, blendColor, layer.opacity);
      }
      baseColor = blendColor;
    });
  };

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    drawBackground(ctx, width, height);
    drawGrid(ctx, width, height);

    if (resettingColumns >= 0) {
      const columnWidth = width / 10;
      ctx.save();
      ctx.fillStyle = '#F5F0E6';
      ctx.fillRect(0, 0, resettingColumns * columnWidth, height);
      ctx.restore();
    }

    const activeLayers = layers.filter(l => {
      const layerX = l.x * scale + offset.x;
      const columnWidth = width / 10;
      const columnIndex = Math.floor(layerX / columnWidth);
      return resettingColumns < 0 || columnIndex >= resettingColumns;
    });

    drawLayers(ctx, activeLayers);

    const now = Date.now();
    const activeErasers = eraserPositions.filter(e => now - e.time < 300);
    activeErasers.forEach(e => {
      const progress = (now - e.time) / 300;
      ctx.save();
      ctx.globalAlpha = 1 - progress;
      ctx.fillStyle = '#F5F0E6';
      ctx.beginPath();
      ctx.arc(e.x * scale + offset.x, e.y * scale + offset.y, 10 * scale * (1 + progress), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    if (isDragging && dragPosition && currentDragColor) {
      const elapsed = (now - dragStartTime) / 1000;
      const opacity = Math.min(0.8, 0.2 + (elapsed / 0.7) * 0.6);
      const tempLayer: LayerData = {
        id: 'temp',
        brandName: currentDragColor.brandName,
        colorName: currentDragColor.color.name,
        colorHex: currentDragColor.color.hex,
        opacity,
        x: dragPosition.x,
        y: dragPosition.y,
        brushType,
        timestamp: now
      };
      drawLayers(ctx, [...activeLayers, tempLayer]);
    }
  }, [layers, scale, offset, isDragging, dragPosition, currentDragColor, dragStartTime, brushType, resettingColumns, deletingLayerId, eraserPositions]);

  useEffect(() => {
    const animate = () => {
      if (needsRender.current || isDragging || deletingLayerId || eraserPositions.length > 0 || resettingColumns >= 0) {
        render();
        needsRender.current = false;
      }
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [render, isDragging, deletingLayerId, eraserPositions.length, resettingColumns]);

  useEffect(() => {
    needsRender.current = true;
  }, [layers, scale, offset]);

  useEffect(() => {
    const handleResize = () => {
      needsRender.current = true;
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const screenToCanvas = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left - offset.x) / scale;
    const y = (clientY - rect.top - offset.y) / scale;
    return { x, y };
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData('color'));
      setCurrentDragColor(data);
      setIsDragging(true);
      setDragStartTime(Date.now());
      const pos = screenToCanvas(e.clientX, e.clientY);
      setDragPosition(pos);
    } catch (err) {
      // Not a valid color drag
    }
  };

  const handleDragLeave = () => {
    setIsDragging(false);
    setCurrentDragColor(null);
    setDragPosition(null);
  };

  const handleDrag = (e: React.DragEvent) => {
    if (isDragging) {
      const pos = screenToCanvas(e.clientX, e.clientY);
      setDragPosition(pos);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (currentDragColor && dragPosition) {
      const elapsed = (Date.now() - dragStartTime) / 1000;
      const opacity = Math.min(0.8, 0.2 + (elapsed / 0.7) * 0.6);
      const newLayer: LayerData = {
        id: `layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        brandName: currentDragColor.brandName,
        colorName: currentDragColor.color.name,
        colorHex: currentDragColor.color.hex,
        opacity,
        x: dragPosition.x,
        y: dragPosition.y,
        brushType,
        timestamp: Date.now()
      };
      setLayers(prev => [...prev, newLayer]);
    }
    setIsDragging(false);
    setCurrentDragColor(null);
    setDragPosition(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (eraserMode) {
      const pos = screenToCanvas(e.clientX, e.clientY);
      const eraseRadius = 20;
      setLayers(prev => prev.filter(layer => {
        const dx = layer.x - pos.x;
        const dy = layer.y - pos.y;
        return Math.sqrt(dx * dx + dy * dy) > eraseRadius;
      }));
      setEraserPositions(prev => [...prev, { x: pos.x, y: pos.y, time: Date.now() }]);
      setTimeout(() => {
        setEraserPositions(prev => prev.filter(p => Date.now() - p.time < 300));
      }, 350);
    } else if (e.button === 0 && !isDragging) {
      setIsPanning(true);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      setOffset(prev => ({
        x: prev.x + dx,
        y: prev.y + dy
      }));
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    } else if (eraserMode && e.buttons === 1) {
      const pos = screenToCanvas(e.clientX, e.clientY);
      const eraseRadius = 20;
      setLayers(prev => prev.filter(layer => {
        const dx = layer.x - pos.x;
        const dy = layer.y - pos.y;
        return Math.sqrt(dx * dx + dy * dy) > eraseRadius;
      }));
      setEraserPositions(prev => [...prev, { x: pos.x, y: pos.y, time: Date.now() }]);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => {
      const newScale = Math.max(0.5, Math.min(3, prev * delta));
      return newScale;
    });
  };

  return (
    <div 
      ref={containerRef} 
      style={styles.container}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrag={handleDrag}
      onDrop={handleDrop}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      <canvas
        ref={canvasRef}
        style={{
          ...styles.canvas,
          cursor: eraserMode ? 'cell' : isPanning ? 'grabbing' : 'grab'
        }}
      />
    </div>
  );
});

const styles = {
  container: {
    flex: 1,
    position: 'relative' as const,
    overflow: 'hidden',
    cursor: 'grab',
    transition: 'cursor 0.15s ease'
  },
  canvas: {
    display: 'block',
    width: '100%',
    height: '100%',
    transition: 'transform 0.3s ease'
  }
};

export default CanvasModule;
