import React, { useEffect, useRef, useCallback } from 'react';
import { fabric } from 'fabric';
import { ZoomIn, ZoomOut, Maximize, Download, Link } from 'lucide-react';
import { CardData, ConnectionData, snapToGrid, interpolateColor, getWeakConnectionOpacity, computeBezierControlPoints, formatTime } from './utils';

const CARD_WIDTH = 200;
const CARD_HEIGHT = 120;
const CARD_RADIUS = 12;
const GRID_SIZE = 25;
const SNAP_GRID = 20;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.1;

interface CanvasViewProps {
  cards: CardData[];
  connections: ConnectionData[];
  selectedCardIds: string[];
  onCardDoubleClick: (cardId: string) => void;
  onCardMove: (cardId: string, x: number, y: number) => void;
  onSelectionChange: (cardIds: string[]) => void;
  onGenerateConnections: () => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  lastSaved: number;
  canvasRef: React.RefObject<fabric.Canvas | null>;
}

const CanvasView: React.FC<CanvasViewProps> = ({
  cards,
  connections,
  selectedCardIds,
  onCardDoubleClick,
  onCardMove,
  onSelectionChange,
  onGenerateConnections,
  zoom,
  onZoomChange,
  lastSaved,
  canvasRef,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const cardObjectsRef = useRef<Map<string, fabric.Group>>(new Map());
  const connectionObjectsRef = useRef<Map<string, fabric.Path>>(new Map());
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  const initCanvas = useCallback(() => {
    if (!containerRef.current) return;

    const canvas = new fabric.Canvas('knowledge-canvas', {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      backgroundColor: '#FFFFFF',
      selection: true,
      preserveObjectStacking: true,
    });

    canvasRef.current = canvas;

    drawGrid(canvas);

    canvas.on('mouse:down', (opt) => {
      if (opt.button === 1 && !opt.target) {
        isDraggingRef.current = true;
        lastMousePosRef.current = {
          x: opt.e.clientX,
          y: opt.e.clientY,
        };
        canvas.selection = false;
      }
    });

    canvas.on('mouse:move', (opt) => {
      if (isDraggingRef.current) {
        const deltaX = opt.e.clientX - lastMousePosRef.current.x;
        const deltaY = opt.e.clientY - lastMousePosRef.current.y;
        
        const vpt = canvas.viewportTransform;
        if (vpt) {
          vpt[4] += deltaX;
          vpt[5] += deltaY;
          canvas.requestRenderAll();
        }
        
        lastMousePosRef.current = {
          x: opt.e.clientX,
          y: opt.e.clientY,
        };
      }
    });

    canvas.on('mouse:up', () => {
      isDraggingRef.current = false;
      canvas.selection = true;
    });

    canvas.on('mouse:wheel', (opt) => {
      const e = opt.e as WheelEvent;
      e.preventDefault();
      
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      let newZoom = canvas.getZoom() + delta;
      newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
      
      const point = new fabric.Point(e.offsetX, e.offsetY);
      canvas.zoomToPoint(point, newZoom);
      onZoomChange(newZoom);
    });

    canvas.on('selection:created', (opt) => {
      const selected = opt.selected || [];
      const ids = selected
        .map((obj) => (obj as fabric.Object & { cardId?: string }).cardId)
        .filter(Boolean) as string[];
      onSelectionChange(ids);
    });

    canvas.on('selection:updated', (opt) => {
      const selected = opt.selected || [];
      const ids = selected
        .map((obj) => (obj as fabric.Object & { cardId?: string }).cardId)
        .filter(Boolean) as string[];
      onSelectionChange(ids);
    });

    canvas.on('selection:cleared', () => {
      onSelectionChange([]);
    });

    const handleResize = () => {
      if (!containerRef.current) return;
      canvas.setDimensions({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      });
      drawGrid(canvas);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.dispose();
    };
  }, [canvasRef, onZoomChange, onSelectionChange]);

  const drawGrid = (canvas: fabric.Canvas) => {
    const width = canvas.width || 0;
    const height = canvas.height || 0;
    
    canvas.setBackgroundColor('#FFFFFF', () => {});
    
    const gridLines: fabric.Line[] = [];
    
    for (let x = 0; x < width * 3; x += GRID_SIZE) {
      const line = new fabric.Line([x, 0, x, height * 3], {
        stroke: '#E0E0E0',
        strokeWidth: 1,
        selectable: false,
        evented: false,
        left: -width,
        top: -height,
      });
      gridLines.push(line);
    }
    
    for (let y = 0; y < height * 3; y += GRID_SIZE) {
      const line = new fabric.Line([0, y, width * 3, y], {
        stroke: '#E0E0E0',
        strokeWidth: 1,
        selectable: false,
        evented: false,
        left: -width,
        top: -height,
      });
      gridLines.push(line);
    }
    
    const gridGroup = new fabric.Group(gridLines, {
      selectable: false,
      evented: false,
      left: 0,
      top: 0,
      name: 'grid',
    });
    
    const existingGrid = canvas.getObjects().find((obj: any) => obj.name === 'grid');
    if (existingGrid) {
      canvas.remove(existingGrid);
    }
    
    canvas.add(gridGroup);
    canvas.sendToBack(gridGroup);
  };

  const createCardObject = useCallback((card: CardData): fabric.Group => {
    const rect = new fabric.Rect({
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      fill: card.color,
      rx: CARD_RADIUS,
      ry: CARD_RADIUS,
      stroke: 'rgba(0,0,0,0.08)',
      strokeWidth: 1,
      shadow: new fabric.Shadow({
        color: 'rgba(0,0,0,0.1)',
        blur: 8,
        offsetX: 0,
        offsetY: 2,
      }),
    });

    const iconText = new fabric.Text(card.icon, {
      fontSize: 24,
      left: 16,
      top: 16,
      selectable: false,
      evented: false,
    });

    const titleText = new fabric.Text(card.title, {
      fontSize: 16,
      fontWeight: 'bold',
      fill: '#333',
      left: 16,
      top: 52,
      width: CARD_WIDTH - 32,
      selectable: false,
      evented: false,
      fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
    });

    const descText = new fabric.Text(card.description || '', {
      fontSize: 12,
      fill: '#666',
      left: 16,
      top: 78,
      width: CARD_WIDTH - 32,
      selectable: false,
      evented: false,
      fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
    });

    const group = new fabric.Group([rect, iconText, titleText, descText], {
      left: card.x,
      top: card.y,
      hasControls: false,
      hasBorders: true,
      borderColor: '#1976D2',
      borderScaleFactor: 2,
      padding: 4,
      transparentCorners: false,
      cornerColor: '#1976D2',
      cornerSize: 0,
    });

    (group as any).cardId = card.id;
    (group as any).cardData = card;

    return group;
  }, []);

  const renderCards = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    cardObjectsRef.current.forEach((obj) => canvas.remove(obj));
    cardObjectsRef.current.clear();

    cards.forEach((card) => {
      const cardObj = createCardObject(card);
      cardObj.set({
        left: card.x,
        top: card.y,
      });
      
      cardObj.on('moving', () => {
        updateConnections();
      });

      cardObj.on('modified', () => {
        const newX = snapToGrid(cardObj.left || 0, SNAP_GRID);
        const newY = snapToGrid(cardObj.top || 0, SNAP_GRID);
        cardObj.set({ left: newX, top: newY });
        canvas.renderAll();
        onCardMove(card.id, newX, newY);
        updateConnections();
      });

      let lastClick = 0;
      cardObj.on('mousedown', () => {
        const now = Date.now();
        if (now - lastClick < 300) {
          onCardDoubleClick(card.id);
        }
        lastClick = now;
      });

      cardObjectsRef.current.set(card.id, cardObj);
      canvas.add(cardObj);
    });

    canvas.renderAll();
  }, [cards, createCardObject, onCardMove, onCardDoubleClick, canvasRef]);

  const updateConnections = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    connectionObjectsRef.current.forEach((obj) => canvas.remove(obj));
    connectionObjectsRef.current.clear();

    const opacityMap = getWeakConnectionOpacity(connections, 20);

    const cardRects = cards.map((c) => ({
      x: c.x,
      y: c.y,
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
    }));

    connections.forEach((conn) => {
      const fromCard = cardObjectsRef.current.get(conn.fromCardId);
      const toCard = cardObjectsRef.current.get(conn.toCardId);
      
      if (!fromCard || !toCard) return;

      const fromData = cards.find((c) => c.id === conn.fromCardId);
      const toData = cards.find((c) => c.id === conn.toCardId);
      if (!fromData || !toData) return;

      const fromCenterX = (fromCard.left || 0) + CARD_WIDTH / 2;
      const fromCenterY = (fromCard.top || 0) + CARD_HEIGHT / 2;
      const toCenterX = (toCard.left || 0) + CARD_WIDTH / 2;
      const toCenterY = (toCard.top || 0) + CARD_HEIGHT / 2;

      const { cp1x, cp1y, cp2x, cp2y } = computeBezierControlPoints(
        fromCenterX,
        fromCenterY,
        toCenterX,
        toCenterY,
        cardRects.filter(
          (r) =>
            !(r.x === fromData.x && r.y === fromData.y) &&
            !(r.x === toData.x && r.y === toData.y)
        )
      );

      const pathStr = `M ${fromCenterX} ${fromCenterY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${toCenterX} ${toCenterY}`;
      
      const strokeColor = interpolateColor(fromData.color, toData.color);
      const opacity = opacityMap[conn.id] ?? 1;

      const path = new fabric.Path(pathStr, {
        stroke: strokeColor,
        strokeWidth: 2,
        fill: '',
        selectable: false,
        opacity,
        evented: true,
        perPixelTargetFind: true,
      });

      (path as any).connectionId = conn.id;
      (path as any).connectionData = conn;

      path.on('mouseover', (opt) => {
        if (tooltipRef.current) {
          tooltipRef.current.style.display = 'block';
          tooltipRef.current.innerHTML = `
            <div style="font-weight: 600; font-size: 12px; color: #333;">${conn.description}</div>
            <div style="font-size: 11px; color: #888; margin-top: 2px;">强度: ${'●'.repeat(conn.strength)}</div>
          `;
        }
      });

      path.on('mousemove', (opt) => {
        if (tooltipRef.current && opt.e) {
          const e = opt.e as MouseEvent;
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect) {
            tooltipRef.current.style.left = `${e.clientX - rect.left + 12}px`;
            tooltipRef.current.style.top = `${e.clientY - rect.top + 12}px`;
          }
        }
      });

      path.on('mouseout', () => {
        if (tooltipRef.current) {
          tooltipRef.current.style.display = 'none';
        }
      });

      connectionObjectsRef.current.set(conn.id, path);
      canvas.add(path);
      canvas.sendToBack(path);
    });

    const grid = canvas.getObjects().find((obj: any) => obj.name === 'grid');
    if (grid) {
      canvas.sendToBack(grid);
    }

    canvas.renderAll();
  }, [connections, cards, canvasRef]);

  const handleZoomIn = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let newZoom = canvas.getZoom() + ZOOM_STEP;
    newZoom = Math.min(MAX_ZOOM, newZoom);
    const center = new fabric.Point(
      (canvas.width || 0) / 2,
      (canvas.height || 0) / 2
    );
    canvas.zoomToPoint(center, newZoom);
    onZoomChange(newZoom);
  };

  const handleZoomOut = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let newZoom = canvas.getZoom() - ZOOM_STEP;
    newZoom = Math.max(MIN_ZOOM, newZoom);
    const center = new fabric.Point(
      (canvas.width || 0) / 2,
      (canvas.height || 0) / 2
    );
    canvas.zoomToPoint(center, newZoom);
    onZoomChange(newZoom);
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const originalZoom = canvas.getZoom();
    const originalVpt = canvas.viewportTransform;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    cardObjectsRef.current.forEach((card) => {
      const left = card.left || 0;
      const top = card.top || 0;
      minX = Math.min(minX, left);
      minY = Math.min(minY, top);
      maxX = Math.max(maxX, left + CARD_WIDTH);
      maxY = Math.max(maxY, top + CARD_HEIGHT);
    });

    const padding = 50;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;

    const exportWidth = maxX - minX;
    const exportHeight = maxY - minY;

    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2,
      left: minX,
      top: minY,
      width: exportWidth,
      height: exportHeight,
    });

    const link = document.createElement('a');
    link.download = `知识卡片墙_${formatTime(Date.now())}.png`;
    link.href = dataURL;
    link.click();

    if (originalVpt) {
      canvas.setViewportTransform(originalVpt);
    }
    canvas.setZoom(originalZoom);
    canvas.renderAll();
  };

  useEffect(() => {
    const cleanup = initCanvas();
    return cleanup;
  }, [initCanvas]);

  useEffect(() => {
    if (canvasRef.current && cards.length > 0) {
      renderCards();
    }
  }, [cards.length, renderCards]);

  useEffect(() => {
    if (canvasRef.current && cards.length > 0) {
      updateConnections();
    }
  }, [connections, cards, updateConnections]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    cardObjectsRef.current.forEach((cardObj, cardId) => {
      if (selectedCardIds.includes(cardId)) {
        canvas.setActiveObject(cardObj);
      }
    });
  }, [selectedCardIds, canvasRef]);

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    flex: 1,
    height: '100%',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  };

  const toolbarStyle: React.CSSProperties = {
    position: 'absolute',
    top: '16px',
    right: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    zIndex: 100,
  };

  const toolBtnStyle: React.CSSProperties = {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#1976D2',
    color: '#FFFFFF',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)',
    transition: 'all 0.2s ease',
  };

  const saveStatusStyle: React.CSSProperties = {
    position: 'absolute',
    top: '16px',
    left: '16px',
    fontSize: '12px',
    color: '#999',
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: '6px 12px',
    borderRadius: '6px',
    zIndex: 100,
    backdropFilter: 'blur(4px)',
  };

  const tooltipStyle: React.CSSProperties = {
    position: 'absolute',
    display: 'none',
    backgroundColor: '#FFFFFF',
    borderRadius: '6px',
    padding: '8px 12px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
    pointerEvents: 'none',
    zIndex: 200,
    whiteSpace: 'nowrap',
  };

  const genConnBtnStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '10px 20px',
    backgroundColor: '#1976D2',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
    zIndex: 100,
    transition: 'all 0.2s ease',
    opacity: selectedCardIds.length >= 2 ? 1 : 0,
    pointerEvents: selectedCardIds.length >= 2 ? 'auto' : 'none',
    transform: `translateX(-50%) translateY(${selectedCardIds.length >= 2 ? '0' : '10px'})`,
  };

  return (
    <div style={containerStyle} ref={containerRef}>
      <div style={saveStatusStyle}>
        上次保存：{lastSaved ? formatTime(lastSaved) : '--:--:--'}
      </div>

      <canvas id="knowledge-canvas" />

      <div style={toolbarStyle}>
        <button
          style={toolBtnStyle}
          onClick={handleZoomIn}
          title="放大"
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#1565C0';
            e.currentTarget.style.transform = 'scale(1.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#1976D2';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <ZoomIn size={18} />
        </button>
        <button
          style={toolBtnStyle}
          onClick={handleZoomOut}
          title="缩小"
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#1565C0';
            e.currentTarget.style.transform = 'scale(1.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#1976D2';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <ZoomOut size={18} />
        </button>
        <button
          style={toolBtnStyle}
          onClick={handleFullscreen}
          title="全屏"
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#1565C0';
            e.currentTarget.style.transform = 'scale(1.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#1976D2';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <Maximize size={18} />
        </button>
        <button
          style={toolBtnStyle}
          onClick={handleExport}
          title="导出 PNG"
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#1565C0';
            e.currentTarget.style.transform = 'scale(1.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#1976D2';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <Download size={18} />
        </button>
      </div>

      <button
        style={genConnBtnStyle}
        onClick={onGenerateConnections}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#1565C0';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#1976D2';
        }}
      >
        <Link size={16} />
        生成关联线 ({selectedCardIds.length})
      </button>

      <div ref={tooltipRef} style={tooltipStyle} />
    </div>
  );
};

export default CanvasView;
