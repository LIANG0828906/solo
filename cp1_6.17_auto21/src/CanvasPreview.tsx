import { useRef, useEffect, useCallback, useState } from 'react';
import useStore, { Layer } from '@/store';

type ResizeHandle =
  | 'nw' | 'n' | 'ne'
  | 'w' | 'e'
  | 'sw' | 's' | 'se'
  | null;

interface CanvasPreviewProps {
  onTextDoubleClick?: (layerId: string) => void;
}

const HANDLE_SIZE = 8;
const HANDLE_HIT_SIZE = 16;

function CanvasPreview({ onTextDoubleClick = () => {} }: CanvasPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const scaleRef = useRef<number>(1);
  const offsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle>(null);
  const [cursor, setCursor] = useState<string>('default');
  const dragStartRef = useRef<{ x: number; y: number; layerX: number; layerY: number; layerW: number; layerH: number } | null>(null);
  const originalAspectRef = useRef<number>(1);

  const layers = useStore((s) => s.layers);
  const selectedLayerId = useStore((s) => s.selectedLayerId);
  const canvasWidth = useStore((s) => s.canvasWidth);
  const canvasHeight = useStore((s) => s.canvasHeight);
  const updateLayer = useStore((s) => s.updateLayer);
  const setSelectedLayer = useStore((s) => s.setSelectedLayer);

  const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);

  const getCanvasCoords = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left) / scaleRef.current - offsetRef.current.x;
    const y = (clientY - rect.top) / scaleRef.current - offsetRef.current.y;
    return { x, y };
  }, []);

  const pointInLayer = useCallback((px: number, py: number, layer: Layer) => {
    const cx = layer.x + layer.width / 2;
    const cy = layer.y + layer.height / 2;
    const angle = -layer.rotation * Math.PI / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const dx = px - cx;
    const dy = py - cy;
    const localX = dx * cos - dy * sin;
    const localY = dx * sin + dy * cos;
    return Math.abs(localX) <= layer.width / 2 && Math.abs(localY) <= layer.height / 2;
  }, []);

  const getHandlePosition = useCallback((handle: ResizeHandle, layer: Layer) => {
    const cx = layer.x + layer.width / 2;
    const cy = layer.y + layer.height / 2;
    const angle = layer.rotation * Math.PI / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    let ox = 0, oy = 0;
    if (handle?.includes('w')) ox = -layer.width / 2;
    if (handle?.includes('e')) ox = layer.width / 2;
    if (handle?.includes('n')) oy = -layer.height / 2;
    if (handle?.includes('s')) oy = layer.height / 2;

    return {
      x: cx + ox * cos - oy * sin,
      y: cy + ox * sin + oy * cos,
    };
  }, []);

  const hitTestHandle = useCallback((px: number, py: number, layer: Layer) => {
    const handles: ResizeHandle[] = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'];
    for (const handle of handles) {
      const pos = getHandlePosition(handle, layer);
      const hitSize = HANDLE_HIT_SIZE / 2 / scaleRef.current;
      if (Math.abs(px - pos.x) <= hitSize && Math.abs(py - pos.y) <= hitSize) {
        return handle;
      }
    }
    return null;
  }, [getHandlePosition]);

  const hitTestLayer = useCallback((px: number, py: number) => {
    for (let i = sortedLayers.length - 1; i >= 0; i--) {
      const layer = sortedLayers[i];
      if (pointInLayer(px, py, layer)) {
        return layer;
      }
    }
    return null;
  }, [sortedLayers, pointInLayer]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    for (const layer of sortedLayers) {
      ctx.save();

      const cx = layer.x + layer.width / 2;
      const cy = layer.y + layer.height / 2;
      ctx.translate(cx, cy);
      ctx.rotate(layer.rotation * Math.PI / 180);
      ctx.scale(layer.scaleX, layer.scaleY);
      ctx.globalAlpha = layer.opacity;

      if (layer.type === 'image' && layer.imageElement) {
        ctx.filter = `brightness(${layer.brightness}%) contrast(${layer.contrast}%) hue-rotate(${layer.hue}deg) saturate(${layer.saturate}%)`;
        ctx.drawImage(
          layer.imageElement,
          -layer.width / 2,
          -layer.height / 2,
          layer.width,
          layer.height
        );
      } else if (layer.type === 'text' && layer.text) {
        const fontSize = layer.fontSize || 32;
        const fontWeight = layer.fontWeight || '400';
        const fontFamily = layer.fontFamily || 'sans-serif';
        const color = layer.color || '#000000';
        const textAlign = layer.textAlign || 'left';

        ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
        ctx.fillStyle = color;
        ctx.textBaseline = 'middle';
        ctx.textAlign = textAlign;

        let textX = -layer.width / 2;
        if (textAlign === 'center') textX = 0;
        if (textAlign === 'right') textX = layer.width / 2;

        const lines = layer.text.split('\n');
        const lineHeight = fontSize * 1.2;
        const totalHeight = lines.length * lineHeight;
        let startY = -totalHeight / 2 + lineHeight / 2;

        for (let i = 0; i < lines.length; i++) {
          ctx.fillText(lines[i], textX, startY + i * lineHeight);
        }
      }

      ctx.restore();

      if (layer.id === selectedLayerId) {
        ctx.save();
        ctx.strokeStyle = '#1976D2';
        ctx.lineWidth = 2 / scaleRef.current;
        ctx.setLineDash([6 / scaleRef.current, 4 / scaleRef.current]);
        ctx.strokeRect(layer.x, layer.y, layer.width, layer.height);

        ctx.setLineDash([]);
        const handles: ResizeHandle[] = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'];
        for (const handle of handles) {
          const pos = getHandlePosition(handle, layer);
          const size = HANDLE_SIZE / scaleRef.current;
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(pos.x - size / 2, pos.y - size / 2, size, size);
          ctx.strokeStyle = '#1976D2';
          ctx.lineWidth = 1 / scaleRef.current;
          ctx.strokeRect(pos.x - size / 2, pos.y - size / 2, size, size);
        }
        ctx.restore();
      }
    }
  }, [sortedLayers, selectedLayerId, canvasWidth, canvasHeight, getHandlePosition]);

  const animate = useCallback((timestamp: number) => {
    if (timestamp - lastTimeRef.current >= 25) {
      render();
      lastTimeRef.current = timestamp;
    }
    animationRef.current = requestAnimationFrame(animate);
  }, [render]);

  const updateContainerScale = useCallback(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const containerRect = container.getBoundingClientRect();
    const padding = 20;
    const availWidth = containerRect.width - padding * 2;
    const availHeight = containerRect.height - padding * 2;

    const scale = Math.min(availWidth / canvasWidth, availHeight / canvasHeight, 1);
    scaleRef.current = scale;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    canvas.style.width = `${canvasWidth * scale}px`;
    canvas.style.height = `${canvasHeight * scale}px`;
  }, [canvasWidth, canvasHeight]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [animate]);

  useEffect(() => {
    updateContainerScale();
    window.addEventListener('resize', updateContainerScale);
    return () => window.removeEventListener('resize', updateContainerScale);
  }, [updateContainerScale]);

  useEffect(() => {
    updateContainerScale();
  }, [canvasWidth, canvasHeight, updateContainerScale]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    const selectedLayer = layers.find((l) => l.id === selectedLayerId);

    if (selectedLayer) {
      const handle = hitTestHandle(x, y, selectedLayer);
      if (handle) {
        setIsResizing(true);
        setResizeHandle(handle);
        dragStartRef.current = {
          x,
          y,
          layerX: selectedLayer.x,
          layerY: selectedLayer.y,
          layerW: selectedLayer.width,
          layerH: selectedLayer.height,
        };
        originalAspectRef.current = selectedLayer.width / selectedLayer.height;
        e.preventDefault();
        return;
      }
    }

    const hitLayer = hitTestLayer(x, y);
    if (hitLayer) {
      setSelectedLayer(hitLayer.id);
      setIsDragging(true);
      dragStartRef.current = {
        x,
        y,
        layerX: hitLayer.x,
        layerY: hitLayer.y,
        layerW: hitLayer.width,
        layerH: hitLayer.height,
      };
    } else {
      setSelectedLayer(null);
    }
  }, [getCanvasCoords, hitTestHandle, hitTestLayer, layers, selectedLayerId, setSelectedLayer]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    const selectedLayer = layers.find((l) => l.id === selectedLayerId);
    let newCursor = 'default';

    if (selectedLayer) {
      const handle = hitTestHandle(x, y, selectedLayer);
      if (handle) {
        switch (handle) {
          case 'nw': case 'se': newCursor = 'nwse-resize'; break;
          case 'ne': case 'sw': newCursor = 'nesw-resize'; break;
          case 'n': case 's': newCursor = 'ns-resize'; break;
          case 'w': case 'e': newCursor = 'ew-resize'; break;
        }
      }
    }

    if (newCursor === 'default' && hitTestLayer(x, y)) {
      newCursor = 'move';
    }

    setCursor(newCursor);

    if (!isDragging && !isResizing) return;
    if (!dragStartRef.current) return;
    if (!selectedLayer) return;

    if (isDragging) {
      const dx = x - dragStartRef.current.x;
      const dy = y - dragStartRef.current.y;
      updateLayer(selectedLayerId, {
        x: dragStartRef.current.layerX + dx,
        y: dragStartRef.current.layerY + dy,
      });
    } else if (isResizing && resizeHandle) {
      const dx = x - dragStartRef.current.x;
      const dy = y - dragStartRef.current.y;
      const startX = dragStartRef.current.layerX;
      const startY = dragStartRef.current.layerY;
      const startW = dragStartRef.current.layerW;
      const startH = dragStartRef.current.layerH;

      let newX = startX;
      let newY = startY;
      let newW = startW;
      let newH = startH;

      const maintainAspect = selectedLayer.type === 'image';

      if (resizeHandle.includes('e')) {
        newW = Math.max(10, startW + dx);
        if (maintainAspect) {
          newH = newW / originalAspectRef.current;
        }
      }
      if (resizeHandle.includes('w')) {
        newW = Math.max(10, startW - dx);
        newX = startX + (startW - newW);
        if (maintainAspect) {
          newH = newW / originalAspectRef.current;
          newY = startY + (startH - newH) / 2;
        }
      }
      if (resizeHandle.includes('s') && !maintainAspect) {
        newH = Math.max(10, startH + dy);
      }
      if (resizeHandle.includes('n') && !maintainAspect) {
        newH = Math.max(10, startH - dy);
        newY = startY + (startH - newH);
      }

      if (resizeHandle === 'nw' || resizeHandle === 'ne' || resizeHandle === 'sw' || resizeHandle === 'se') {
        if (maintainAspect) {
          const diagDx = resizeHandle.includes('e') ? dx : -dx;
          const diagDy = resizeHandle.includes('s') ? dy : -dy;
          const delta = Math.max(diagDx, diagDy);
          newW = Math.max(10, startW + (resizeHandle.includes('e') ? delta : -delta));
          newH = newW / originalAspectRef.current;
          if (resizeHandle.includes('w')) {
            newX = startX + (startW - newW);
          }
          if (resizeHandle.includes('n')) {
            newY = startY + (startH - newH);
          }
        }
      }

      updateLayer(selectedLayerId, {
        x: newX,
        y: newY,
        width: newW,
        height: newH,
      });
    }
  }, [isDragging, isResizing, resizeHandle, getCanvasCoords, layers, selectedLayerId, updateLayer, hitTestHandle, hitTestLayer]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
    dragStartRef.current = null;
  }, []);

  const handleDoubleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    const hitLayer = hitTestLayer(x, y);
    if (hitLayer && hitLayer.type === 'text') {
      onTextDoubleClick(hitLayer.id);
    }
  }, [getCanvasCoords, hitTestLayer, onTextDoubleClick]);

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center overflow-hidden">
      <canvas
        id="main-canvas"
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        style={{ cursor, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
      />
    </div>
  );
}

export default CanvasPreview;
