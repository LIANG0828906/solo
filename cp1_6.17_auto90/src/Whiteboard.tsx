import React, { useRef, useEffect, useCallback } from 'react';
import { useBoardStore } from './BoardStore';
import { HistoryModule } from './HistoryModule';
import { Shape } from './types';

const PRESET_COLORS = [
  '#000000', '#FFFFFF', '#FF6B6B', '#FF8E72', '#FFA94D', '#FFD93D',
  '#6BCB77', '#4D96FF', '#5463FF', '#A66CFF', '#9D4EDD', '#F72585',
  '#8D99AE', '#4CC9F0', '#00C853', '#FFC107'
];

const shapeTypeName = (type: Shape['type']) => {
  switch (type) {
    case 'rectangle': return '矩形';
    case 'circle': return '圆形';
    case 'diamond': return '菱形';
    case 'line': return '线条';
    case 'text': return '文本';
  }
};

interface Props {}

const Whiteboard: React.FC<Props> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const canvasSize = useRef({ w: 0, h: 0 });
  const drawingRef = useRef<{
    isDrawing: boolean;
    startX: number;
    startY: number;
    currentShapeId: string | null;
  }>({ isDrawing: false, startX: 0, startY: 0, currentShapeId: null });
  const draggingRef = useRef<{
    isDragging: boolean;
    shapeId: string | null;
    offsetX: number;
    offsetY: number;
    moved: boolean;
  }>({ isDragging: false, shapeId: null, offsetX: 0, offsetY: 0, moved: false });
  const panningRef = useRef<{
    isPanning: boolean;
    startX: number;
    startY: number;
    panStart: { x: number; y: number };
  }>({ isPanning: false, startX: 0, startY: 0, panStart: { x: 0, y: 0 } });

  const {
    shapes, selectedId, currentTool, zoom, pan, currentUser, spacePressed,
    setTool, setSelectedId, addShape, updateShape, deleteShape,
    setZoom, setPan, setIsPanning, loadSnapshot,
  } = useBoardStore();

  const screenToWorld = useCallback((sx: number, sy: number) => {
    return {
      x: (sx - pan.x) / zoom,
      y: (sy - pan.y) / zoom,
    };
  }, [pan, zoom]);

  const drawShape = useCallback((ctx: CanvasRenderingContext2D, shape: Shape, isSelected: boolean) => {
    ctx.save();
    const cx = shape.x + shape.width / 2;
    const cy = shape.y + shape.height / 2;
    ctx.translate(cx, cy);
    ctx.rotate((shape.rotation * Math.PI) / 180);
    ctx.translate(-cx, -cy);
    ctx.globalAlpha = shape.opacity;

    ctx.fillStyle = shape.fill;
    ctx.strokeStyle = shape.stroke;
    ctx.lineWidth = shape.strokeWidth;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    switch (shape.type) {
      case 'rectangle':
        ctx.beginPath();
        ctx.rect(shape.x, shape.y, shape.width, shape.height);
        if (shape.fill !== 'transparent') ctx.fill();
        if (shape.strokeWidth > 0) ctx.stroke();
        break;

      case 'circle':
        ctx.beginPath();
        ctx.ellipse(
          shape.x + shape.width / 2,
          shape.y + shape.height / 2,
          Math.abs(shape.width) / 2,
          Math.abs(shape.height) / 2,
          0, 0, Math.PI * 2
        );
        if (shape.fill !== 'transparent') ctx.fill();
        if (shape.strokeWidth > 0) ctx.stroke();
        break;

      case 'diamond':
        ctx.beginPath();
        ctx.moveTo(shape.x + shape.width / 2, shape.y);
        ctx.lineTo(shape.x + shape.width, shape.y + shape.height / 2);
        ctx.lineTo(shape.x + shape.width / 2, shape.y + shape.height);
        ctx.lineTo(shape.x, shape.y + shape.height / 2);
        ctx.closePath();
        if (shape.fill !== 'transparent') ctx.fill();
        if (shape.strokeWidth > 0) ctx.stroke();
        break;

      case 'line':
        ctx.beginPath();
        ctx.moveTo(shape.x, shape.y);
        ctx.lineTo(shape.x + shape.width, shape.y + shape.height);
        ctx.stroke();
        break;

      case 'text':
        if (shape.text) {
          ctx.font = `${Math.max(14, shape.height * 0.8)}px "Microsoft YaHei", sans-serif`;
          ctx.textBaseline = 'top';
          ctx.fillStyle = shape.stroke;
          ctx.fillText(shape.text, shape.x, shape.y);
        }
        break;
    }
    ctx.restore();

    if (isSelected) {
      ctx.save();
      const s2 = shape;
      const cx2 = s2.x + s2.width / 2;
      const cy2 = s2.y + s2.height / 2;
      ctx.translate(cx2, cy2);
      ctx.rotate((s2.rotation * Math.PI) / 180);
      ctx.translate(-cx2, -cy2);
      ctx.strokeStyle = '#4A90D9';
      ctx.lineWidth = 2 / zoom;
      ctx.setLineDash([6 / zoom, 4 / zoom]);
      ctx.strokeRect(
        s2.x - 4 / zoom,
        s2.y - 4 / zoom,
        s2.width + 8 / zoom,
        s2.height + 8 / zoom
      );
      ctx.setLineDash([]);
      ctx.restore();
    }

    if (shape.pulseSync) {
      ctx.save();
      const s2 = shape;
      const cx2 = s2.x + s2.width / 2;
      const cy2 = s2.y + s2.height / 2;
      ctx.translate(cx2, cy2);
      ctx.rotate((s2.rotation * Math.PI) / 180);
      ctx.translate(-cx2, -cy2);
      ctx.strokeStyle = '#00C853';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        s2.x - 4,
        s2.y - 4,
        s2.width + 8,
        s2.height + 8
      );
      ctx.restore();
    }

    if (draggingRef.current.isDragging && draggingRef.current.shapeId === shape.id) {
      ctx.save();
      const s2 = shape;
      const cx2 = s2.x + s2.width / 2;
      const cy2 = s2.y + s2.height / 2;
      ctx.translate(cx2, cy2);
      ctx.rotate((s2.rotation * Math.PI) / 180);
      ctx.translate(-cx2, -cy2);
      ctx.shadowColor = 'rgba(0,0,0,0.19)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 8;
      ctx.shadowOffsetY = 8;
      ctx.strokeStyle = 'transparent';
      ctx.strokeRect(s2.x, s2.y, s2.width, s2.height);
      ctx.restore();
    }
  }, [zoom]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const { w, h } = canvasSize.current;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#F5F5F5';
    ctx.fillRect(0, 0, w, h);

    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    shapes.forEach((shape) => {
      drawShape(ctx, shape, shape.id === selectedId);
    });

    if (drawingRef.current.isDrawing && drawingRef.current.currentShapeId) {
      const preview = shapes.find((s) => s.id === drawingRef.current.currentShapeId);
      if (preview) {
        drawShape(ctx, preview, false);
      }
    }

    ctx.restore();
  }, [shapes, selectedId, zoom, pan, drawShape]);

  const renderLoop = useCallback(() => {
    render();
    animFrameRef.current = requestAnimationFrame(renderLoop);
  }, [render]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [renderLoop]);

  useEffect(() => {
    const onResize = () => {
      if (!containerRef.current || !canvasRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvasRef.current.width = rect.width * dpr;
      canvasRef.current.height = rect.height * dpr;
      canvasRef.current.style.width = rect.width + 'px';
      canvasRef.current.style.height = rect.height + 'px';
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
      }
      canvasSize.current = { w: rect.width, h: rect.height };
      render();
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [render]);

  const hitTest = useCallback((wx: number, wy: number): Shape | null => {
    for (let i = shapes.length - 1; i >= 0; i--) {
      const s = shapes[i];
      const cx = s.x + s.width / 2;
      const cy = s.y + s.height / 2;
      const dx = wx - cx;
      const dy = wy - cy;
      const angle = (-s.rotation * Math.PI) / 180;
      const rx = dx * Math.cos(angle) - dy * Math.sin(angle) + cx;
      const ry = dx * Math.sin(angle) + dy * Math.cos(angle) + cy;
      if (s.type === 'circle') {
        const halfW = Math.abs(s.width) / 2;
        const halfH = Math.abs(s.height) / 2;
        if (halfW > 0 && halfH > 0) {
          const nx = (rx - cx) / halfW;
          const ny = (ry - cy) / halfH;
          if (nx * nx + ny * ny <= 1) return s;
        }
      } else if (s.type === 'line') {
        const x1 = s.x, y1 = s.y, x2 = s.x + s.width, y2 = s.y + s.height;
        const lenSq = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
        if (lenSq > 0) {
          let t = ((rx - x1) * (x2 - x1) + (ry - y1) * (y2 - y1)) / lenSq;
          t = Math.max(0, Math.min(1, t));
          const px = x1 + t * (x2 - x1);
          const py = y1 + t * (y2 - y1);
          if (Math.hypot(rx - px, ry - py) <= Math.max(8, s.strokeWidth + 4)) return s;
        }
      } else {
        if (rx >= s.x && rx <= s.x + s.width && ry >= s.y && ry <= s.y + s.height) return s;
      }
    }
    return null;
  }, [shapes]);

  const getMousePos = (e: React.MouseEvent | MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const { x: sx, y: sy } = getMousePos(e);
    const { x: wx, y: wy } = screenToWorld(sx, sy);

    if (spacePressed || e.button === 1) {
      panningRef.current = {
        isPanning: true,
        startX: sx,
        startY: sy,
        panStart: { ...pan },
      };
      setIsPanning(true);
      setSelectedId(null);
      return;
    }

    if (currentTool === 'select') {
      const hit = hitTest(wx, wy);
      if (hit) {
        setSelectedId(hit.id);
        draggingRef.current = {
          isDragging: true,
          shapeId: hit.id,
          offsetX: wx - hit.x,
          offsetY: wy - hit.y,
          moved: false,
        };
      } else {
        setSelectedId(null);
      }
      return;
    }

    if (currentTool === 'eraser') {
      const hit = hitTest(wx, wy);
      if (hit) {
        deleteShape(hit.id, true);
        HistoryModule.recordAction(currentUser.id, 'delete', hit.id, useBoardStore.getState().shapes);
      }
      return;
    }

    if (currentTool === 'text') {
      const shape = addShape({
        type: 'text',
        x: wx,
        y: wy,
        width: 120,
        height: 28,
        fill: 'transparent',
        stroke: '#000000',
        strokeWidth: 1,
        rotation: 0,
        opacity: 1,
        text: '双击编辑',
      }, true);
      setSelectedId(shape.id);
      HistoryModule.recordAction(currentUser.id, 'add', shape.id, useBoardStore.getState().shapes);
      setTimeout(() => {
        const text = window.prompt('请输入文本内容：', '文本内容');
        if (text !== null) {
          const s = useBoardStore.getState().shapes.find(x => x.id === shape.id);
          if (s) {
            const w = Math.max(80, text.length * 18);
            updateShape(shape.id, { text, width: w }, true);
            HistoryModule.recordAction(currentUser.id, 'modify', shape.id, useBoardStore.getState().shapes);
          }
        }
      }, 50);
      return;
    }

    const colors = ['#FF6B6B', '#4ECDC4', '#FFD93D', '#95E1D3', '#F38181', '#4A90D9'];
    const fills = ['#FF6B6B33', '#4ECDC433', '#FFD93D33', '#95E1D333', '#F3818133', '#4A90D933'];
    const idx = shapes.length % colors.length;

    const newShape = addShape({
      type: currentTool as Shape['type'],
      x: wx,
      y: wy,
      width: 1,
      height: 1,
      fill: fills[idx],
      stroke: colors[idx],
      strokeWidth: 2,
      rotation: 0,
      opacity: 1,
    }, false);

    drawingRef.current = {
      isDrawing: true,
      startX: wx,
      startY: wy,
      currentShapeId: newShape.id,
    };
    setSelectedId(newShape.id);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const { x: sx, y: sy } = getMousePos(e);
    const { x: wx, y: wy } = screenToWorld(sx, sy);

    if (panningRef.current.isPanning) {
      const dx = sx - panningRef.current.startX;
      const dy = sy - panningRef.current.startY;
      setPan({
        x: panningRef.current.panStart.x + dx,
        y: panningRef.current.panStart.y + dy,
      });
      return;
    }

    if (draggingRef.current.isDragging && draggingRef.current.shapeId) {
      const shape = shapes.find((s) => s.id === draggingRef.current.shapeId);
      if (shape) {
        const newX = wx - draggingRef.current.offsetX;
        const newY = wy - draggingRef.current.offsetY;
        if (Math.abs(newX - shape.x) > 0.5 || Math.abs(newY - shape.y) > 0.5) {
          draggingRef.current.moved = true;
          updateShape(draggingRef.current.shapeId, { x: newX, y: newY }, false);
        }
      }
      return;
    }

    if (drawingRef.current.isDrawing && drawingRef.current.currentShapeId) {
      const dx = wx - drawingRef.current.startX;
      const dy = wy - drawingRef.current.startY;
      let x = drawingRef.current.startX;
      let y = drawingRef.current.startY;
      let w = dx;
      let h = dy;
      if (dx < 0) { x = wx; w = -dx; }
      if (dy < 0) { y = wy; h = -dy; }
      if (currentTool === 'line') {
        updateShape(drawingRef.current.currentShapeId, {
          x: drawingRef.current.startX,
          y: drawingRef.current.startY,
          width: dx,
          height: dy,
        }, false);
      } else {
        updateShape(drawingRef.current.currentShapeId, { x, y, width: Math.max(1, w), height: Math.max(1, h) }, false);
      }
    }
  };

  const handleMouseUp = () => {
    if (panningRef.current.isPanning) {
      panningRef.current.isPanning = false;
      setIsPanning(false);
      return;
    }

    if (draggingRef.current.isDragging && draggingRef.current.shapeId) {
      if (draggingRef.current.moved) {
        const s = shapes.find(x => x.id === draggingRef.current.shapeId);
        if (s) {
          updateShape(s.id, { x: s.x, y: s.y }, true);
          HistoryModule.recordAction(currentUser.id, 'move', s.id, useBoardStore.getState().shapes);
        }
      }
      draggingRef.current = {
        isDragging: false, shapeId: null, offsetX: 0, offsetY: 0, moved: false
      };
      return;
    }

    if (drawingRef.current.isDrawing && drawingRef.current.currentShapeId) {
      const s = shapes.find(x => x.id === drawingRef.current.currentShapeId);
      if (s && (Math.abs(s.width) > 3 || Math.abs(s.height) > 3)) {
        updateShape(s.id, { ...s }, true);
        HistoryModule.recordAction(currentUser.id, 'add', s.id, useBoardStore.getState().shapes);
      } else if (s) {
        deleteShape(s.id, false);
        setSelectedId(null);
      }
      drawingRef.current = { isDrawing: false, startX: 0, startY: 0, currentShapeId: null };
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const { x: sx, y: sy } = getMousePos(e as any);
    const delta = -e.deltaY;
    const factor = delta > 0 ? 1.1 : 0.9;
    const rawZoom = zoom * factor;
    const step = Math.round(rawZoom * 10) / 10;
    const finalZoom = Math.max(0.3, Math.min(3.0, step));

    const wxBefore = (sx - pan.x) / zoom;
    const wyBefore = (sy - pan.y) / zoom;
    const newPanX = sx - wxBefore * finalZoom;
    const newPanY = sy - wyBefore * finalZoom;
    setZoom(finalZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        useBoardStore.setState({ spacePressed: true });
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          deleteShape(selectedId, true);
          HistoryModule.recordAction(currentUser.id, 'delete', selectedId, useBoardStore.getState().shapes);
        }
      }
      if (e.key === 'Escape') {
        setSelectedId(null);
        setTool('select');
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        useBoardStore.setState({ spacePressed: false });
        if (panningRef.current.isPanning) {
          panningRef.current.isPanning = false;
          setIsPanning(false);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [selectedId, deleteShape, setSelectedId, setTool, currentUser.id]);

  useEffect(() => {
    const unsub = HistoryModule.subscribeToSnapshots((snapshot) => {
      loadSnapshot(snapshot);
    });
    return () => { unsub(); };
  }, [loadSnapshot]);

  const selectedShape = shapes.find((s) => s.id === selectedId);

  return (
    <div
      ref={containerRef}
      className="whiteboard-container"
      style={{
        position: 'relative',
        flex: 1,
        overflow: 'hidden',
        cursor: spacePressed
          ? (panningRef.current.isPanning ? 'grabbing' : 'grab')
          : currentTool === 'select'
            ? 'default'
            : 'crosshair',
        userSelect: 'none',
        minWidth: 0,
        minHeight: 0,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
        }}
      />

      {selectedShape && (
        <div
          className="property-panel"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: 220,
            background: '#FAFAFA',
            borderRadius: '0 12px 12px 0',
            padding: 16,
            boxShadow: '2px 0 12px rgba(0,0,0,0.08)',
            zIndex: 10,
            transition: 'all 0.2s ease',
            maxHeight: 'calc(100% - 16px)',
            overflowY: 'auto',
            marginTop: 8,
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 14, color: '#333', marginBottom: 16 }}>
            {shapeTypeName(selectedShape.type)} 属性
          </div>

          <PropertyRow label="填充颜色">
            <ColorPicker
              value={selectedShape.fill}
              onChange={(v) => {
                updateShape(selectedId!, { fill: v }, false);
              }}
              onChangeEnd={() => {
                updateShape(selectedId!, {}, true);
                HistoryModule.recordAction(currentUser.id, 'modify', selectedId!, useBoardStore.getState().shapes);
              }}
              colors={PRESET_COLORS}
            />
          </PropertyRow>

          <PropertyRow label="边框颜色">
            <ColorPicker
              value={selectedShape.stroke}
              onChange={(v) => {
                updateShape(selectedId!, { stroke: v }, false);
              }}
              onChangeEnd={() => {
                updateShape(selectedId!, {}, true);
                HistoryModule.recordAction(currentUser.id, 'modify', selectedId!, useBoardStore.getState().shapes);
              }}
              colors={PRESET_COLORS}
            />
          </PropertyRow>

          <PropertyRow label={`边框宽度 ${selectedShape.strokeWidth}px`}>
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={selectedShape.strokeWidth}
              onChange={(e) => updateShape(selectedId!, { strokeWidth: Number(e.target.value) }, false)}
              onMouseUp={() => {
                HistoryModule.recordAction(currentUser.id, 'modify', selectedId!, useBoardStore.getState().shapes);
                updateShape(selectedId!, {}, true);
              }}
              onTouchEnd={() => {
                HistoryModule.recordAction(currentUser.id, 'modify', selectedId!, useBoardStore.getState().shapes);
                updateShape(selectedId!, {}, true);
              }}
              style={{ width: '100%', cursor: 'pointer' }}
            />
          </PropertyRow>

          <PropertyRow label={`旋转 ${selectedShape.rotation}°`}>
            <input
              type="range"
              min={-180}
              max={180}
              step={1}
              value={selectedShape.rotation}
              onChange={(e) => updateShape(selectedId!, { rotation: Number(e.target.value) }, false)}
              onMouseUp={() => {
                HistoryModule.recordAction(currentUser.id, 'modify', selectedId!, useBoardStore.getState().shapes);
                updateShape(selectedId!, {}, true);
              }}
              onTouchEnd={() => {
                HistoryModule.recordAction(currentUser.id, 'modify', selectedId!, useBoardStore.getState().shapes);
                updateShape(selectedId!, {}, true);
              }}
              style={{ width: '100%', cursor: 'pointer' }}
            />
          </PropertyRow>

          <PropertyRow label={`透明度 ${selectedShape.opacity.toFixed(1)}`}>
            <input
              type="range"
              min={0.1}
              max={1.0}
              step={0.1}
              value={selectedShape.opacity}
              onChange={(e) => updateShape(selectedId!, { opacity: Number(e.target.value) }, false)}
              onMouseUp={() => {
                HistoryModule.recordAction(currentUser.id, 'modify', selectedId!, useBoardStore.getState().shapes);
                updateShape(selectedId!, {}, true);
              }}
              onTouchEnd={() => {
                HistoryModule.recordAction(currentUser.id, 'modify', selectedId!, useBoardStore.getState().shapes);
                updateShape(selectedId!, {}, true);
              }}
              style={{ width: '100%', cursor: 'pointer' }}
            />
          </PropertyRow>
        </div>
      )}
    </div>
  );
};

const PropertyRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ marginBottom: 16 }}>
    <div style={{ fontSize: 12, color: '#666', marginBottom: 8, fontWeight: 500 }}>{label}</div>
    {children}
  </div>
);

const ColorPicker: React.FC<{ value: string; onChange: (c: string) => void; onChangeEnd: () => void; colors: string[] }> = ({ value, onChange, onChangeEnd, colors }) => {
  const timerRef = useRef<number | null>(null);
  const triggerEnd = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => onChangeEnd(), 150);
  };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 5 }}>
      {colors.map((c) => (
        <div
          key={c}
          onClick={() => { onChange(c); triggerEnd(); }}
          style={{
            width: 18,
            height: 18,
            borderRadius: 4,
            background: c,
            border: value === c ? '2px solid #4A90D9' : '1px solid rgba(0,0,0,0.1)',
            cursor: 'pointer',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            boxSizing: 'border-box',
            boxShadow: value === c ? '0 0 0 2px rgba(74,144,217,0.2)' : 'none',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.15)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        />
      ))}
      <label style={{
        width: 18, height: 18, borderRadius: 4,
        border: '1px solid rgba(0,0,0,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, color: '#999', cursor: 'pointer',
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, #fff 50%, #ccc 50%)',
        transition: 'transform 0.15s ease',
      }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.15)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        <input
          type="color"
          value={/^#[0-9A-Fa-f]{6}$/.test(value) ? value : '#000000'}
          onChange={(e) => { onChange(e.target.value); triggerEnd(); }}
          style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
        />
      </label>
    </div>
  );
};

export default Whiteboard;
