import { useState, useRef, useEffect, useCallback } from 'react';
import { MindMapNode } from '../shared/types';
import * as htmlToImage from 'html-to-image';

interface MindmapEditorProps {
  data: MindMapNode | null;
  onNodeDrag: (nodeId: string, x: number, y: number) => void;
  onNodeDragEnd: () => void;
  onNodeTextChange: (nodeId: string, text: string) => void;
  onNodeDelete: (nodeId: string) => void;
  isUndoRedoTransition?: boolean;
}

const GRID_SIZE = 20;
const GRID_COLOR = '#e0e0e0';
const MIN_SCALE = 0.5;
const MAX_SCALE = 3;
const SCALE_STEP = 0.1;

const LEVEL_COLORS: Record<number, string> = {
  0: '#ffffff',
  1: '#4A90D9',
  2: '#7B61FF',
  3: '#50C878',
};

function getLevelColor(level: number): string {
  return LEVEL_COLORS[level] || LEVEL_COLORS[3] || '#50C878';
}

function MindmapEditor({
  data,
  onNodeDrag,
  onNodeDragEnd,
  onNodeTextChange,
  onNodeDelete,
  isUndoRedoTransition,
}: MindmapEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const transformRef = useRef(transform);
  const [isDraggingNode, setIsDraggingNode] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, transformX: 0, transformY: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const initialCenterRef = useRef(false);

  useEffect(() => {
    transformRef.current = transform;
  }, [transform]);

  const centerCanvas = useCallback(() => {
    if (!containerRef.current || !data) return;

    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;

    const traverse = (node: MindMapNode) => {
      minX = Math.min(minX, node.x - 100);
      maxX = Math.max(maxX, node.x + 100);
      minY = Math.min(minY, node.y - 30);
      maxY = Math.max(maxY, node.y + 30);
      node.children.forEach(traverse);
    };
    traverse(data);

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    const scaleX = (containerWidth * 0.8) / contentWidth;
    const scaleY = (containerHeight * 0.8) / contentHeight;
    const scale = Math.min(scaleX, scaleY, 1.2);
    const clampedScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale));

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const x = containerWidth / 2 - centerX * clampedScale;
    const y = containerHeight / 2 - centerY * clampedScale;

    setTransform({ x, y, scale: clampedScale });
  }, [data]);

  useEffect(() => {
    if (data && !initialCenterRef.current) {
      initialCenterRef.current = true;
      setTimeout(() => centerCanvas(), 50);
    }
  }, [data, centerCanvas]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();

    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setTransform((prev) => {
      const delta = e.deltaY > 0 ? -SCALE_STEP : SCALE_STEP;
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev.scale + delta));

      const scaleRatio = newScale / prev.scale;
      const newX = mouseX - (mouseX - prev.x) * scaleRatio;
      const newY = mouseY - (mouseY - prev.y) * scaleRatio;

      return { x: newX, y: newY, scale: newScale };
    });
  }, []);

  const handleCanvasPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if ((e.target as HTMLElement).closest('.mindmap-node')) return;

      setIsPanning(true);
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        transformX: transform.x,
        transformY: transform.y,
      };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [transform]
  );

  const handleCanvasPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isPanning) return;

      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;

      setTransform((prev) => ({
        ...prev,
        x: panStartRef.current.transformX + dx,
        y: panStartRef.current.transformY + dy,
      }));
    },
    [isPanning]
  );

  const handleCanvasPointerUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleNodePointerDown = useCallback(
    (e: React.PointerEvent, node: MindMapNode) => {
      e.stopPropagation();
      setIsDraggingNode(true);

      const target = e.currentTarget as HTMLElement;
      target.setPointerCapture(e.pointerId);
      target.classList.add('dragging');

      let lastX = e.clientX;
      let lastY = e.clientY;
      let currentX = node.x;
      let currentY = node.y;

      const handleMove = (moveEvent: PointerEvent) => {
        const currentScale = transformRef.current.scale;
        const dx = (moveEvent.clientX - lastX) / currentScale;
        const dy = (moveEvent.clientY - lastY) / currentScale;

        lastX = moveEvent.clientX;
        lastY = moveEvent.clientY;

        currentX += dx;
        currentY += dy;

        onNodeDrag(node.id, currentX, currentY);
      };

      const handleUp = () => {
        target.classList.remove('dragging');
        setIsDraggingNode(false);
        onNodeDragEnd();
        target.removeEventListener('pointermove', handleMove);
        target.removeEventListener('pointerup', handleUp);
        target.removeEventListener('pointercancel', handleUp);
      };

      target.addEventListener('pointermove', handleMove);
      target.addEventListener('pointerup', handleUp);
      target.addEventListener('pointercancel', handleUp);
    },
    [onNodeDrag, onNodeDragEnd]
  );

  const handleNodeDoubleClick = useCallback(
    (e: React.MouseEvent, node: MindMapNode) => {
      e.stopPropagation();
      const target = e.currentTarget.querySelector('.node-text') as HTMLElement;
      if (!target) return;

      target.contentEditable = 'true';
      target.focus();

      const range = document.createRange();
      range.selectNodeContents(target);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);

      const handleBlur = () => {
        target.contentEditable = 'false';
        const newText = target.textContent || '';
        if (newText.trim() && newText !== node.text) {
          onNodeTextChange(node.id, newText);
        } else {
          target.textContent = node.text;
        }
        target.removeEventListener('blur', handleBlur);
      };

      target.addEventListener('blur', handleBlur);
    },
    [onNodeTextChange]
  );

  const handleDeleteNode = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      e.stopPropagation();
      onNodeDelete(nodeId);
    },
    [onNodeDelete]
  );

  const renderConnections = useCallback(
    (node: MindMapNode, elements: JSX.Element[] = []): JSX.Element[] => {
      node.children.forEach((child) => {
        const startX = node.x;
        const startY = node.y;
        const endX = child.x;
        const endY = child.y;

        const controlOffset = Math.abs(endX - startX) * 0.5;
        const path = `M ${startX} ${startY} C ${startX + controlOffset} ${startY}, ${endX - controlOffset} ${endY}, ${endX} ${endY}`;

        const strokeColor = getLevelColor(child.level);

        elements.push(
          <path
            key={`conn-${node.id}-${child.id}`}
            d={path}
            stroke={strokeColor}
            strokeWidth={2}
            fill="none"
            opacity={0.6}
          />
        );

        renderConnections(child, elements);
      });
      return elements;
    },
    []
  );

  const renderNodes = useCallback(
    (node: MindMapNode): JSX.Element[] => {
      const elements: JSX.Element[] = [];
      const levelClass = node.level === 0 ? 'root-node' : `level-${Math.min(node.level, 3)}`;
      const bgColor = getLevelColor(node.level);
      const isRoot = node.level === 0;

      elements.push(
        <div
          key={node.id}
          className={`mindmap-node ${levelClass}`}
          style={{
            left: node.x,
            top: node.y,
            backgroundColor: bgColor,
            borderColor: isRoot ? '#4A90D9' : 'transparent',
            color: isRoot ? '#333' : 'white',
          }}
          onPointerDown={(e) => handleNodePointerDown(e, node)}
          onDoubleClick={(e) => handleNodeDoubleClick(e, node)}
        >
          <span className="node-text">{node.text}</span>
          {node.level !== 0 && (
            <button
              className="node-delete-btn"
              onClick={(e) => handleDeleteNode(e, node.id)}
              title="删除节点"
            >
              ×
            </button>
          )}
        </div>
      );

      node.children.forEach((child) => {
        elements.push(...renderNodes(child));
      });

      return elements;
    },
    [handleNodePointerDown, handleNodeDoubleClick, handleDeleteNode]
  );

  const generateGrid = useCallback(() => {
    if (!containerRef.current || !showGrid) return null;

    const { clientWidth, clientHeight } = containerRef.current;
    const cols = Math.ceil(clientWidth / GRID_SIZE) + 1;
    const rows = Math.ceil(clientHeight / GRID_SIZE) + 1;

    const lines: JSX.Element[] = [];

    for (let i = 0; i < cols; i++) {
      lines.push(
        <line
          key={`v-${i}`}
          x1={i * GRID_SIZE}
          y1={0}
          x2={i * GRID_SIZE}
          y2={clientHeight}
          stroke={GRID_COLOR}
          strokeWidth={0.5}
        />
      );
    }

    for (let i = 0; i < rows; i++) {
      lines.push(
        <line
          key={`h-${i}`}
          x1={0}
          y1={i * GRID_SIZE}
          x2={clientWidth}
          y2={i * GRID_SIZE}
          stroke={GRID_COLOR}
          strokeWidth={0.5}
        />
      );
    }

    return (
      <svg className="canvas-grid" style={{ width: clientWidth, height: clientHeight }}>
        {lines}
      </svg>
    );
  }, [showGrid]);

  useEffect(() => {
    const handleExportEvent = async () => {
      if (!containerRef.current || !canvasRef.current || !data) return;

      try {
        setShowGrid(false);

        await new Promise((resolve) => setTimeout(resolve, 100));

        const container = containerRef.current;
        const savedTransform = { ...transformRef.current };

        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        const traverse = (node: MindMapNode) => {
          minX = Math.min(minX, node.x - 120);
          maxX = Math.max(maxX, node.x + 120);
          minY = Math.min(minY, node.y - 40);
          maxY = Math.max(maxY, node.y + 40);
          node.children.forEach(traverse);
        };
        traverse(data);

        const contentWidth = maxX - minX;
        const contentHeight = maxY - minY;
        const padding = 40;

        const canvasEl = canvasRef.current;
        const savedStyle = canvasEl.style.cssText;

        canvasEl.style.transform = 'none';
        canvasEl.style.left = `${-minX + padding}px`;
        canvasEl.style.top = `${-minY + padding}px`;
        canvasEl.style.width = `${contentWidth + padding * 2}px`;
        canvasEl.style.height = `${contentHeight + padding * 2}px`;
        canvasEl.style.transition = 'none';

        const wrapperEl = container;
        const savedWrapperStyle = wrapperEl.style.cssText;
        wrapperEl.style.width = `${contentWidth + padding * 2}px`;
        wrapperEl.style.height = `${contentHeight + padding * 2}px`;
        wrapperEl.style.overflow = 'visible';

        await new Promise((resolve) => setTimeout(resolve, 100));

        const dataUrl = await htmlToImage.toPng(canvasEl, {
          backgroundColor: '#ffffff',
          pixelRatio: 2,
          cacheBust: true,
        });

        canvasEl.style.cssText = savedStyle;
        wrapperEl.style.cssText = savedWrapperStyle;
        setShowGrid(true);

        const link = document.createElement('a');
        link.download = `mindmap-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
      } catch (error) {
        console.error('Export failed:', error);
        setShowGrid(true);
      }
    };

    window.addEventListener('export-mindmap', handleExportEvent);
    return () => window.removeEventListener('export-mindmap', handleExportEvent);
  }, [data]);

  return (
    <div className="mindmap-canvas-wrapper">
      <div
        ref={containerRef}
        className="mindmap-canvas"
        onWheel={handleWheel}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={handleCanvasPointerUp}
        onPointerLeave={handleCanvasPointerUp}
      >
        {generateGrid()}

        {data ? (
          <div
            ref={canvasRef}
            className={`canvas-content ${isPanning || isDraggingNode ? 'no-transition' : ''} ${isUndoRedoTransition ? 'undo-redo-transition' : ''}`}
            style={{
              transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            }}
          >
            <svg className="connections-svg">{renderConnections(data)}</svg>
            {renderNodes(data)}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">🧠</div>
            <div className="empty-state-text">在上方输入描述，点击生成按钮创建思维导图</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MindmapEditor;
