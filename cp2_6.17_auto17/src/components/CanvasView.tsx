import { useRef, useEffect, useState, useCallback } from 'react';
import { Hotspot, PALETTE, LABEL_OPTIONS } from '../types';
import { hexToRgba, normalizeRect, fitImageToCanvas, getImageCanvasCoords } from '../utils/canvas';
import { useProjectStore } from '../store/useProjectStore';

interface CanvasViewProps {
  pageId: string;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  hotspots: Hotspot[];
  selectedHotspotId: string | null;
  onSelectHotspot: (id: string | null) => void;
  onAddHotspot: (x: number, y: number, w: number, h: number) => void;
  onUpdateHotspot: (id: string, updates: Partial<Hotspot>) => void;
}

interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

interface DragMoveState {
  isDragging: boolean;
  hotspotId: string;
  offsetX: number;
  offsetY: number;
}

export default function CanvasView({
  pageId,
  imageUrl,
  imageWidth,
  imageHeight,
  hotspots,
  selectedHotspotId,
  onSelectHotspot,
  onAddHotspot,
  onUpdateHotspot,
}: CanvasViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [imgDisplay, setImgDisplay] = useState({ width: 0, height: 0, offsetX: 0, offsetY: 0 });
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dragMove, setDragMove] = useState<DragMoveState | null>(null);
  const [resizeState, setResizeState] = useState<{
    hotspotId: string;
    corner: string;
    origX: number;
    origY: number;
    origW: number;
    origH: number;
    startMX: number;
    startMY: number;
  } | null>(null);
  const [activeAnimation, setActiveAnimation] = useState<string | null>(null);
  const { isPlaying } = useProjectStore();

  const computeLayout = useCallback(() => {
    if (!containerRef.current) return;
    const containerW = containerRef.current.clientWidth;
    const containerH = containerRef.current.clientHeight;
    setCanvasSize({ width: containerW, height: containerH });

    if (imageWidth > 0 && imageHeight > 0) {
      const maxW = Math.min(containerW - 40, 800);
      const maxH = containerH - 40;
      const fit = fitImageToCanvas(imageWidth, imageHeight, maxW, maxH);
      setImgDisplay({
        width: fit.width,
        height: fit.height,
        offsetX: Math.round((containerW - fit.width) / 2),
        offsetY: Math.round((containerH - fit.height) / 2),
      });
    }
  }, [imageWidth, imageHeight]);

  useEffect(() => {
    computeLayout();
    const observer = new ResizeObserver(computeLayout);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [computeLayout]);

  useEffect(() => {
    if (!imageUrl) return;
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
    };
    img.src = imageUrl;
  }, [imageUrl]);

  const getCoords = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      let clientX: number, clientY: number;
      if ('touches' in e) {
        if (e.touches.length === 0) return null;
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      return getImageCanvasCoords(
        clientX,
        clientY,
        canvas,
        imgDisplay.offsetX,
        imgDisplay.offsetY,
        imgDisplay.width,
        imgDisplay.height
      );
    },
    [imgDisplay]
  );

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#F5F0EB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (imgRef.current && imageUrl) {
      ctx.drawImage(
        imgRef.current,
        imgDisplay.offsetX,
        imgDisplay.offsetY,
        imgDisplay.width,
        imgDisplay.height
      );
    } else {
      ctx.fillStyle = '#E8E0D8';
      ctx.fillRect(imgDisplay.offsetX, imgDisplay.offsetY, imgDisplay.width, imgDisplay.height);
      ctx.fillStyle = '#B2BEC3';
      ctx.font = '16px "Noto Sans SC"';
      ctx.textAlign = 'center';
      ctx.fillText('点击下方「导入插图」上传草稿图片', imgDisplay.offsetX + imgDisplay.width / 2, imgDisplay.offsetY + imgDisplay.height / 2 - 10);
      ctx.font = '13px "Noto Sans SC"';
      ctx.fillStyle = '#CCC';
      ctx.fillText('支持 PNG / JPG 格式', imgDisplay.offsetX + imgDisplay.width / 2, imgDisplay.offsetY + imgDisplay.height / 2 + 16);
    }

    hotspots.forEach((hotspot) => {
      const hx = imgDisplay.offsetX + hotspot.x;
      const hy = imgDisplay.offsetY + hotspot.y;

      ctx.fillStyle = hexToRgba(hotspot.color, 0.25);
      ctx.fillRect(hx, hy, hotspot.width, hotspot.height);

      ctx.strokeStyle = hotspot.color;
      ctx.lineWidth = selectedHotspotId === hotspot.id ? 2.5 : 1.5;
      if (selectedHotspotId === hotspot.id) {
        ctx.setLineDash([6, 3]);
      } else {
        ctx.setLineDash([]);
      }
      ctx.strokeRect(hx, hy, hotspot.width, hotspot.height);
      ctx.setLineDash([]);

      const badgeW = ctx.measureText(hotspot.label).width + 14;
      const badgeH = 20;
      ctx.fillStyle = hotspot.color;
      const badgeRadius = 6;
      const bx = hx + 2;
      const by = hy + 2;
      ctx.beginPath();
      ctx.moveTo(bx + badgeRadius, by);
      ctx.lineTo(bx + badgeW - badgeRadius, by);
      ctx.quadraticCurveTo(bx + badgeW, by, bx + badgeW, by + badgeRadius);
      ctx.lineTo(bx + badgeW, by + badgeH - badgeRadius);
      ctx.quadraticCurveTo(bx + badgeW, by + badgeH, bx + badgeW - badgeRadius, by + badgeH);
      ctx.lineTo(bx + badgeRadius, by + badgeH);
      ctx.quadraticCurveTo(bx, by + badgeH, bx, by + badgeH - badgeRadius);
      ctx.lineTo(bx, by + badgeRadius);
      ctx.quadraticCurveTo(bx, by, bx + badgeRadius, by);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 11px "Noto Sans SC"';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(hotspot.label, bx + 7, by + badgeH / 2);

      if (selectedHotspotId === hotspot.id) {
        const handleSize = 7;
        const corners = [
          { x: hx - handleSize / 2, y: hy - handleSize / 2 },
          { x: hx + hotspot.width - handleSize / 2, y: hy - handleSize / 2 },
          { x: hx - handleSize / 2, y: hy + hotspot.height - handleSize / 2 },
          { x: hx + hotspot.width - handleSize / 2, y: hy + hotspot.height - handleSize / 2 },
        ];
        ctx.fillStyle = '#FFF';
        ctx.strokeStyle = hotspot.color;
        ctx.lineWidth = 1.5;
        corners.forEach((c) => {
          ctx.fillRect(c.x, c.y, handleSize, handleSize);
          ctx.strokeRect(c.x, c.y, handleSize, handleSize);
        });
      }
    });

    if (dragState && dragState.isDragging) {
      const rect = normalizeRect(dragState.startX, dragState.startY, dragState.currentX, dragState.currentY);
      ctx.fillStyle = 'rgba(78, 205, 196, 0.15)';
      ctx.fillRect(
        imgDisplay.offsetX + rect.x,
        imgDisplay.offsetY + rect.y,
        rect.width,
        rect.height
      );
      ctx.strokeStyle = '#4ECDC4';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(
        imgDisplay.offsetX + rect.x,
        imgDisplay.offsetY + rect.y,
        rect.width,
        rect.height
      );
      ctx.setLineDash([]);
    }
  }, [canvasSize, imgDisplay, imageUrl, hotspots, selectedHotspotId, dragState]);

  useEffect(() => {
    const rafId = requestAnimationFrame(drawCanvas);
    return () => cancelAnimationFrame(rafId);
  }, [drawCanvas]);

  const findHotspotAt = useCallback(
    (imgX: number, imgY: number): Hotspot | null => {
      for (let i = hotspots.length - 1; i >= 0; i--) {
        const h = hotspots[i];
        if (imgX >= h.x && imgX <= h.x + h.width && imgY >= h.y && imgY <= h.y + h.height) {
          return h;
        }
      }
      return null;
    },
    [hotspots]
  );

  const findResizeCorner = useCallback(
    (imgX: number, imgY: number, hotspot: Hotspot): string | null => {
      const threshold = 8;
      const hx = hotspot.x;
      const hy = hotspot.y;
      const hw = hotspot.width;
      const hh = hotspot.height;
      if (Math.abs(imgX - hx) < threshold && Math.abs(imgY - hy) < threshold) return 'tl';
      if (Math.abs(imgX - (hx + hw)) < threshold && Math.abs(imgY - hy) < threshold) return 'tr';
      if (Math.abs(imgX - hx) < threshold && Math.abs(imgY - (hy + hh)) < threshold) return 'bl';
      if (Math.abs(imgX - (hx + hw)) < threshold && Math.abs(imgY - (hy + hh)) < threshold) return 'br';
      return null;
    },
    []
  );

  const handlePointerDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (isPlaying) return;
      const coords = getCoords(e);
      if (!coords) return;
      const { x, y } = coords;

      if (selectedHotspotId) {
        const selected = hotspots.find((h) => h.id === selectedHotspotId);
        if (selected) {
          const corner = findResizeCorner(x, y, selected);
          if (corner) {
            setResizeState({
              hotspotId: selected.id,
              corner,
              origX: selected.x,
              origY: selected.y,
              origW: selected.width,
              origH: selected.height,
              startMX: x,
              startMY: y,
            });
            e.preventDefault();
            return;
          }
        }
      }

      const hit = findHotspotAt(x, y);
      if (hit) {
        onSelectHotspot(hit.id);
        setDragMove({
          isDragging: true,
          hotspotId: hit.id,
          offsetX: x - hit.x,
          offsetY: y - hit.y,
        });
        e.preventDefault();
        return;
      }

      onSelectHotspot(null);
      setDragState({
        isDragging: true,
        startX: x,
        startY: y,
        currentX: x,
        currentY: y,
      });
      e.preventDefault();
    },
    [isPlaying, getCoords, selectedHotspotId, hotspots, findResizeCorner, findHotspotAt, onSelectHotspot]
  );

  const handlePointerMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const coords = getCoords(e);
      if (!coords) return;
      const { x, y } = coords;

      if (resizeState) {
        const dx = x - resizeState.startMX;
        const dy = y - resizeState.startMY;
        let newX = resizeState.origX;
        let newY = resizeState.origY;
        let newW = resizeState.origW;
        let newH = resizeState.origH;

        if (resizeState.corner.includes('l')) {
          newX = resizeState.origX + dx;
          newW = resizeState.origW - dx;
        }
        if (resizeState.corner.includes('r')) {
          newW = resizeState.origW + dx;
        }
        if (resizeState.corner.includes('t')) {
          newY = resizeState.origY + dy;
          newH = resizeState.origH - dy;
        }
        if (resizeState.corner.includes('b')) {
          newH = resizeState.origH + dy;
        }

        if (newW < 20) { newW = 20; if (resizeState.corner.includes('l')) newX = resizeState.origX + resizeState.origW - 20; }
        if (newH < 20) { newH = 20; if (resizeState.corner.includes('t')) newY = resizeState.origY + resizeState.origH - 20; }

        onUpdateHotspot(resizeState.hotspotId, { x: Math.round(newX), y: Math.round(newY), width: Math.round(newW), height: Math.round(newH) });
        return;
      }

      if (dragMove && dragMove.isDragging) {
        const newX = Math.round(x - dragMove.offsetX);
        const newY = Math.round(y - dragMove.offsetY);
        onUpdateHotspot(dragMove.hotspotId, { x: newX, y: newY });
        return;
      }

      if (dragState && dragState.isDragging) {
        setDragState((prev) => prev ? { ...prev, currentX: x, currentY: y } : null);
      }
    },
    [getCoords, dragState, dragMove, resizeState, onUpdateHotspot]
  );

  const handlePointerUp = useCallback(() => {
    if (resizeState) {
      setResizeState(null);
      return;
    }

    if (dragMove) {
      setDragMove(null);
      return;
    }

    if (dragState && dragState.isDragging) {
      const rect = normalizeRect(dragState.startX, dragState.startY, dragState.currentX, dragState.currentY);
      if (rect.width >= 15 && rect.height >= 15) {
        onAddHotspot(rect.x, rect.y, rect.width, rect.height);
      }
      setDragState(null);
    }
  }, [dragState, dragMove, resizeState, onAddHotspot]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (isPlaying) {
        const coords = getCoords(e);
        if (!coords) return;
        const hit = findHotspotAt(coords.x, coords.y);
        if (hit) {
          setActiveAnimation(hit.id);
          setTimeout(() => setActiveAnimation(null), 1200);
        }
      }
    },
    [isPlaying, getCoords, findHotspotAt]
  );

  const activeHotspot = activeAnimation ? hotspots.find((h) => h.id === activeAnimation) : null;

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        background: '#F5F0EB',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          cursor: dragState ? 'crosshair' : dragMove ? 'grabbing' : isPlaying ? 'pointer' : 'crosshair',
        }}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
        onClick={handleCanvasClick}
      />
      {activeHotspot && (
        <div
          className={`animation-${activeHotspot.animationType}`}
          style={{
            position: 'absolute',
            left: imgDisplay.offsetX + activeHotspot.x,
            top: imgDisplay.offsetY + activeHotspot.y,
            width: activeHotspot.width,
            height: activeHotspot.height,
            pointerEvents: 'none',
          }}
        />
      )}
      {isPlaying && hotspots.length > 0 && (
        <div style={{
          position: 'absolute',
          top: 12,
          right: 12,
          background: 'rgba(255,255,255,0.9)',
          borderRadius: 8,
          padding: '6px 12px',
          fontSize: 12,
          color: '#636E72',
        }}>
          💡 点击热点区域可预览动画效果
        </div>
      )}
    </div>
  );
}
