import { useEffect, useRef, useState, useCallback } from 'react';
import { useTemplateStore, type Shape } from './templateStore';

const PRESET_COLORS = ['#3B82F6', '#F59E0B', '#EF4444'];
const HANDLE_SIZE = 8;
const CURVE_COLOR = '#6B7280';
const CURVE_LINE_WIDTH = 2;
const CURVE_CONTROL_OFFSET = 50;

function getShapeCenter(shape: Shape) {
  if (shape.type === 'rect') {
    return {
      x: shape.x + shape.width / 2,
      y: shape.y + shape.height / 2,
    };
  }
  return { x: shape.x, y: shape.y };
}

function hitTest(shape: Shape, worldX: number, worldY: number): boolean {
  if (shape.type === 'rect') {
    return (
      worldX >= shape.x &&
      worldX <= shape.x + shape.width &&
      worldY >= shape.y &&
      worldY <= shape.y + shape.height
    );
  }
  const dx = worldX - shape.x;
  const dy = worldY - shape.y;
  return dx * dx + dy * dy <= shape.radius * shape.radius;
}

function drawShape(
  ctx: CanvasRenderingContext2D,
  shape: Shape,
  selected: boolean,
  dragging: boolean
) {
  ctx.save();
  if (dragging) ctx.globalAlpha = 0.8;
  ctx.fillStyle = shape.fill;

  if (shape.type === 'rect') {
    const r = 8;
    const { x, y, width: w, height: h } = shape;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();

    if (selected) {
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);
      drawHandles(ctx, x, y, w, h);
    }
  } else {
    ctx.beginPath();
    ctx.arc(shape.x, shape.y, shape.radius, 0, Math.PI * 2);
    ctx.fill();

    if (selected) {
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(shape.x, shape.y, shape.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      drawHandles(
        ctx,
        shape.x - shape.radius,
        shape.y - shape.radius,
        shape.radius * 2,
        shape.radius * 2
      );
    }
  }
  ctx.restore();
}

function drawHandles(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  ctx.fillStyle = '#3B82F6';
  const positions = [
    [x, y],
    [x + w / 2, y],
    [x + w, y],
    [x + w, y + h / 2],
    [x + w, y + h],
    [x + w / 2, y + h],
    [x, y + h],
    [x, y + h / 2],
  ];
  for (const [hx, hy] of positions) {
    ctx.fillRect(hx - HANDLE_SIZE / 2, hy - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
  }
}

function drawBezierConnections(ctx: CanvasRenderingContext2D, shapes: Shape[]) {
  if (shapes.length < 2) return;
  ctx.save();
  ctx.strokeStyle = CURVE_COLOR;
  ctx.lineWidth = CURVE_LINE_WIDTH;
  for (let i = 0; i < shapes.length - 1; i++) {
    const a = getShapeCenter(shapes[i]);
    const b = getShapeCenter(shapes[i + 1]);
    const cp1x = a.x + CURVE_CONTROL_OFFSET;
    const cp1y = a.y;
    const cp2x = b.x - CURVE_CONTROL_OFFSET;
    const cp2y = b.y;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, b.x, b.y);
    ctx.stroke();
  }
  ctx.restore();
}

export default function WhiteboardCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shapes = useTemplateStore((state) => state.shapes);
  const zoom = useTemplateStore((state) => state.zoom);
  const offsetX = useTemplateStore((state) => state.offsetX);
  const offsetY = useTemplateStore((state) => state.offsetY);
  const selectedShapeId = useTemplateStore((state) => state.selectedShapeId);
  const addShape = useTemplateStore((state) => state.addShape);
  const updateShape = useTemplateStore((state) => state.updateShape);
  const setZoom = useTemplateStore((state) => state.setZoom);
  const setOffset = useTemplateStore((state) => state.setOffset);
  const setSelectedShape = useTemplateStore((state) => state.setSelectedShape);
  const saveTemplate = useTemplateStore((state) => state.saveTemplate);
  const currentTemplateId = useTemplateStore((state) => state.currentTemplateId);
  const templates = useTemplateStore((state) => state.templates);

  const shapesRef = useRef(shapes);
  const selectedIdRef = useRef(selectedShapeId);
  const draggingRef = useRef<string | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const panningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });
  const spaceDownRef = useRef(false);

  const [editingShape, setEditingShape] = useState<Shape | null>(null);
  const [editPanelPos, setEditPanelPos] = useState({ x: 0, y: 0 });
  const [zoomIndicatorVisible, setZoomIndicatorVisible] = useState(false);
  const [zoomIndicatorFading, setZoomIndicatorFading] = useState(false);
  const zoomFadeTimerRef = useRef<number | null>(null);
  const [currentTemplateName, setCurrentTemplateName] = useState('');

  useEffect(() => {
    const t = templates.find((t) => t.id === currentTemplateId);
    setCurrentTemplateName(t?.name || '');
  }, [templates, currentTemplateId]);

  useEffect(() => {
    shapesRef.current = shapes;
  }, [shapes]);

  useEffect(() => {
    selectedIdRef.current = selectedShapeId;
  }, [selectedShapeId]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
    if (canvas.width !== cssW * dpr || canvas.height !== cssH * dpr) {
      canvas.width = cssW * dpr;
      canvas.height = cssH * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#1E1E2E';
    ctx.fillRect(0, 0, cssW, cssH);

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(zoom, zoom);

    drawBezierConnections(ctx, shapesRef.current);

    for (const shape of shapesRef.current) {
      const selected = shape.id === selectedIdRef.current;
      const dragging = shape.id === draggingRef.current;
      drawShape(ctx, shape, selected, dragging);
    }

    ctx.restore();
  }, [zoom, offsetX, offsetY]);

  useEffect(() => {
    let rafId = 0;
    let lastShapes = shapes;
    const loop = () => {
      if (
        shapesRef.current !== lastShapes ||
        draggingRef.current ||
        panningRef.current
      ) {
        lastShapes = shapesRef.current;
        render();
      }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    render();
    return () => cancelAnimationFrame(rafId);
  }, [render, shapes]);

  const screenToWorld = (sx: number, sy: number) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = sx - rect.left;
    const y = sy - rect.top;
    return {
      x: (x - offsetX) / zoom,
      y: (y - offsetY) / zoom,
    };
  };

  const triggerZoomIndicator = () => {
    setZoomIndicatorVisible(true);
    setZoomIndicatorFading(false);
    if (zoomFadeTimerRef.current) {
      clearTimeout(zoomFadeTimerRef.current);
    }
    zoomFadeTimerRef.current = window.setTimeout(() => {
      setZoomIndicatorFading(true);
      window.setTimeout(() => {
        setZoomIndicatorVisible(false);
        setZoomIndicatorFading(false);
      }, 500);
    }, 2000);
  };

  useEffect(() => {
    triggerZoomIndicator();
    return () => {
      if (zoomFadeTimerRef.current) clearTimeout(zoomFadeTimerRef.current);
    };
  }, [zoom]);

  const onMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const world = screenToWorld(e.clientX, e.clientY);

    if (spaceDownRef.current) {
      panningRef.current = true;
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        offsetX,
        offsetY,
      };
      return;
    }

    for (let i = shapesRef.current.length - 1; i >= 0; i--) {
      const shape = shapesRef.current[i];
      if (hitTest(shape, world.x, world.y)) {
        setSelectedShape(shape.id);
        draggingRef.current = shape.id;
        const center = getShapeCenter(shape);
        if (shape.type === 'rect') {
          dragOffsetRef.current = {
            x: world.x - shape.x,
            y: world.y - shape.y,
          };
        } else {
          dragOffsetRef.current = {
            x: world.x - center.x,
            y: world.y - center.y,
          };
        }
        return;
      }
    }
    setSelectedShape(null);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (panningRef.current) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      setOffset(panStartRef.current.offsetX + dx, panStartRef.current.offsetY + dy);
      return;
    }
    if (!draggingRef.current) return;
    const world = screenToWorld(e.clientX, e.clientY);
    const id = draggingRef.current;
    const shape = shapesRef.current.find((s) => s.id === id);
    if (!shape) return;
    if (shape.type === 'rect') {
      updateShape(id, {
        x: world.x - dragOffsetRef.current.x,
        y: world.y - dragOffsetRef.current.y,
      });
    } else {
      const center = getShapeCenter(shape);
      updateShape(id, {
        x: center.x + (world.x - center.x - dragOffsetRef.current.x),
        y: center.y + (world.y - center.y - dragOffsetRef.current.y),
      });
    }
  };

  const onMouseUp = () => {
    panningRef.current = false;
    draggingRef.current = null;
  };

  const onDoubleClick = (e: React.MouseEvent) => {
    const world = screenToWorld(e.clientX, e.clientY);
    for (let i = shapesRef.current.length - 1; i >= 0; i--) {
      const shape = shapesRef.current[i];
      if (hitTest(shape, world.x, world.y)) {
        setEditingShape({ ...shape });
        const rect = canvasRef.current!.getBoundingClientRect();
        setEditPanelPos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
        return;
      }
    }
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(zoom + delta, cx, cy);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') spaceDownRef.current = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') spaceDownRef.current = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  const handleEditChange = (patch: Partial<Shape>) => {
    if (!editingShape) return;
    const updated = { ...editingShape, ...patch };
    setEditingShape(updated);
    updateShape(editingShape.id, patch);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const thumbnail = canvas.toDataURL('image/png');
    saveTemplate(currentTemplateName || '未命名模板', thumbnail);
    const btn = document.getElementById('save-btn');
    if (btn) {
      btn.textContent = '已保存 ✓';
      btn.style.backgroundColor = '#059669';
      setTimeout(() => {
        btn.textContent = '保存模板';
        btn.style.backgroundColor = '';
      }, 1200);
    }
  };

  const handleAddRect = () => {
    const world = screenToWorld(
      window.innerWidth / 2,
      window.innerHeight / 2
    );
    addShape({
      type: 'rect',
      x: world.x - 60,
      y: world.y - 30,
      width: 120,
      height: 60,
      radius: 8,
      fill: '#3B82F6',
    });
  };

  const handleAddCircle = () => {
    const world = screenToWorld(
      window.innerWidth / 2,
      window.innerHeight / 2
    );
    addShape({
      type: 'circle',
      x: world.x,
      y: world.y,
      width: 80,
      height: 80,
      radius: 40,
      fill: '#F59E0B',
    });
  };

  return (
    <div
      style={{
        position: 'relative',
        flex: 1,
        overflow: 'hidden',
        backgroundColor: '#1E1E2E',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block', cursor: spaceDownRef.current ? 'grab' : 'default' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onDoubleClick={onDoubleClick}
        onWheel={onWheel}
      />

      <div
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          display: 'flex',
          gap: 8,
        }}
      >
        <button
          onClick={handleAddRect}
          style={{
            padding: '8px 16px',
            backgroundColor: '#2D2D3F',
            color: '#E0E0E0',
            border: '1px solid #444444',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          + 矩形
        </button>
        <button
          onClick={handleAddCircle}
          style={{
            padding: '8px 16px',
            backgroundColor: '#2D2D3F',
            color: '#E0E0E0',
            border: '1px solid #444444',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          + 圆形
        </button>
      </div>

      {zoomIndicatorVisible && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            padding: '4px 8px',
            backgroundColor: 'rgba(0,0,0,0.5)',
            color: '#FFFFFF',
            fontSize: 12,
            borderRadius: 4,
            opacity: zoomIndicatorFading ? 0 : 1,
            transition: 'opacity 0.5s ease',
            pointerEvents: 'none',
          }}
        >
          {Math.round(zoom * 100)}%
        </div>
      )}

      <button
        id="save-btn"
        onClick={handleSave}
        style={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          padding: '10px 20px',
          backgroundColor: '#10B981',
          color: '#FFFFFF',
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer',
          fontSize: 14,
          fontWeight: 500,
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#34D399')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#10B981')}
      >
        保存模板
      </button>

      {editingShape && (
        <div
          style={{
            position: 'absolute',
            left: Math.min(editPanelPos.x, (canvasRef.current?.clientWidth || 800) - 260),
            top: Math.min(editPanelPos.y, (canvasRef.current?.clientHeight || 600) - 320),
            backgroundColor: '#2D2D3F',
            borderRadius: 8,
            padding: 12,
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            color: '#E0E0E0',
            minWidth: 220,
            fontSize: 13,
            zIndex: 10,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 12 }}>编辑图形</div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ marginBottom: 6 }}>填充色</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => handleEditChange({ fill: c })}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 4,
                    backgroundColor: c,
                    border: editingShape.fill === c ? '2px solid #FFFFFF' : '2px solid transparent',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            <div>
              <div style={{ marginBottom: 4, fontSize: 12, color: '#AAAAAA' }}>X</div>
              <input
                type="number"
                value={Math.round(editingShape.x)}
                onChange={(e) => handleEditChange({ x: Number(e.target.value) })}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  backgroundColor: '#1E1E2E',
                  border: '1px solid #444444',
                  borderRadius: 4,
                  color: '#E0E0E0',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <div style={{ marginBottom: 4, fontSize: 12, color: '#AAAAAA' }}>Y</div>
              <input
                type="number"
                value={Math.round(editingShape.y)}
                onChange={(e) => handleEditChange({ y: Number(e.target.value) })}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  backgroundColor: '#1E1E2E',
                  border: '1px solid #444444',
                  borderRadius: 4,
                  color: '#E0E0E0',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {editingShape.type === 'rect' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              <div>
                <div style={{ marginBottom: 4, fontSize: 12, color: '#AAAAAA' }}>宽度</div>
                <input
                  type="number"
                  value={Math.round(editingShape.width)}
                  onChange={(e) => handleEditChange({ width: Number(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    backgroundColor: '#1E1E2E',
                    border: '1px solid #444444',
                    borderRadius: 4,
                    color: '#E0E0E0',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <div style={{ marginBottom: 4, fontSize: 12, color: '#AAAAAA' }}>高度</div>
                <input
                  type="number"
                  value={Math.round(editingShape.height)}
                  onChange={(e) => handleEditChange({ height: Number(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    backgroundColor: '#1E1E2E',
                    border: '1px solid #444444',
                    borderRadius: 4,
                    color: '#E0E0E0',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: 12 }}>
              <div style={{ marginBottom: 4, fontSize: 12, color: '#AAAAAA' }}>半径</div>
              <input
                type="number"
                value={Math.round(editingShape.radius)}
                onChange={(e) => handleEditChange({ radius: Number(e.target.value) })}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  backgroundColor: '#1E1E2E',
                  border: '1px solid #444444',
                  borderRadius: 4,
                  color: '#E0E0E0',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button
              onClick={() => setEditingShape(null)}
              style={{
                padding: '6px 14px',
                backgroundColor: '#1E1E2E',
                color: '#E0E0E0',
                border: '1px solid #444444',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
