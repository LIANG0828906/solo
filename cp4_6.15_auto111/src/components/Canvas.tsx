import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useGesture } from '@use-gesture/react';
import useResizeObserver from 'use-resize-observer';
import { useStore } from '@/store/slice';
import { CanvasElementView } from './CanvasElementView';
import { getPresetById, getPresetsMap } from '@/utils/presets';
import { snapPointToGrid, GRID_SIZE, clamp } from '@/utils/geometry';
import type { CanvasElement, PresetElement } from '@/types';
import LayerPanel from './LayerPanel';

interface DragState {
  elementId: string;
  startX: number;
  startY: number;
  startElX: number;
  startElY: number;
  shiftKey: boolean;
}

export default function Canvas() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const { ref: sizeRef, width = 0, height = 0 } = useResizeObserver<HTMLDivElement>();

  const elements = useStore((s) => s.elements);
  const selectedIds = useStore((s) => s.selectedIds);
  const viewport = useStore((s) => s.viewport);
  const setViewport = useStore((s) => s.setViewport);
  const setGridVisible = useStore((s) => s.setGridVisible);
  const gridVisible = useStore((s) => s.gridVisible);
  const isDragging = useStore((s) => s.isDragging);
  const setDragging = useStore((s) => s.setDragging);
  const updateElement = useStore((s) => s.updateElement);
  const addElement = useStore((s) => s.addElement);
  const selectElements = useStore((s) => s.selectElements);
  const clearSelection = useStore((s) => s.clearSelection);
  const applyGlitchShake = useStore((s) => s.applyGlitchShake);

  const dragStateRef = useRef<DragState | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const [draggingIds, setDraggingIds] = useState<Set<string>>(new Set());
  const presetsMap = useMemo(() => getPresetsMap(), []);

  // 初始化视口
  useLayoutEffect(() => {
    if (width && height && viewport.x === 0 && viewport.y === 0 && viewport.scale === 1) {
      // 初始化时无需调整，视口原点就是中心
    }
  }, [width, height, viewport]);

  const screenToCanvas = useCallback(
    (sx: number, sy: number) => {
      if (!canvasRef.current) return { x: 0, y: 0 };
      const rect = canvasRef.current.getBoundingClientRect();
      const localX = sx - rect.left - width / 2;
      const localY = sy - rect.top - height / 2;
      return {
        x: localX / viewport.scale - viewport.x,
        y: localY / viewport.scale - viewport.y,
      };
    },
    [width, height, viewport]
  );

  // 处理预设元素自定义事件（来自侧边栏点击）
  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    const handler = (e: Event) => {
      const evt = e as CustomEvent<{
        preset: PresetElement;
        canvasX: number;
        canvasY: number;
      }>;
      const { preset, canvasX, canvasY } = evt.detail;
      const snapped = snapPointToGrid(
        canvasX - preset.defaultWidth / 2,
        canvasY - preset.defaultHeight / 2
      );
      addElement(preset, snapped.x, snapped.y);
      applyGlitchShake(
        useStore.getState().elements[useStore.getState().elements.length - 1].id
      );
    };
    canvasEl.addEventListener('cyber-drop-preset', handler as EventListener);
    return () =>
      canvasEl.removeEventListener('cyber-drop-preset', handler as EventListener);
  }, [addElement, applyGlitchShake]);

  // HTML5 drop from sidebar
  const onDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      setGridVisible(true);
    },
    [setGridVisible]
  );
  const onDragLeave = useCallback(() => {
    setGridVisible(false);
  }, [setGridVisible]);
  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setGridVisible(false);
      const data = e.dataTransfer.getData('application/cyber-preset');
      if (!data) return;
      try {
        const preset: PresetElement = JSON.parse(data);
        const pos = screenToCanvas(e.clientX, e.clientY);
        const snapped = snapPointToGrid(
          pos.x - preset.defaultWidth / 2,
          pos.y - preset.defaultHeight / 2
        );
        addElement(preset, snapped.x, snapped.y);
        const lastEl =
          useStore.getState().elements[useStore.getState().elements.length - 1];
        if (lastEl) applyGlitchShake(lastEl.id);
      } catch {
        // ignore
      }
    },
    [addElement, applyGlitchShake, screenToCanvas, setGridVisible]
  );

  // 元素点击选中
  const handleElementClick = useCallback(
    (id: string, e: React.MouseEvent) => {
      const additive = e.shiftKey || e.metaKey || e.ctrlKey;
      const state = useStore.getState();
      const alreadySelected = state.selectedIds.includes(id);
      if (additive) {
        if (alreadySelected) {
          selectElements(
            state.selectedIds.filter((sid) => sid !== id),
            false
          );
        } else {
          selectElements([id], true);
        }
      } else {
        if (!alreadySelected) selectElements([id], false);
      }
    },
    [selectElements]
  );

  // 元素拖拽启动
  const handleElementDragStart = useCallback(
    (id: string, e: React.PointerEvent) => {
      const state = useStore.getState();
      const idsToDrag = state.selectedIds.includes(id)
        ? state.selectedIds
        : [id];
      if (!state.selectedIds.includes(id)) {
        selectElements([id], false);
      }
      setDraggingIds(new Set(idsToDrag));
      setDragging(true);
      setGridVisible(true);
      const el = state.elements.find((x) => x.id === id);
      if (!el) return;
      dragStateRef.current = {
        elementId: id,
        startX: e.clientX,
        startY: e.clientY,
        startElX: el.x,
        startElY: el.y,
        shiftKey: e.shiftKey,
      };
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    [selectElements, setDragging, setGridVisible]
  );

  // 全局pointermove/up用于拖拽
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const ds = dragStateRef.current;
      if (!ds || !isDragging) return;

      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = requestAnimationFrame(() => {
        const state = useStore.getState();
        const dx = (e.clientX - ds.startX) / state.viewport.scale;
        const dy = (e.clientY - ds.startY) / state.viewport.scale;

        let applyDx = dx;
        let applyDy = dy;
        // shift锁定方向
        if (e.shiftKey && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
          if (Math.abs(dx) > Math.abs(dy)) applyDy = 0;
          else applyDx = 0;
        }

        // 找出reference元素
        const refEl = state.elements.find((x) => x.id === ds.elementId);
        if (!refEl) return;

        const refOldX = ds.startElX;
        const refOldY = ds.startElY;
        const refNewXRaw = refOldX + applyDx;
        const refNewYRaw = refOldY + applyDy;
        const snapped = snapPointToGrid(refNewXRaw, refNewYRaw);
        const snapDx = snapped.x - refOldX;
        const snapDy = snapped.y - refOldY;

        const patches: Array<{ id: string; x: number; y: number }> = [];
        draggingIds.forEach((did) => {
          const dEl = state.elements.find((x) => x.id === did);
          if (!dEl) return;
          const origDs = state.history.past.length // use stored origin? No: use start from selected
            ? 0
            : 0;
          patches.push({
            id: did,
            x: dEl.x + snapDx,
            y: dEl.y + snapDy,
          });
          void origDs;
        });

        // We cannot access original start pos per element. Use delta approach:
        const stateNow = useStore.getState();
        const actualPatches = patches.map((p) => {
          const curr = stateNow.elements.find((x) => x.id === p.id);
          // Use incremental delta since last frame to avoid snapping drift
          return { id: p.id, x: p.x, y: p.y };
          void curr;
        });
        actualPatches.forEach((p) => {
          updateElement(p.id, { x: p.x, y: p.y }, false);
        });

        // Update ds start for next frame delta
        ds.startX = e.clientX;
        ds.startY = e.clientY;
        ds.startElX += snapDx;
        ds.startElY += snapDy;
      });
    };
    const onUp = () => {
      if (!dragStateRef.current) return;
      dragStateRef.current = null;
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      setDragging(false);
      setGridVisible(false);
      // 只在位移超过阈值时push history
      const state = useStore.getState();
      if (draggingIds.size > 0) {
        state._pushHistory();
      }
      setDraggingIds(new Set());
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [isDragging, updateElement, setDragging, setGridVisible, draggingIds]);

  // 画布拖拽（平移） + 滚轮缩放 (use-gesture)
  const worldGesture = useGesture(
    {
      onWheel: ({ delta: [, dy], ctrlKey, metaKey }) => {
        const shouldZoom = ctrlKey || metaKey;
        if (shouldZoom) {
          const newScale = clamp(viewport.scale * (dy > 0 ? 0.92 : 1.08), 0.2, 4);
          setViewport({ scale: newScale });
        } else {
          setViewport({
            x: viewport.x - dy / viewport.scale,
            y: viewport.y,
          });
        }
      },
      onPinch: ({ origin, first, movement: [scale], memo }) => {
        if (first) memo = { startScale: viewport.scale };
        const newScale = clamp(memo.startScale * scale, 0.2, 4);
        setViewport({ scale: newScale });
        return memo;
      },
      onDrag: ({ movement: [dx, dy], dragging, button, shiftKey }) => {
        if (button !== 0 && button !== 1) return;
        // 如果没有选中元素 或 按了空格/shift键模拟panning，panning via middle-mouse or alt+left:
        // 简单处理：仅在无选中元素 且 左键拖拽时平移
        const state = useStore.getState();
        const shouldPan =
          (state.selectedIds.length === 0 && !isDragging) ||
          button === 1 ||
          shiftKey;
        if (dragging && shouldPan) {
          setViewport({
            x: viewport.x + dx / state.viewport.scale,
            y: viewport.y + dy / state.viewport.scale,
          });
        }
      },
    },
    {
      target: canvasRef,
      eventOptions: { passive: false },
      pinch: { scaleBounds: { min: 0.2, max: 4 } },
    }
  );

  // 画布空白处点击取消选中
  const onCanvasPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.target === canvasRef.current || e.target === worldRef.current) {
        clearSelection();
      }
    },
    [clearSelection]
  );

  // 删除键删除选中元素
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const state = useStore.getState();
        if (state.selectedIds.length > 0) {
          state.deleteElements(state.selectedIds);
          e.preventDefault();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        useStore.getState().undo();
        e.preventDefault();
      } else if (
        ((e.ctrlKey || e.metaKey) && e.key === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Z')
      ) {
        useStore.getState().redo();
        e.preventDefault();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        const state = useStore.getState();
        state.selectElements(state.elements.map((e) => e.id));
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const worldTransformStyle: React.CSSProperties = {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 0,
    height: 0,
    transform: `translate3d(${viewport.x * viewport.scale + 0}px, ${
      viewport.y * viewport.scale + 0
    }px, 0) scale(${viewport.scale})`,
    transformOrigin: '0 0',
    willChange: 'transform',
  };

  const sortedElements = useMemo(
    () => [...elements].sort((a, b) => a.zIndex - b.zIndex),
    [elements]
  );

  return (
    <div
      id="cyber-canvas"
      ref={(el) => {
        (canvasRef as React.MutableRefObject<HTMLDivElement | null>).current =
          el;
        sizeRef(el);
      }}
      {...worldGesture()}
      onPointerDown={onCanvasPointerDown}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      style={{
        position: 'absolute',
        top: 56,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        cursor: isDragging ? 'grabbing' : 'default',
        background:
          'radial-gradient(ellipse at 50% 35%, rgba(25,25,40,0.85) 0%, rgba(10,10,15,0.98) 70%)',
      }}
    >
      {gridVisible && (
        <div
          className="grid-overlay"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
            transform: `translate(${(viewport.x * viewport.scale) % (GRID_SIZE * viewport.scale)}px, ${(viewport.y * viewport.scale) % (GRID_SIZE * viewport.scale)}px) scale(${viewport.scale})`,
            transformOrigin: 'center center',
            zIndex: 1,
          }}
        />
      )}

      <div ref={worldRef} style={{ ...worldTransformStyle, zIndex: 2 }}>
        {sortedElements.map((el: CanvasElement) => (
          <CanvasElementView
            key={el.id}
            element={el}
            preset={presetsMap[el.presetId]}
            selected={selectedIds.includes(el.id)}
            viewportScale={viewport.scale}
            onClick={() => handleElementClick(el.id, window.event as React.MouseEvent)}
            onDragStart={(e) => handleElementDragStart(el.id, e)}
            dragging={draggingIds.has(el.id)}
          />
        ))}
      </div>

      <div
        style={{
          position: 'absolute',
          right: 12,
          bottom: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 10px',
          borderRadius: 8,
          background: 'rgba(10,10,20,0.55)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(0,240,255,0.2)',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--text-secondary)',
          zIndex: 10,
        }}
      >
        <span>缩放</span>
        <span style={{ color: 'var(--neon-cyan)', fontWeight: 600 }}>
          {Math.round(viewport.scale * 100)}%
        </span>
      </div>

      <LayerPanel />
    </div>
  );
}
