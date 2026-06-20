import { useRef, useEffect, useState, useCallback } from 'react';
import { useStore } from '../store/useStore';
import {
  drawLayers,
  drawSelectionHandles,
  isPointInLayer,
  getHandleAtPoint,
  loadImage,
  BLEND_MODES,
  type Layer,
  type HandleType,
} from '../core/canvasEngine';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;
const MIN_SIZE = 20;

type InteractionMode =
  | { kind: 'none' }
  | { kind: 'move'; startX: number; startY: number; origLayer: Layer }
  | { kind: 'resize'; handle: HandleType; startX: number; startY: number; origLayer: Layer }
  | { kind: 'rotate'; startAngle: number; startRotation: number; layerId: string };

export default function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const layers = useStore((s) => s.layers);
  const selectedLayerId = useStore((s) => s.selectedLayerId);
  const updateLayer = useStore((s) => s.updateLayer);
  const deleteLayer = useStore((s) => s.deleteLayer);
  const setSelectedLayer = useStore((s) => s.setSelectedLayer);
  const pushHistory = useStore((s) => s.pushHistory);
  const setStatusRotation = useStore((s) => s.setStatusRotation);

  const [interaction, setInteraction] = useState<InteractionMode>({ kind: 'none' });
  const [isDragging, setIsDragging] = useState(false);
  const lastClickTime = useRef(0);
  const rafId = useRef<number | null>(null);
  const interactionRef = useRef(interaction);
  const layersRef = useRef(layers);

  useEffect(() => {
    interactionRef.current = interaction;
  }, [interaction]);

  useEffect(() => {
    layersRef.current = layers;
  }, [layers]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawLayers(ctx, layers, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (selectedLayerId) {
      const selLayer = layers.find((l) => l.id === selectedLayerId);
      if (selLayer) {
        drawSelectionHandles(ctx, selLayer);
      }
    }
  }, [layers, selectedLayerId]);

  useEffect(() => {
    function tick() {
      render();
      rafId.current = requestAnimationFrame(tick);
    }
    rafId.current = requestAnimationFrame(tick);
    return () => {
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    };
  }, [render]);

  useEffect(() => {
    const promises: Promise<unknown>[] = [];
    for (const layer of layers) {
      if (layer.type === 'image' && layer.src) {
        promises.push(loadImage(layer.src).then(() => render()));
      }
    }
    Promise.all(promises).then(() => render());
  }, [layers, render]);

  function getCanvasCoords(e: React.MouseEvent | MouseEvent): { x: number; y: number } {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function handleMouseDown(e: React.MouseEvent) {
    const { x, y } = getCanvasCoords(e);

    if (selectedLayerId) {
      const selLayer = layers.find((l) => l.id === selectedLayerId);
      if (selLayer) {
        const handle = getHandleAtPoint(selLayer, x, y);
        if (handle === 'rotate') {
          const dx = x - selLayer.x;
          const dy = y - selLayer.y;
          const startAngle = Math.atan2(dy, dx);
          const newInteraction: InteractionMode = {
            kind: 'rotate',
            startAngle,
            startRotation: selLayer.rotation,
            layerId: selLayer.id,
          };
          setInteraction(newInteraction);
          interactionRef.current = newInteraction;
          pushHistory();
          setIsDragging(true);
          e.preventDefault();
          return;
        }
        if (handle) {
          const newInteraction: InteractionMode = {
            kind: 'resize',
            handle,
            startX: x,
            startY: y,
            origLayer: { ...selLayer },
          };
          setInteraction(newInteraction);
          interactionRef.current = newInteraction;
          pushHistory();
          setIsDragging(true);
          e.preventDefault();
          return;
        }
      }
    }

    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      if (isPointInLayer(layer, x, y)) {
        const now = Date.now();
        if (now - lastClickTime.current < 300) {
          deleteLayer(layer.id);
          lastClickTime.current = 0;
          return;
        }
        lastClickTime.current = now;

        setSelectedLayer(layer.id);
        const newInteraction: InteractionMode = {
          kind: 'move',
          startX: x,
          startY: y,
          origLayer: { ...layer },
        };
        setInteraction(newInteraction);
        interactionRef.current = newInteraction;
        setIsDragging(true);
        e.preventDefault();
        return;
      }
    }

    setSelectedLayer(null);
  }

  useEffect(() => {
    if (!isDragging) return;

    function onMouseMove(e: MouseEvent) {
      const cur = interactionRef.current;
      if (cur.kind === 'none') return;
      const { x, y } = getCanvasCoords(e);

      if (cur.kind === 'move') {
        const dx = x - cur.startX;
        const dy = y - cur.startY;
        updateLayer(cur.origLayer.id, {
          x: cur.origLayer.x + dx,
          y: cur.origLayer.y + dy,
        });
      } else if (cur.kind === 'resize') {
        const { handle, origLayer } = cur;

        const cos = Math.cos((-origLayer.rotation * Math.PI) / 180);
        const sin = Math.sin((-origLayer.rotation * Math.PI) / 180);
        const localDx = (x - origLayer.x) * cos - (y - origLayer.y) * sin;
        const localDy = (x - origLayer.x) * sin + (y - origLayer.y) * cos;

        const startLocalDx = (cur.startX - origLayer.x) * cos - (cur.startY - origLayer.y) * sin;
        const startLocalDy = (cur.startX - origLayer.x) * sin + (cur.startY - origLayer.y) * cos;

        const deltaLocalX = localDx - startLocalDx;
        const deltaLocalY = localDy - startLocalDy;

        const halfOrigW = origLayer.width / 2;
        const halfOrigH = origLayer.height / 2;

        let left = -halfOrigW;
        let right = halfOrigW;
        let top = -halfOrigH;
        let bottom = halfOrigH;

        switch (handle) {
          case 'tl':
            left += deltaLocalX;
            top += deltaLocalY;
            break;
          case 'tm':
            top += deltaLocalY;
            break;
          case 'tr':
            right += deltaLocalX;
            top += deltaLocalY;
            break;
          case 'mr':
            right += deltaLocalX;
            break;
          case 'br':
            right += deltaLocalX;
            bottom += deltaLocalY;
            break;
          case 'bm':
            bottom += deltaLocalY;
            break;
          case 'bl':
            left += deltaLocalX;
            bottom += deltaLocalY;
            break;
          case 'ml':
            left += deltaLocalX;
            break;
        }

        const newW = Math.max(MIN_SIZE, right - left);
        const newH = Math.max(MIN_SIZE, bottom - top);
        const localCx = (left + right) / 2;
        const localCy = (top + bottom) / 2;
        const cos2 = Math.cos((origLayer.rotation * Math.PI) / 180);
        const sin2 = Math.sin((origLayer.rotation * Math.PI) / 180);
        const newX = origLayer.x + localCx * cos2 - localCy * sin2;
        const newY = origLayer.y + localCx * sin2 + localCy * cos2;

        updateLayer(origLayer.id, {
          x: newX,
          y: newY,
          width: newW,
          height: newH,
        });
      } else if (cur.kind === 'rotate') {
        const curLayers = layersRef.current;
        const sel = curLayers.find((l) => l.id === cur.layerId);
        if (!sel) return;
        const cdx = x - sel.x;
        const cdy = y - sel.y;
        const currentAngle = Math.atan2(cdy, cdx);
        const angleDelta = (currentAngle - cur.startAngle) * (180 / Math.PI);
        const newRotation = cur.startRotation + angleDelta;
        updateLayer(cur.layerId, { rotation: newRotation });
        setStatusRotation(Math.round(newRotation));
      }
    }

    function onMouseUp() {
      setIsDragging(false);
      const none: InteractionMode = { kind: 'none' };
      setInteraction(none);
      interactionRef.current = none;
    }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging, updateLayer, setStatusRotation]);

  const selectedLayer = layers.find((l) => l.id === selectedLayerId);

  return (
    <div className="canvas-wrapper">
      <div className="canvas-container">
        <canvas
          id="moodboard-canvas"
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onMouseDown={handleMouseDown}
          style={{ cursor: isDragging ? 'grabbing' : 'default' }}
        />
      </div>

      {selectedLayer && (
        <div className="layer-properties">
          <div className="prop-row">
            <label className="prop-label">混合模式</label>
            <select
              className="prop-select"
              value={selectedLayer.blendMode}
              onChange={(e) => {
                pushHistory();
                updateLayer(selectedLayer.id, {
                  blendMode: e.target.value as Layer['blendMode'],
                });
              }}
            >
              {BLEND_MODES.map((bm) => (
                <option key={bm.value} value={bm.value}>
                  {bm.description}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
