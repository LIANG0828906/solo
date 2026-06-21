import { useEffect, useRef, useState, useCallback } from 'react';
import { useAppState } from '../state';
import { WallRenderer } from '../renderer';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../state';

interface DragState {
  mode: 'move' | 'rotate';
  startX: number;
  startY: number;
  origX: number;
  origY: number;
  origRotation: number;
  elementId: string;
  layerId: string;
}

export default function CanvasArea() {
  const { state, dispatch } = useAppState();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<WallRenderer | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const hoverTimerRef = useRef<number | null>(null);
  const [scale, setScale] = useState(1);
  const [hoveredElement, setHoveredElement] = useState<{ elementId: string; layerId: string } | null>(null);
  const [cursorStyle, setCursorStyle] = useState<string>('crosshair');
  const HOVER_DEBOUNCE_MS = 40;

  useEffect(() => {
    if (!canvasRef.current) return;
    const renderer = new WallRenderer(canvasRef.current);
    rendererRef.current = renderer;

    renderer.setFrameCallback((dt) => {
      if (state.isPlaying) {
        dispatch({ type: 'ADVANCE_ANIMATION', deltaTime: dt });
      }
    });

    renderer.start();

    return () => {
      renderer.stop();
    };
  }, []);

  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.render(
        state.layers,
        state.selectedElementId,
        state.selectedLayerId,
        hoveredElement?.elementId ?? null,
        hoveredElement?.layerId ?? null
      );
    }
  }, [state.layers, state.selectedElementId, state.selectedLayerId, hoveredElement]);

  useEffect(() => {
    function updateScale() {
      if (!canvasRef.current) return;
      const container = canvasRef.current.parentElement;
      if (!container) return;
      const containerWidth = container.clientWidth - 40;
      const containerHeight = container.clientHeight - 40;
      const scaleX = containerWidth / CANVAS_WIDTH;
      const scaleY = containerHeight / CANVAS_HEIGHT;
      setScale(Math.min(scaleX, scaleY, 1));
    }
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const getCanvasCoords = useCallback(
    (clientX: number, clientY: number) => {
      if (!canvasRef.current) return { x: 0, y: 0 };
      const rect = canvasRef.current.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * CANVAS_WIDTH;
      const y = ((clientY - rect.top) / rect.height) * CANVAS_HEIGHT;
      return { x, y };
    },
    []
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!rendererRef.current) return;
      const { x, y } = getCanvasCoords(e.clientX, e.clientY);

      if (state.selectedElementId && state.selectedLayerId) {
        const handle = rendererRef.current.getHandleAt(
          x,
          y,
          state.selectedElementId,
          state.selectedLayerId,
          state.layers
        );
        if (handle) {
          const center = rendererRef.current.getElementCenter(
            state.selectedElementId,
            state.selectedLayerId,
            state.layers
          );
          let origRotation = 0;
          const layer = state.layers.find((l) => l.id === state.selectedLayerId);
          if (layer?.type === 'geometry') {
            const poly = layer.polygons.find((p) => p.id === state.selectedElementId);
            if (poly) origRotation = poly.rotation;
          }

          dragRef.current = {
            mode: handle,
            startX: x,
            startY: y,
            origX: center?.x || 0,
            origY: center?.y || 0,
            origRotation,
            elementId: state.selectedElementId,
            layerId: state.selectedLayerId,
          };
          return;
        }
      }

      const hit = rendererRef.current.hitTest(x, y, state.layers);
      if (hit) {
        dispatch({
          type: 'SELECT_ELEMENT',
          elementId: hit.elementId,
          layerId: hit.layerId,
        });

        const center = rendererRef.current.getElementCenter(
          hit.elementId,
          hit.layerId,
          state.layers
        );
        let origRotation = 0;
        const layer = state.layers.find((l) => l.id === hit.layerId);
        if (layer?.type === 'geometry') {
          const poly = layer.polygons.find((p) => p.id === hit.elementId);
          if (poly) origRotation = poly.rotation;
        }

        dragRef.current = {
          mode: 'move',
          startX: x,
          startY: y,
          origX: center?.x || 0,
          origY: center?.y || 0,
          origRotation,
          elementId: hit.elementId,
          layerId: hit.layerId,
        };
      } else {
        dispatch({ type: 'SELECT_ELEMENT', elementId: null, layerId: null });
      }
    },
    [state, dispatch, getCanvasCoords]
  );

  const updateHoverState = useCallback(
    (x: number, y: number) => {
      if (!rendererRef.current) return;
      const hit = rendererRef.current.hitTest(x, y, state.layers);
      if (hit) {
        setHoveredElement({ elementId: hit.elementId, layerId: hit.layerId });
        setCursorStyle('pointer');
      } else {
        setHoveredElement(null);
        setCursorStyle('crosshair');
      }
    },
    [state.layers]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!rendererRef.current) return;

      const { x, y } = getCanvasCoords(e.clientX, e.clientY);

      if (dragRef.current) {
        const drag = dragRef.current;

        if (drag.mode === 'move') {
          const dx = x - drag.startX;
          const dy = y - drag.startY;
          const newX = drag.origX + dx;
          const newY = drag.origY + dy;

          const layer = state.layers.find((l) => l.id === drag.layerId);
          if (!layer) return;

          if (layer.type === 'geometry') {
            dispatch({
              type: 'UPDATE_POLYGON',
              layerId: drag.layerId,
              polygonId: drag.elementId,
              updates: { x: newX, y: newY },
            });
          } else if (layer.type === 'particles') {
            dispatch({
              type: 'UPDATE_PARTICLE',
              layerId: drag.layerId,
              particleId: drag.elementId,
              updates: { x: newX, y: newY },
            });
          } else if (layer.type === 'lines') {
            const line = layer.lines.find((l) => l.id === drag.elementId);
            if (line) {
              const centerX = (line.startX + line.endX) / 2;
              const centerY = (line.startY + line.endY) / 2;
              const offsetX = newX - centerX;
              const offsetY = newY - centerY;
              dispatch({
                type: 'UPDATE_LINE',
                layerId: drag.layerId,
                lineId: drag.elementId,
                updates: {
                  startX: line.startX + offsetX,
                  startY: line.startY + offsetY,
                  endX: line.endX + offsetX,
                  endY: line.endY + offsetY,
                  cp1x: line.cp1x + offsetX,
                  cp1y: line.cp1y + offsetY,
                  cp2x: line.cp2x + offsetX,
                  cp2y: line.cp2y + offsetY,
                },
              });
            }
          }
        } else if (drag.mode === 'rotate') {
          const angle = Math.atan2(y - drag.origY, x - drag.origX);
          const layer = state.layers.find((l) => l.id === drag.layerId);
          if (layer?.type === 'geometry') {
            dispatch({
              type: 'UPDATE_POLYGON',
              layerId: drag.layerId,
              polygonId: drag.elementId,
              updates: { rotation: angle },
            });
          }
        }
        return;
      }

      if (hoverTimerRef.current !== null) {
        window.clearTimeout(hoverTimerRef.current);
      }
      hoverTimerRef.current = window.setTimeout(() => {
        updateHoverState(x, y);
      }, HOVER_DEBOUNCE_MS);
    },
    [state, dispatch, getCanvasCoords, updateHoverState, HOVER_DEBOUNCE_MS]
  );

  const handleMouseUp = useCallback(() => {
    dragRef.current = null;
    setHoveredElement(null);
    setCursorStyle('crosshair');
  }, []);

  return (
    <div
      style={{
        flex: '0 0 70%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1a1a2e',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          boxShadow: '0 0 60px rgba(79, 195, 247, 0.15), 0 20px 60px rgba(0,0,0,0.5)',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            display: 'block',
            cursor: cursorStyle as 'crosshair' | 'pointer',
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
          }}
        />
      </div>
    </div>
  );
}
