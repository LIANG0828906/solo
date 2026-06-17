import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useStore } from './store';
import { Layer, FilterConfig } from './types';

type HandleType = 'tl' | 'tr' | 'bl' | 'br' | 'ml' | 'mr' | 'mt' | 'mb' | 'move' | 'rotate' | null;

interface DragState {
  isDragging: boolean;
  handleType: HandleType;
  startX: number;
  startY: number;
  startLayerX: number;
  startLayerY: number;
  startLayerWidth: number;
  startLayerHeight: number;
  startRotation: number;
}

const HANDLE_SIZE = 8;

const buildFilterString = (filter: FilterConfig): string => {
  const parts: string[] = [];
  if (filter.brightness !== 100) parts.push(`brightness(${filter.brightness}%)`);
  if (filter.contrast !== 100) parts.push(`contrast(${filter.contrast}%)`);
  if (filter.hueRotate !== 0) parts.push(`hue-rotate(${filter.hueRotate}deg)`);
  if (filter.saturate !== 100) parts.push(`saturate(${filter.saturate}%)`);
  if (filter.blur > 0) parts.push(`blur(${filter.blur}px)`);
  if (filter.sepia > 0) parts.push(`sepia(${filter.sepia}%)`);
  if (filter.grayscale > 0) parts.push(`grayscale(${filter.grayscale}%)`);
  return parts.join(' ');
};

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

const imageCache = new Map<string, HTMLImageElement>();

const CanvasPreview: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [canvasPixelWidth, setCanvasPixelWidth] = useState(0);
  const [canvasPixelHeight, setCanvasPixelHeight] = useState(0);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    handleType: null,
    startX: 0,
    startY: 0,
    startLayerX: 0,
    startLayerY: 0,
    startLayerWidth: 0,
    startLayerHeight: 0,
    startRotation: 0,
  });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const layers = useStore((state) => state.layers);
  const selectedLayerId = useStore((state) => state.selectedLayerId);
  const canvas = useStore((state) => state.canvas);
  const selectLayer = useStore((state) => state.selectLayer);
  const updateLayer = useStore((state) => state.updateLayer);

  const getCanvasCoordinates = useCallback((clientX: number, clientY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left - offsetX) / scale,
      y: (clientY - rect.top - offsetY) / scale,
    };
  }, [scale, offsetX, offsetY]);

  const draw = useCallback(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !canvasRef.current || canvasPixelWidth === 0 || canvasPixelHeight === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const cssWidth = canvasPixelWidth / dpr;
    const cssHeight = canvasPixelHeight / dpr;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvasPixelWidth, canvasPixelHeight);

    ctx.scale(dpr, dpr);
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const layer of layers) {
      ctx.save();

      const centerX = layer.x + layer.width / 2;
      const centerY = layer.y + layer.height / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate((layer.rotation * Math.PI) / 180);
      ctx.translate(-centerX, -centerY);
      ctx.globalAlpha = layer.opacity;

      const filterStr = buildFilterString(layer.filter);
      if (filterStr) {
        ctx.filter = filterStr;
      }

      if (layer.type === 'image' && layer.src) {
        const img = imageCache.get(layer.src);
        if (img) {
          ctx.drawImage(img, layer.x, layer.y, layer.width, layer.height);
        }
      } else if (layer.type === 'text' && layer.textConfig) {
        const tc = layer.textConfig;
        ctx.font = `${tc.fontWeight} ${tc.fontSize}px ${tc.fontFamily}`;
        ctx.fillStyle = tc.color;
        ctx.textAlign = tc.textAlign;
        ctx.textBaseline = 'top';
        ctx.globalAlpha = tc.opacity * layer.opacity;

        let textX = layer.x;
        if (tc.textAlign === 'center') {
          textX = layer.x + layer.width / 2;
        } else if (tc.textAlign === 'right') {
          textX = layer.x + layer.width;
        }

        const lines = tc.content.split('\n');
        const lineHeight = tc.fontSize * 1.2;
        lines.forEach((line, i) => {
          ctx.fillText(line, textX, layer.y + i * lineHeight);
        });
      }

      ctx.restore();

      if (layer.id === selectedLayerId) {
        ctx.save();
        ctx.strokeStyle = '#1976D2';
        ctx.lineWidth = 2 / scale;
        ctx.setLineDash([6 / scale, 4 / scale]);
        ctx.strokeRect(layer.x, layer.y, layer.width, layer.height);

        ctx.setLineDash([]);
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#1976D2';
        ctx.lineWidth = 1 / scale;

        const handles = [
          { x: layer.x, y: layer.y },
          { x: layer.x + layer.width, y: layer.y },
          { x: layer.x, y: layer.y + layer.height },
          { x: layer.x + layer.width, y: layer.y + layer.height },
          { x: layer.x + layer.width / 2, y: layer.y },
          { x: layer.x + layer.width / 2, y: layer.y + layer.height },
          { x: layer.x, y: layer.y + layer.height / 2 },
          { x: layer.x + layer.width, y: layer.y + layer.height / 2 },
        ];

        const hs = HANDLE_SIZE / scale;
        handles.forEach(h => {
          ctx.fillRect(h.x - hs / 2, h.y - hs / 2, hs, hs);
          ctx.strokeRect(h.x - hs / 2, h.y - hs / 2, hs, hs);
        });

        const rotateY = layer.y - 30 / scale;
        const rotateX = layer.x + layer.width / 2;
        ctx.beginPath();
        ctx.arc(rotateX, rotateY, 6 / scale, 0, Math.PI * 2);
        ctx.fillStyle = '#1976D2';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2 / scale;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(rotateX, rotateY + 6 / scale);
        ctx.lineTo(rotateX, layer.y);
        ctx.strokeStyle = '#1976D2';
        ctx.lineWidth = 1 / scale;
        ctx.setLineDash([3 / scale, 3 / scale]);
        ctx.stroke();

        ctx.restore();
      }
    }

  }, [layers, selectedLayerId, scale, offsetX, offsetY, canvas.width, canvas.height, canvasPixelWidth, canvasPixelHeight]);

  useEffect(() => {
    const loadImages = async () => {
      for (const layer of layers) {
        if (layer.type === 'image' && layer.src && !imageCache.has(layer.src)) {
          try {
            const img = await loadImage(layer.src);
            imageCache.set(layer.src, img);
          } catch (e) {
            console.error('Failed to load image:', layer.src);
          }
        }
      }
    };
    loadImages();
  }, [layers]);

  useEffect(() => {
    let rafId: number;
    let lastTime = 0;
    const targetFps = 60;
    const interval = 1000 / targetFps;

    const render = (timestamp: number) => {
      if (timestamp - lastTime >= interval) {
        draw();
        lastTime = timestamp;
      }
      rafId = requestAnimationFrame(render);
    };
    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [draw]);

  const updateSize = useCallback(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const container = containerRef.current;
    const containerWidth = container.clientWidth - 40;
    const containerHeight = container.clientHeight - 40;

    if (containerWidth <= 0 || containerHeight <= 0) return;

    const scaleX = containerWidth / canvas.width;
    const scaleY = containerHeight / canvas.height;
    const newScale = Math.min(scaleX, scaleY, 1);

    const displayWidth = canvas.width * newScale;
    const displayHeight = canvas.height * newScale;

    const dpr = window.devicePixelRatio || 1;
    const pixelWidth = container.clientWidth * dpr;
    const pixelHeight = container.clientHeight * dpr;

    setScale(newScale);
    setOffsetX((container.clientWidth - displayWidth) / 2);
    setOffsetY((container.clientHeight - displayHeight) / 2);

    canvasRef.current.width = pixelWidth;
    canvasRef.current.height = pixelHeight;
    canvasRef.current.style.width = `${container.clientWidth}px`;
    canvasRef.current.style.height = `${container.clientHeight}px`;

    setCanvasPixelWidth(pixelWidth);
    setCanvasPixelHeight(pixelHeight);
  }, [canvas.width, canvas.height]);

  useEffect(() => {
    updateSize();

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener('resize', updateSize);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, [updateSize]);

  const getHandleAtPosition = useCallback((x: number, y: number): HandleType => {
    if (!selectedLayerId) return null;

    const selected = layers.find(l => l.id === selectedLayerId);
    if (!selected) return null;

    const hs = HANDLE_SIZE / scale;

    const handles: Array<{ x: number; y: number; type: HandleType }> = [
      { x: selected.x, y: selected.y, type: 'tl' },
      { x: selected.x + selected.width, y: selected.y, type: 'tr' },
      { x: selected.x, y: selected.y + selected.height, type: 'bl' },
      { x: selected.x + selected.width, y: selected.y + selected.height, type: 'br' },
      { x: selected.x + selected.width / 2, y: selected.y, type: 'mt' },
      { x: selected.x + selected.width / 2, y: selected.y + selected.height, type: 'mb' },
      { x: selected.x, y: selected.y + selected.height / 2, type: 'ml' },
      { x: selected.x + selected.width, y: selected.y + selected.height / 2, type: 'mr' },
    ];

    for (const h of handles) {
      if (
        x >= h.x - hs && x <= h.x + hs &&
        y >= h.y - hs && y <= h.y + hs
      ) {
        return h.type;
      }
    }

    const rotateY = selected.y - 30 / scale;
    const rotateX = selected.x + selected.width / 2;
    const dist = Math.sqrt((x - rotateX) ** 2 + (y - rotateY) ** 2);
    if (dist <= 10 / scale) {
      return 'rotate';
    }

    if (
      x >= selected.x && x <= selected.x + selected.width &&
      y >= selected.y && y <= selected.y + selected.height
    ) {
      return 'move';
    }

    return null;
  }, [selectedLayerId, layers, scale]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const { x, y } = getCanvasCoordinates(e.clientX, e.clientY);

    const handleType = getHandleAtPosition(x, y);

    if (handleType && selectedLayerId) {
      const selected = layers.find(l => l.id === selectedLayerId);
      if (selected) {
        setDragState({
          isDragging: true,
          handleType,
          startX: x,
          startY: y,
          startLayerX: selected.x,
          startLayerY: selected.y,
          startLayerWidth: selected.width,
          startLayerHeight: selected.height,
          startRotation: selected.rotation,
        });
      }
    } else {
      let clickedLayer: Layer | null = null;
      for (let i = layers.length - 1; i >= 0; i--) {
        const layer = layers[i];
        if (
          x >= layer.x && x <= layer.x + layer.width &&
          y >= layer.y && y <= layer.y + layer.height
        ) {
          clickedLayer = layer;
          break;
        }
      }
      selectLayer(clickedLayer ? clickedLayer.id : null);

      if (clickedLayer) {
        setDragState({
          isDragging: true,
          handleType: 'move',
          startX: x,
          startY: y,
          startLayerX: clickedLayer.x,
          startLayerY: clickedLayer.y,
          startLayerWidth: clickedLayer.width,
          startLayerHeight: clickedLayer.height,
          startRotation: clickedLayer.rotation,
        });
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const { x, y } = getCanvasCoordinates(e.clientX, e.clientY);
    setMousePos({ x, y });

    if (!dragState.isDragging || !selectedLayerId) return;

    const dx = x - dragState.startX;
    const dy = y - dragState.startY;

    if (dragState.handleType === 'move') {
      updateLayer(selectedLayerId, {
        x: dragState.startLayerX + dx,
        y: dragState.startLayerY + dy,
      });
    } else if (dragState.handleType === 'rotate') {
      const selected = layers.find(l => l.id === selectedLayerId);
      if (selected) {
        const centerX = selected.x + selected.width / 2;
        const centerY = selected.y + selected.height / 2;
        const angle = Math.atan2(y - centerY, x - centerX) * 180 / Math.PI + 90;
        updateLayer(selectedLayerId, { rotation: angle });
      }
    } else if (dragState.handleType) {
      let newX = dragState.startLayerX;
      let newY = dragState.startLayerY;
      let newWidth = dragState.startLayerWidth;
      let newHeight = dragState.startLayerHeight;

      if (dragState.handleType.includes('l')) {
        newWidth = dragState.startLayerWidth - dx;
        newX = dragState.startLayerX + dx;
      }
      if (dragState.handleType.includes('r')) {
        newWidth = dragState.startLayerWidth + dx;
      }
      if (dragState.handleType.includes('t')) {
        newHeight = dragState.startLayerHeight - dy;
        newY = dragState.startLayerY + dy;
      }
      if (dragState.handleType.includes('b')) {
        newHeight = dragState.startLayerHeight + dy;
      }

      if (newWidth < 20) {
        newWidth = 20;
        if (dragState.handleType.includes('l')) newX = dragState.startLayerX + dragState.startLayerWidth - 20;
      }
      if (newHeight < 20) {
        newHeight = 20;
        if (dragState.handleType.includes('t')) newY = dragState.startLayerY + dragState.startLayerHeight - 20;
      }

      updateLayer(selectedLayerId, {
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
      });
    }
  };

  const handleMouseUp = () => {
    setDragState(prev => ({ ...prev, isDragging: false, handleType: null }));
  };

  const getCursor = () => {
    if (!dragState.isDragging) {
      const handle = getHandleAtPosition(mousePos.x, mousePos.y);
      if (handle === 'move') return 'move';
      if (handle === 'rotate') return 'crosshair';
      if (handle === 'tl' || handle === 'br') return 'nwse-resize';
      if (handle === 'tr' || handle === 'bl') return 'nesw-resize';
      if (handle === 'ml' || handle === 'mr') return 'ew-resize';
      if (handle === 'mt' || handle === 'mb') return 'ns-resize';
      return 'default';
    }
    return 'grabbing';
  };

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        background: `
          linear-gradient(45deg, #EBEBEB 25%, transparent 25%),
          linear-gradient(-45deg, #EBEBEB 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, #EBEBEB 75%),
          linear-gradient(-45deg, transparent 75%, #EBEBEB 75%)
        `,
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
        backgroundColor: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        cursor: getCursor(),
        position: 'relative',
        minWidth: 0,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          position: 'absolute',
          left: 0,
          top: 0,
        }}
      />
    </div>
  );
};

export default CanvasPreview;
