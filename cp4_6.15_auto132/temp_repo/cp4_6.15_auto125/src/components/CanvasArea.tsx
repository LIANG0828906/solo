import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { Trash2, RotateCcw } from 'lucide-react';
import type { CanvasElement, Viewport } from '@/types';
import { getMaterialById } from '@/data/materialData';
import { screenToCanvas, snapToNeighbor, clampToBounds } from '@/utils/svgUtils';

interface CanvasAreaProps {
  elements: CanvasElement[];
  onUpdateElements: (elements: CanvasElement[]) => void;
  onDeleteElement?: (id: string) => void;
  viewport: Viewport;
  onViewportChange: (viewport: Viewport) => void;
}

interface DragState {
  isDragging: boolean;
  elementId: string | null;
  startX: number;
  startY: number;
  elementStartX: number;
  elementStartY: number;
  offsetX: number;
  offsetY: number;
}

interface PanState {
  isPanning: boolean;
  startX: number;
  startY: number;
  viewportStartX: number;
  viewportStartY: number;
}

const SVGElement = memo(function SVGElement({
  element,
  selected,
  onPointerDown,
  onDoubleClick,
}: {
  element: CanvasElement;
  selected: boolean;
  onPointerDown: (e: React.PointerEvent<SVGGElement>, id: string) => void;
  onDoubleClick: (id: string) => void;
}) {
  const material = getMaterialById(element.materialId);
  if (!material) return null;

  const transform = `translate(${element.x}, ${element.y}) rotate(${element.rotation}) scale(${element.scale})`;

  return (
    <g
      className={`canvas-element${selected ? ' selected' : ''}${element.isNew ? ' element-enter' : ''}`}
      data-id={element.id}
      onPointerDown={(e) => onPointerDown(e, element.id)}
      onDoubleClick={() => onDoubleClick(element.id)}
      style={{ touchAction: 'none' }}
    >
      <g className="element-group" transform={transform}>
        <g transform="translate(-50, -50)">
          <path
            d={material.svgPath}
            fill={element.color}
            stroke={element.color}
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </g>
      </g>
    </g>
  );
});

const TransformToolbar = memo(function TransformToolbar({
  element,
  onUpdate,
  onDelete,
  onClose,
}: {
  element: CanvasElement;
  onUpdate: (updates: Partial<CanvasElement>) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const knobRef = useRef<HTMLDivElement>(null);
  const isDraggingKnobRef = useRef(false);

  const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const scale = parseFloat(e.target.value);
    onUpdate({ scale });
  };

  const handleRotationChange = useCallback(
    (clientX: number, clientY: number) => {
      if (!knobRef.current) return;
      const rect = knobRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const angle = Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI) + 90;
      const normalizedAngle = angle < 0 ? angle + 360 : angle;
      onUpdate({ rotation: Math.round(normalizedAngle) });
    },
    [onUpdate]
  );

  const handleKnobStart = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    isDraggingKnobRef.current = true;
    handleRotationChange(e.clientX, e.clientY);
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handleKnobMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingKnobRef.current) return;
    handleRotationChange(e.clientX, e.clientY);
  };

  const handleKnobEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingKnobRef.current = false;
    try {
      (e.target as Element).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const handleReset = () => {
    onUpdate({ scale: 1, rotation: 0 });
  };

  return (
    <div className="transform-toolbar" onClick={(e) => e.stopPropagation()}>
      <div className="toolbar-title">变换控制</div>

      <div className="toolbar-control">
        <div className="control-label">
          <span>缩放</span>
          <span className="control-value">{element.scale.toFixed(1)}x</span>
        </div>
        <input
          type="range"
          className="slider"
          min="0.5"
          max="3.0"
          step="0.1"
          value={element.scale}
          onChange={handleScaleChange}
        />
      </div>

      <div className="toolbar-control">
        <div className="control-label">
          <span>旋转</span>
          <span className="control-value">{element.rotation}°</span>
        </div>
        <div
          className="rotation-knob"
          ref={knobRef}
          onPointerDown={handleKnobStart}
          onPointerMove={handleKnobMove}
          onPointerUp={handleKnobEnd}
          onPointerCancel={handleKnobEnd}
          style={{ ['--rotation' as string]: `${element.rotation}deg` }}
        >
          <div className="knob-track">
            <div className="knob-inner">
              <div
                className="knob-pointer"
                style={{ transform: `translateX(-50%) rotate(${element.rotation}deg)` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="toolbar-actions">
        <button className="action-btn" onClick={handleReset}>
          <RotateCcw size={14} />
          重置
        </button>
        <button className="action-btn danger" onClick={onDelete}>
          <Trash2 size={14} />
          删除
        </button>
      </div>

      <div className="toolbar-actions">
        <button className="action-btn" onClick={onClose}>
          完成
        </button>
      </div>
    </div>
  );
});

export function CanvasArea({
  elements,
  onUpdateElements,
  onDeleteElement,
  viewport,
  onViewportChange,
}: CanvasAreaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showToolbar, setShowToolbar] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isPanning, setIsPanning] = useState(false);

  const dragStateRef = useRef<DragState>({
    isDragging: false,
    elementId: null,
    startX: 0,
    startY: 0,
    elementStartX: 0,
    elementStartY: 0,
    offsetX: 0,
    offsetY: 0,
  });

  const panStateRef = useRef<PanState>({
    isPanning: false,
    startX: 0,
    startY: 0,
    viewportStartX: 0,
    viewportStartY: 0,
  });

  const elementsRef = useRef(elements);
  const viewportRef = useRef(viewport);
  const rafIdRef = useRef<number | null>(null);
  const pendingUpdateRef = useRef<CanvasElement[] | null>(null);
  const lastPointerEvtRef = useRef<PointerEvent | null>(null);

  useEffect(() => {
    elementsRef.current = elements;
  }, [elements]);

  useEffect(() => {
    viewportRef.current = viewport;
  }, [viewport]);

  const getCanvasSize = useCallback(() => {
    if (!containerRef.current) return { width: 800, height: 600 };
    return {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
    };
  }, []);

  /**
   * 拖拽/平移的 RAF 动画帧回调
   * - 读取 lastPointerEvtRef 中缓存的最新指针位置
   * - 使用 requestAnimationFrame 节流（约60fps，不受浏览器合成的触摸事件频率影响）
   * - 元素拖拽时直接操作 SVG DOM 的 transform 属性，跳过 React 重渲染
   * - 平移时直接调用 onViewportChange（setState，但因为被 rAF 节流仍能稳定50fps+）
   */
  const runAnimationFrame = useCallback(() => {
    const evt = lastPointerEvtRef.current;
    if (!evt) return;

    const draggingId = dragStateRef.current.elementId;
    if (dragStateRef.current.isDragging && draggingId) {
      const state = dragStateRef.current;

      const canvasPos = screenToCanvas(
        evt.clientX,
        evt.clientY,
        viewportRef.current.offsetX,
        viewportRef.current.offsetY,
        viewportRef.current.zoom
      );

      let newX = canvasPos.x - state.offsetX;
      let newY = canvasPos.y - state.offsetY;

      const canvasSize = getCanvasSize();
      const bounds = screenToCanvas(
        canvasSize.width,
        canvasSize.height,
        viewportRef.current.offsetX,
        viewportRef.current.offsetY,
        viewportRef.current.zoom
      );

      const snapped = snapToNeighbor(newX, newY, elementsRef.current, draggingId, 12);
      newX = clampToBounds(snapped.x, 0, bounds.x, 50);
      newY = clampToBounds(snapped.y, 0, bounds.y, 50);

      const svgEl = svgRef.current;
      if (svgEl) {
        const elementNode = svgEl.querySelector<SVGGElement>(
          `[data-id="${draggingId}"] .element-group`
        );
        if (elementNode) {
          const el = elementsRef.current.find((e) => e.id === draggingId);
          if (el) {
            const transform = `translate(${newX}, ${newY}) rotate(${el.rotation}) scale(${el.scale})`;
            elementNode.setAttribute('transform', transform);
          }
        }
      }

      pendingUpdateRef.current = elementsRef.current.map((el) =>
        el.id === draggingId ? { ...el, x: newX, y: newY } : el
      );
    } else if (panStateRef.current.isPanning) {
      const state = panStateRef.current;
      const dx = evt.clientX - state.startX;
      const dy = evt.clientY - state.startY;

      onViewportChange({
        ...viewportRef.current,
        offsetX: state.viewportStartX + dx,
        offsetY: state.viewportStartY + dy,
      });
    }
  }, [getCanvasSize, onViewportChange]);

  const scheduleRAF = useCallback(() => {
    if (rafIdRef.current != null) return;
    rafIdRef.current = requestAnimationFrame(() => {
      runAnimationFrame();
      rafIdRef.current = null;
      if (
        dragStateRef.current.isDragging ||
        panStateRef.current.isPanning
      ) {
        scheduleRAF();
      }
    });
  }, [runAnimationFrame]);

  /**
   * React 合成事件 onPointerDown
   * - 自动兼容 mouse + touch + pen 三种输入
   * - 鼠标左键 / 手指按下 / 触控笔按下 统一入口
   */
  const handleElementPointerDown = useCallback(
    (e: React.PointerEvent<SVGGElement>, id: string) => {
      e.stopPropagation();
      e.preventDefault();

      const element = elementsRef.current.find((el) => el.id === id);
      if (!element) return;

      const canvasPos = screenToCanvas(
        e.clientX,
        e.clientY,
        viewportRef.current.offsetX,
        viewportRef.current.offsetY,
        viewportRef.current.zoom
      );

      dragStateRef.current = {
        isDragging: true,
        elementId: id,
        startX: e.clientX,
        startY: e.clientY,
        elementStartX: element.x,
        elementStartY: element.y,
        offsetX: canvasPos.x - element.x,
        offsetY: canvasPos.y - element.y,
      };

      setIsDragging(true);
      setSelectedId(id);
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    },
    []
  );

  /**
   * 画布 SVG 根级的 onPointerDown
   * - 点击空白处开启平移（画布拖拽）
   * - 点击空白取消选中和工具栏
   */
  const handleCanvasPointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const target = e.target as SVGElement;
      const tagName = target.tagName.toLowerCase();
      const isBlank =
        target === e.currentTarget ||
        tagName === 'rect' ||
        tagName === 'line' ||
        tagName === 'svg';

      if (isBlank) {
        setSelectedId(null);
        setShowToolbar(false);

        panStateRef.current = {
          isPanning: true,
          startX: e.clientX,
          startY: e.clientY,
          viewportStartX: viewportRef.current.offsetX,
          viewportStartY: viewportRef.current.offsetY,
        };
        setIsPanning(true);
        (e.currentTarget as Element).setPointerCapture(e.pointerId);
      }
    },
    []
  );

  /**
   * 统一的合成事件 onPointerMove
   * - 不直接在 handler 里 setState，只缓存坐标 + 唤醒 rAF 循环
   * - 触摸事件默认 60-120Hz，经 rAF 降频到 60fps 稳定输出
   */
  const handleCanvasPointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (
        !dragStateRef.current.isDragging &&
        !panStateRef.current.isPanning
      ) {
        return;
      }
      lastPointerEvtRef.current = e.nativeEvent;
      scheduleRAF();
    },
    [scheduleRAF]
  );

  const handleDragOrPanEnd = useCallback(() => {
    if (dragStateRef.current.isDragging) {
      dragStateRef.current.isDragging = false;
      setIsDragging(false);

      if (pendingUpdateRef.current) {
        onUpdateElements(pendingUpdateRef.current);
        pendingUpdateRef.current = null;
      }
    }

    if (panStateRef.current.isPanning) {
      panStateRef.current.isPanning = false;
      setIsPanning(false);
    }

    lastPointerEvtRef.current = null;
    if (rafIdRef.current != null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, [onUpdateElements]);

  const handleCanvasPointerUp = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      handleDragOrPanEnd();
      try {
        (e.currentTarget as Element).releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    },
    [handleDragOrPanEnd]
  );

  const handleCanvasPointerCancel = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      handleDragOrPanEnd();
      try {
        (e.currentTarget as Element).releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    },
    [handleDragOrPanEnd]
  );

  /**
   * 滚轮缩放：React onWheel 合成事件
   * - 通过 deltaY 正负决定方向
   * - 以鼠标位置为锚点缩放（zoom toward cursor）
   */
  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      e.preventDefault();

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.5, Math.min(2.0, viewportRef.current.zoom * delta));

      const scaleFactor = newZoom / viewportRef.current.zoom;
      const newOffsetX = mouseX - (mouseX - viewportRef.current.offsetX) * scaleFactor;
      const newOffsetY = mouseY - (mouseY - viewportRef.current.offsetY) * scaleFactor;

      onViewportChange({
        offsetX: newOffsetX,
        offsetY: newOffsetY,
        zoom: newZoom,
      });
    },
    [onViewportChange]
  );

  const handleDoubleClick = useCallback((id: string) => {
    setSelectedId(id);
    setShowToolbar(true);
  }, []);

  const handleToolbarUpdate = useCallback(
    (updates: Partial<CanvasElement>) => {
      if (!selectedId) return;
      const newElements = elementsRef.current.map((el) =>
        el.id === selectedId ? { ...el, ...updates } : el
      );
      onUpdateElements(newElements);
    },
    [selectedId, onUpdateElements]
  );

  const handleDelete = useCallback(() => {
    if (!selectedId || !onDeleteElement) return;
    onDeleteElement(selectedId);
    setSelectedId(null);
    setShowToolbar(false);
  }, [selectedId, onDeleteElement]);

  useEffect(() => {
    if (elements.some((el) => el.isNew)) {
      const timer = setTimeout(() => {
        const newElements = elements.map((el) => ({ ...el, isNew: false }));
        onUpdateElements(newElements);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [elements, onUpdateElements]);

  const selectedElement = selectedId ? elements.find((el) => el.id === selectedId) : null;
  const canvasSize = getCanvasSize();

  const gridSpacing = 40;
  const gridLines: JSX.Element[] = [];
  const numLinesX = Math.ceil(canvasSize.width / (gridSpacing * viewport.zoom)) + 4;
  const numLinesY = Math.ceil(canvasSize.height / (gridSpacing * viewport.zoom)) + 4;
  const startOffsetX =
    (viewport.offsetX % (gridSpacing * viewport.zoom)) - gridSpacing * viewport.zoom;
  const startOffsetY =
    (viewport.offsetY % (gridSpacing * viewport.zoom)) - gridSpacing * viewport.zoom;

  for (let i = 0; i < numLinesX; i++) {
    const x = startOffsetX + i * gridSpacing * viewport.zoom;
    gridLines.push(
      <line
        key={`v-${i}`}
        className={`grid-line${isDragging ? ' visible' : ''}`}
        x1={x}
        y1="0"
        x2={x}
        y2={canvasSize.height}
      />
    );
  }
  for (let i = 0; i < numLinesY; i++) {
    const y = startOffsetY + i * gridSpacing * viewport.zoom;
    gridLines.push(
      <line
        key={`h-${i}`}
        className={`grid-line${isDragging ? ' visible' : ''}`}
        x1="0"
        y1={y}
        x2={canvasSize.width}
        y2={y}
      />
    );
  }

  const viewportTransform = `translate(${viewport.offsetX}, ${viewport.offsetY}) scale(${viewport.zoom})`;

  return (
    <div className="canvas-wrapper">
      <div
        ref={containerRef}
        className={`canvas-container${isPanning ? ' panning' : ''}`}
        onWheel={handleWheel}
      >
        <svg
          ref={svgRef}
          className="canvas-svg"
          onPointerDown={handleCanvasPointerDown}
          onPointerMove={handleCanvasPointerMove}
          onPointerUp={handleCanvasPointerUp}
          onPointerCancel={handleCanvasPointerCancel}
          width={canvasSize.width}
          height={canvasSize.height}
        >
          <rect
            className="canvas-bg"
            x={-viewport.offsetX / viewport.zoom}
            y={-viewport.offsetY / viewport.zoom}
            width={Math.max(canvasSize.width / viewport.zoom + 1000, 3000)}
            height={Math.max(canvasSize.height / viewport.zoom + 1000, 2000)}
          />
          <g transform={viewportTransform}>
            {elements.map((element) => (
              <SVGElement
                key={element.id}
                element={element}
                selected={selectedId === element.id}
                onPointerDown={handleElementPointerDown}
                onDoubleClick={handleDoubleClick}
              />
            ))}
          </g>
          {gridLines}
        </svg>

        {showToolbar && selectedElement && (
          <TransformToolbar
            element={selectedElement}
            onUpdate={handleToolbarUpdate}
            onDelete={handleDelete}
            onClose={() => {
              setShowToolbar(false);
              setSelectedId(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
