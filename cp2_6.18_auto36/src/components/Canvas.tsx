import { useRef, useEffect, useCallback, useState } from 'react';
import type { AppState, Action, Stroke, Point, StickyNote, Connection } from '@/types';
import { CONSTANTS } from '@/constants';
import { StickyNote as StickyNoteComponent } from './StickyNote';

interface CanvasProps {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

export function Canvas({ state, dispatch }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawingRef = useRef(false);
  const isPanningRef = useRef(false);
  const isSpacePressedRef = useRef(false);
  const currentStrokeRef = useRef<Stroke | null>(null);
  const panStartRef = useRef<{ x: number; y: number; transformX: number; transformY: number } | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const targetScaleRef = useRef(state.transform.scale);
  const scaleAnimationRef = useRef<{
    start: number; duration: number; startScale: number; endScale: number; centerX: number; centerY: number } | null>(null);
  const lastDrawRef = useRef(0);
  const dirtyRef = useRef(true);
  const [hoveredConnectionId, setHoveredConnectionId] = useState<string | null>(null);

  const screenToWorld = useCallback((clientX: number, clientY: number): Point => {
    const container = containerRef.current;
    if (!container) return { x: 0, y: 0 };

    const rect = container.getBoundingClientRect();
    const { transform } = state;
    const x = (clientX - rect.left - transform.x) / transform.scale;
    const y = (clientY - rect.top - transform.y) / transform.scale;

    return { x, y };
  }, [state.transform]);

  const drawConnections = useCallback((ctx: CanvasRenderingContext2D) => {
    state.connections.forEach((connection: Connection) => {
      const fromNote = state.notes.find((n) => n.id === connection.fromNoteId);
      const toNote = state.notes.find((n) => n.id === connection.toNoteId);

      if (!fromNote || !toNote) return;

      const from = {
        x: fromNote.x + fromNote.width / 2,
        y: fromNote.y + fromNote.height / 2,
      };
      const to = {
        x: toNote.x + toNote.width / 2,
        y: toNote.y + toNote.height / 2,
      };

      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const curvature = connection.curvature * Math.min(1, distance / 200);

      const midX = (from.x + to.x) / 2 - dy * curvature * 0.3;
      const midY = (from.y + to.y) / 2 + dx * curvature * 0.3;

      const isSelected = state.selectedConnectionId === connection.id;
      const isHovered = hoveredConnectionId === connection.id;

      ctx.strokeStyle = isSelected
        ? '#FF6B6B'
        : isHovered
        ? '#7FB5F0'
        : CONSTANTS.CONNECTION_COLOR;
      ctx.lineWidth = isSelected || isHovered ? CONSTANTS.CONNECTION_WIDTH + 2 : CONSTANTS.CONNECTION_WIDTH;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.quadraticCurveTo(midX, midY, to.x, to.y);
      ctx.stroke();

      const arrowSize = 10;
      const angle = Math.atan2(to.y - midY, to.x - midX);
      ctx.fillStyle = isSelected
        ? '#FF6B6B'
        : isHovered
        ? '#7FB5F0'
        : CONSTANTS.CONNECTION_COLOR;
      ctx.beginPath();
      ctx.moveTo(to.x, to.y);
      ctx.lineTo(
        to.x - arrowSize * Math.cos(angle - Math.PI / 6),
        to.y - arrowSize * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        to.x - arrowSize * Math.cos(angle + Math.PI / 6),
        to.y - arrowSize * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fill();
    });
  }, [state.connections, state.notes, state.selectedConnectionId, hoveredConnectionId]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      dirtyRef.current = true;
    }

    if (!dirtyRef.current) return;
    dirtyRef.current = false;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = CONSTANTS.CANVAS_BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.setTransform(
      state.transform.scale * dpr,
      0,
      0,
      state.transform.scale * dpr,
      state.transform.x * dpr,
      state.transform.y * dpr
    );

    state.strokes.forEach((stroke) => {
      if (stroke.points.length < 2) return;

      ctx.strokeStyle = stroke.isEraser ? CONSTANTS.CANVAS_BG : stroke.color;
      ctx.lineWidth = stroke.isEraser ? CONSTANTS.ERASER_WIDTH : stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

      for (let i = 1; i < stroke.points.length; i++) {
        const p0 = stroke.points[i - 1];
        const p1 = stroke.points[i];
        const midX = (p0.x + p1.x) / 2;
        const midY = (p0.y + p1.y) / 2;
        ctx.quadraticCurveTo(p0.x, p0.y, midX, midY);
      }

      const lastPoint = stroke.points[stroke.points.length - 1];
      ctx.lineTo(lastPoint.x, lastPoint.y);
      ctx.stroke();
    });

    drawConnections(ctx);

    if (currentStrokeRef.current && currentStrokeRef.current.points.length > 1) {
      const stroke = currentStrokeRef.current;
      ctx.strokeStyle = stroke.isEraser ? CONSTANTS.CANVAS_BG : stroke.color;
      ctx.lineWidth = stroke.isEraser ? CONSTANTS.ERASER_WIDTH : stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

      for (let i = 1; i < stroke.points.length; i++) {
        const p0 = stroke.points[i - 1];
        const p1 = stroke.points[i];
        const midX = (p0.x + p1.x) / 2;
        const midY = (p0.y + p1.y) / 2;
        ctx.quadraticCurveTo(p0.x, p0.y, midX, midY);
      }

      const lastPoint = stroke.points[stroke.points.length - 1];
      ctx.lineTo(lastPoint.x, lastPoint.y);
      ctx.stroke();
    }
  }, [state.transform, state.strokes, drawConnections]);

  useEffect(() => {
    dirtyRef.current = true;
  }, [state, hoveredConnectionId]);

  const animateScale = useCallback((timestamp: number) => {
    if (!scaleAnimationRef.current) return;

    const { start, duration, startScale, endScale, centerX, centerY } = scaleAnimationRef.current;
    const elapsed = timestamp - start;
    const progress = Math.min(elapsed / duration, 1);

    const easeProgress = 1 - Math.pow(1 - progress, 3);

    const currentScale = startScale + (endScale - startScale) * easeProgress;

    const scaleRatio = currentScale / state.transform.scale;
    const newX = centerX - (centerX - state.transform.x) * scaleRatio;
    const newY = centerY - (centerY - state.transform.y) * scaleRatio;

    dispatch({
      type: 'SET_TRANSFORM',
      payload: {
        x: newX,
        y: newY,
        scale: currentScale,
      },
    });

    if (progress < 1) {
      animationFrameRef.current = requestAnimationFrame(animateScale);
    } else {
      scaleAnimationRef.current = null;
    }
  }, [state.transform, dispatch]);

  useEffect(() => {
    let running = true;
    const animate = (timestamp: number) => {
      if (!running) return;
      if (timestamp - lastDrawRef.current >= 16) {
        render();
        lastDrawRef.current = timestamp;
      }
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);

    return () => {
      running = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [render]);

  const hitTestConnection = useCallback(
    (worldX: number, worldY: number): Connection | null => {
      for (let i = state.connections.length - 1; i >= 0; i--) {
        const connection = state.connections[i];
        const fromNote = state.notes.find((n) => n.id === connection.fromNoteId);
        const toNote = state.notes.find((n) => n.id === connection.toNoteId);

        if (!fromNote || !toNote) continue;

        const from = {
          x: fromNote.x + fromNote.width / 2,
          y: fromNote.y + fromNote.height / 2,
        };
        const to = {
          x: toNote.x + toNote.width / 2,
          y: toNote.y + toNote.height / 2,
        };

        const steps = 30;
        for (let s = 0; s <= steps; s++) {
          const t = s / steps;
          const dx = to.x - from.x;
          const dy = to.y - from.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const curvature = connection.curvature * Math.min(1, distance / 200);
          const midX = (from.x + to.x) / 2 - dy * curvature * 0.3;
          const midY = (from.y + to.y) / 2 + dx * curvature * 0.3;

          const cx = (1 - t) * (1 - t) * from.x + 2 * (1 - t) * t * midX + t * t * to.x;
          const cy = (1 - t) * (1 - t) * from.y + 2 * (1 - t) * t * midY + t * t * to.y;

          const distToPoint = Math.sqrt((worldX - cx) ** 2 + (worldY - cy) ** 2);
          if (distToPoint < 8 / state.transform.scale) {
            return connection;
          }
        }
      }
      return null;
    },
    [state.connections, state.notes, state.transform.scale]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;

    const point = screenToWorld(e.clientX, e.clientY);

    if (isSpacePressedRef.current) {
      isPanningRef.current = true;
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        transformX: state.transform.x,
        transformY: state.transform.y,
      };
      return;
    }

    const hitConnection = hitTestConnection(point.x, point.y);
    if (hitConnection && !e.ctrlKey && !e.metaKey) {
      dispatch({ type: 'SELECT_CONNECTION', payload: hitConnection.id });
      return;
    }

    if (state.currentTool === 'pen' || state.currentTool === 'eraser') {
      isDrawingRef.current = true;
      currentStrokeRef.current = {
        id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        points: [point],
        color: state.currentColor,
        width: state.currentWidth,
        isEraser: state.currentTool === 'eraser',
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanningRef.current && panStartRef.current) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;

      dispatch({
        type: 'SET_TRANSFORM',
        payload: {
          ...state.transform,
          x: panStartRef.current.transformX + dx,
          y: panStartRef.current.transformY + dy,
        },
      });
      return;
    }

    if (isDrawingRef.current && currentStrokeRef.current) {
      const point = screenToWorld(e.clientX, e.clientY);
      const lastPoint = currentStrokeRef.current.points[currentStrokeRef.current.points.length - 1];

      const dx = point.x - lastPoint.x;
      const dy = point.y - lastPoint.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 0.5) {
        currentStrokeRef.current.points.push(point);
        dirtyRef.current = true;
      }
    }

    const point = screenToWorld(e.clientX, e.clientY);
    const hitConnection = hitTestConnection(point.x, point.y);
    setHoveredConnectionId(hitConnection ? hitConnection.id : null);
  };

  const handleMouseUp = () => {
    if (isPanningRef.current) {
      isPanningRef.current = false;
      panStartRef.current = null;
      return;
    }

    if (isDrawingRef.current && currentStrokeRef.current) {
      if (currentStrokeRef.current.points.length > 1) {
        dispatch({
          type: 'ADD_STROKE',
          payload: currentStrokeRef.current,
        });
      }
      isDrawingRef.current = false;
      currentStrokeRef.current = null;
      dirtyRef.current = true;
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(
      CONSTANTS.MIN_SCALE,
      Math.min(CONSTANTS.MAX_SCALE, state.transform.scale * delta)
    );

    if (newScale === state.transform.scale) return;

    targetScaleRef.current = newScale;

    scaleAnimationRef.current = {
      start: performance.now(),
      duration: CONSTANTS.SCALE_DURATION,
      startScale: state.transform.scale,
      endScale: newScale,
      centerX: mouseX,
      centerY: mouseY,
    };

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(animateScale);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (e.target !== canvasRef.current) return;

    const point = screenToWorld(e.clientX, e.clientY);

    const newNote: StickyNote = {
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      x: point.x - CONSTANTS.NOTE_WIDTH / 2,
      y: point.y - CONSTANTS.NOTE_HEIGHT / 2,
      text: '',
      width: CONSTANTS.NOTE_WIDTH,
      height: CONSTANTS.NOTE_HEIGHT,
    };

    dispatch({ type: 'ADD_NOTE', payload: newNote });
  };

  const handleCanvasClick = () => {
    if (state.connectionStartId) {
      dispatch({ type: 'SET_CONNECTION_START', payload: null });
    }
    dispatch({ type: 'SELECT_NOTE', payload: null });
    dispatch({ type: 'SELECT_CONNECTION', payload: null });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        isSpacePressedRef.current = true;
        document.body.style.cursor = 'grab';
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && state.selectedConnectionId) {
        dispatch({ type: 'DELETE_CONNECTION', payload: state.selectedConnectionId });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        isSpacePressedRef.current = false;
        document.body.style.cursor = '';
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [state.selectedConnectionId, dispatch]);

  const handleNoteUpdate = (note: StickyNote) => {
    dispatch({ type: 'UPDATE_NOTE', payload: note });
    dirtyRef.current = true;
  };

  const handleNoteDelete = (id: string) => {
    dispatch({ type: 'DELETE_NOTE', payload: id });
    dirtyRef.current = true;
  };

  const handleNoteSelect = (id: string | null) => {
    dispatch({ type: 'SELECT_NOTE', payload: id });
  };

  const handleStartConnection = (id: string) => {
    dispatch({ type: 'SET_CONNECTION_START', payload: id });
  };

  const handleEndConnection = (id: string) => {
    if (state.connectionStartId && state.connectionStartId !== id) {
      const connection: Connection = {
        id: `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        fromNoteId: state.connectionStartId,
        toNoteId: id,
        curvature: state.connectionCurvature,
      };
      dispatch({ type: 'ADD_CONNECTION', payload: connection });
    }
    dispatch({ type: 'SET_CONNECTION_START', payload: null });
    dirtyRef.current = true;
  };

  const { transform } = state;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: CONSTANTS.TOOLBAR_HEIGHT,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        backgroundColor: CONSTANTS.CANVAS_BG,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          cursor: isSpacePressedRef.current
            ? 'grab'
            : hoveredConnectionId
            ? 'pointer'
            : state.currentTool === 'eraser'
            ? 'cell'
            : 'crosshair',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
        onClick={handleCanvasClick}
      />

      {state.notes.map((note) => {
        const screenX = transform.x + note.x * transform.scale;
        const screenY = transform.y + note.y * transform.scale;

        return (
          <div
            key={note.id}
            style={{
              position: 'absolute',
              left: screenX,
              top: screenY,
              width: note.width * transform.scale,
              height: note.height * transform.scale,
              pointerEvents: 'auto',
              zIndex: state.selectedNoteId === note.id ? 100 : 1,
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                transformOrigin: '0 0',
                transform: `scale(${transform.scale})`,
              }}
            >
              <StickyNoteComponent
                note={note}
                scale={transform.scale}
                isSelected={state.selectedNoteId === note.id}
                isConnectionStart={state.connectionStartId === note.id}
                onUpdate={handleNoteUpdate}
                onDelete={handleNoteDelete}
                onSelect={handleNoteSelect}
                onStartConnection={handleStartConnection}
                onEndConnection={handleEndConnection}
              />
            </div>
          </div>
        );
      })}

      {state.selectedConnectionId && (
        <div
          style={{
            position: 'absolute',
            top: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            padding: '12px 20px',
            borderRadius: '12px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            zIndex: 500,
          }}
        >
          <span style={{ fontSize: '13px', color: '#333', fontWeight: 500 }}>
            曲线弧度
          </span>
          <input
            type="range"
            min="0"
            max="3"
            step="0.1"
            value={
              state.connections.find((c) => c.id === state.selectedConnectionId)?.curvature ??
              state.connectionCurvature
            }
            onChange={(e) => {
              const curvature = Number(e.target.value);
              const connection = state.connections.find((c) => c.id === state.selectedConnectionId);
              if (connection) {
                dispatch({
                  type: 'UPDATE_CONNECTION',
                  payload: { ...connection, curvature },
                });
              }
              dispatch({ type: 'SET_CONNECTION_CURVATURE', payload: curvature });
            }}
            style={{
              width: '120px',
              height: '4px',
              borderRadius: '2px',
              cursor: 'pointer',
              accentColor: '#4A90D9',
            }}
          />
          <span style={{ fontSize: '12px', color: '#666', minWidth: '32px', textAlign: 'center' }}>
            {(
              state.connections.find((c) => c.id === state.selectedConnectionId)?.curvature ??
              state.connectionCurvature
            ).toFixed(1)}
          </span>
          <button
            onClick={() => {
              if (state.selectedConnectionId) {
                dispatch({ type: 'DELETE_CONNECTION', payload: state.selectedConnectionId });
              }
            }}
            style={{
              padding: '6px 12px',
              backgroundColor: '#FF6B6B',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 500,
            }}
          >
            删除连线
          </button>
        </div>
      )}

      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          padding: '8px 16px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          fontSize: '12px',
          color: '#666',
          pointerEvents: 'none',
          lineHeight: 1.6,
        }}
      >
        <div>缩放: {Math.round(transform.scale * 100)}%</div>
        <div>按住空格+拖拽平移 | 滚轮缩放 | 双击创建便签</div>
        <div>Ctrl+点击两个便签创建连线 | 点击连线可编辑</div>
      </div>
    </div>
  );
}
