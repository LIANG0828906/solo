import { useEffect, useRef, useState, useCallback } from 'react';
import { Maximize, Minimize, RotateCcw } from 'lucide-react';
import { useMindMapStore } from '../store/mindMapStore';
import { MindMapNode, Position, ANIMATION_CONFIG, LAYOUT_CONFIG } from '../types';
import { flattenTree, findNodeById, countNodes } from '../utils/markdownParser';
import { isPointInNode, getNodeBounds } from '../utils/layout';
import {
  RenderContext,
  clearCanvas,
  renderConnections,
  renderNodes,
  renderTooltip,
  isTextTruncated,
} from '../utils/canvasRenderer';

const VIRTUALIZATION_THRESHOLD = 30;

interface MindMapProps {
  initialTree?: MindMapNode | null;
}

export default function MindMap({ initialTree }: MindMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  const parsedTree = useMindMapStore((state) => state.parsedTree);
  const totalNodes = useMindMapStore((state) => state.totalNodes);
  const toggleCollapse = useMindMapStore((state) => state.toggleCollapse);
  const updateNodePosition = useMindMapStore((state) => state.updateNodePosition);
  const resetPositions = useMindMapStore((state) => state.resetPositions);

  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tooltipInfo, setTooltipInfo] = useState<{
    visible: boolean;
    text: string;
    x: number;
    y: number;
  }>({ visible: false, text: '', x: 0, y: 0 });

  const dragOffsetRef = useRef<Position>({ x: 0, y: 0 });
  const collapseAnimationsRef = useRef<
    Map<string, { startTime: number; collapsing: boolean }>
  >(new Map());
  const layoutAnimationsRef = useRef<
    Map<string, { startTime: number; startPos: { x: number; y: number } }>
  >(new Map());
  const prevTreeRef = useRef<MindMapNode | null>(null);

  const canvasSizeRef = useRef({ width: 0, height: 0 });

  useEffect(() => {
    if (!parsedTree) return;
    if (!prevTreeRef.current) {
      prevTreeRef.current = parsedTree;
      return;
    }

    const prevNodes = new Map<string, Position>();
    const collectPrev = (node: MindMapNode) => {
      prevNodes.set(node.id, { ...node.position });
      node.children.forEach(collectPrev);
    };
    collectPrev(prevTreeRef.current);

    layoutAnimationsRef.current.clear();
    const now = performance.now();

    const collectNew = (node: MindMapNode) => {
      const prevPos = prevNodes.get(node.id);
      if (prevPos && (prevPos.x !== node.position.x || prevPos.y !== node.position.y)) {
        layoutAnimationsRef.current.set(node.id, {
          startTime: now,
          startPos: prevPos,
        });
      }
      node.children.forEach(collectNew);
    };
    collectNew(parsedTree);

    prevTreeRef.current = parsedTree;
  }, [parsedTree]);

  useEffect(() => {
    if (!parsedTree) return;

    const now = performance.now();
    const collectAnimations = (node: MindMapNode, prevCollapsedMap?: Map<string, boolean>) => {
      if (prevCollapsedMap && prevCollapsedMap.has(node.id)) {
        const wasCollapsed = prevCollapsedMap.get(node.id)!;
        if (wasCollapsed !== node.collapsed && node.parentId) {
          collapseAnimationsRef.current.set(node.id, {
            startTime: now,
            collapsing: node.collapsed,
          });
          node.children.forEach((child) => {
            collapseAnimationsRef.current.set(child.id, {
              startTime: now,
              collapsing: node.collapsed,
            });
          });
        }
      }
      node.children.forEach((child) => collectAnimations(child, prevCollapsedMap));
    };

    if (prevTreeRef.current) {
      const prevCollapsedMap = new Map<string, boolean>();
      const collectPrev = (node: MindMapNode) => {
        prevCollapsedMap.set(node.id, node.collapsed);
        node.children.forEach(collectPrev);
      };
      collectPrev(prevTreeRef.current);
      collectAnimations(parsedTree, prevCollapsedMap);
    }
  }, [parsedTree]);

  const getCanvasCenter = useCallback((): Position => {
    return {
      x: canvasSizeRef.current.width / 2,
      y: canvasSizeRef.current.height / 2,
    };
  }, []);

  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }

    canvasSizeRef.current = {
      width: rect.width,
      height: rect.height,
    };
  }, []);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvasSizeRef.current;
    const now = performance.now();

    const useVirtualization = totalNodes > VIRTUALIZATION_THRESHOLD;
    const viewport = { x: 0, y: 0, width, height };

    const renderContext: RenderContext = {
      ctx,
      canvasWidth: width,
      canvasHeight: height,
      hoveredNodeId,
      draggedNodeId,
      collapseAnimations: collapseAnimationsRef.current,
      layoutAnimations: layoutAnimationsRef.current,
      now,
      useVirtualization,
      viewport,
    };

    clearCanvas(ctx, width, height);

    if (parsedTree) {
      renderConnections(renderContext, parsedTree);
      renderNodes(renderContext, parsedTree);

      if (tooltipInfo.visible) {
        renderTooltip(ctx, tooltipInfo.text, tooltipInfo.x, tooltipInfo.y);
      }
    }

    const hasActiveAnimations =
      Array.from(layoutAnimationsRef.current.values()).some(
        (anim) => now - anim.startTime < ANIMATION_CONFIG.layoutDuration
      ) ||
      Array.from(collapseAnimationsRef.current.values()).some(
        (anim) => now - anim.startTime < ANIMATION_CONFIG.collapseTransition
      );

    if (hasActiveAnimations || draggedNodeId) {
      animationFrameRef.current = requestAnimationFrame(render);
    } else {
      animationFrameRef.current = null;
    }
  }, [parsedTree, hoveredNodeId, draggedNodeId, tooltipInfo, totalNodes]);

  useEffect(() => {
    if (!animationFrameRef.current) {
      animationFrameRef.current = requestAnimationFrame(render);
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [render]);

  const getCanvasCoords = useCallback((e: React.MouseEvent<HTMLCanvasElement>): Position => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!parsedTree) return;
      const point = getCanvasCoords(e);
      const allNodes = flattenTree(parsedTree);

      for (let i = allNodes.length - 1; i >= 0; i--) {
        const node = allNodes[i];
        if (node.level === 1) continue;
        const scale = draggedNodeId === node.id ? ANIMATION_CONFIG.dragScale : 1;
        if (isPointInNode(point, node, scale)) {
          setDraggedNodeId(node.id);
          dragOffsetRef.current = {
            x: point.x - node.position.x,
            y: point.y - node.position.y,
          };
          return;
        }
      }
    },
    [parsedTree, getCanvasCoords, draggedNodeId]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const point = getCanvasCoords(e);

      if (draggedNodeId) {
        const newPosition = {
          x: point.x - dragOffsetRef.current.x,
          y: point.y - dragOffsetRef.current.y,
        };
        updateNodePosition(draggedNodeId, newPosition);
        return;
      }

      if (!parsedTree) {
        if (hoveredNodeId) setHoveredNodeId(null);
        if (tooltipInfo.visible) setTooltipInfo({ ...tooltipInfo, visible: false });
        return;
      }

      const allNodes = flattenTree(parsedTree);
      let found: MindMapNode | null = null;

      for (let i = allNodes.length - 1; i >= 0; i--) {
        const node = allNodes[i];
        const scale = draggedNodeId === node.id ? ANIMATION_CONFIG.dragScale : 1;
        if (isPointInNode(point, node, scale)) {
          found = node;
          break;
        }
      }

      if (found) {
        if (hoveredNodeId !== found.id) {
          setHoveredNodeId(found.id);
        }
        if (isTextTruncated(found.text) || found.level >= 1) {
          const bounds = getNodeBounds(found);
          setTooltipInfo({
            visible: true,
            text: found.text,
            x: bounds.right,
            y: found.position.y,
          });
        } else {
          if (tooltipInfo.visible) {
            setTooltipInfo({ ...tooltipInfo, visible: false });
          }
        }
      } else {
        if (hoveredNodeId) setHoveredNodeId(null);
        if (tooltipInfo.visible) {
          setTooltipInfo({ ...tooltipInfo, visible: false });
        }
      }
    },
    [parsedTree, draggedNodeId, hoveredNodeId, tooltipInfo, getCanvasCoords, updateNodePosition]
  );

  const handleMouseUp = useCallback(() => {
    if (draggedNodeId) {
      setDraggedNodeId(null);
    }
  }, [draggedNodeId]);

  const handleMouseLeave = useCallback(() => {
    if (draggedNodeId) setDraggedNodeId(null);
    if (hoveredNodeId) setHoveredNodeId(null);
    if (tooltipInfo.visible) setTooltipInfo({ ...tooltipInfo, visible: false });
  }, [draggedNodeId, hoveredNodeId, tooltipInfo]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (draggedNodeId) return;
      if (!parsedTree) return;

      const point = getCanvasCoords(e);
      const allNodes = flattenTree(parsedTree);

      for (let i = allNodes.length - 1; i >= 0; i--) {
        const node = allNodes[i];
        const scale = draggedNodeId === node.id ? ANIMATION_CONFIG.dragScale : 1;
        if (isPointInNode(point, node, scale)) {
          if (node.children.length > 0) {
            toggleCollapse(node.id);
          }
          return;
        }
      }
    },
    [parsedTree, draggedNodeId, getCanvasCoords, toggleCollapse]
  );

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen?.().then(() => {
        setIsFullscreen(true);
        setTimeout(handleResize, 100);
      });
    } else {
      document.exitFullscreen?.().then(() => {
        setIsFullscreen(false);
        setTimeout(handleResize, 100);
      });
    }
  }, [handleResize]);

  const handleResetLayout = useCallback(() => {
    const center = getCanvasCenter();
    resetPositions(center);
  }, [getCanvasCenter, resetPositions]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      setTimeout(handleResize, 100);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [handleResize]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        backgroundColor: '#FAFAFA',
        overflow: 'hidden',
      }}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        style={{
          display: 'block',
          cursor: draggedNodeId ? 'grabbing' : hoveredNodeId ? 'pointer' : 'default',
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          display: 'flex',
          gap: 8,
          zIndex: 10,
        }}
      >
        <button
          onClick={handleResetLayout}
          title="重置布局"
          style={{
            width: 36,
            height: 36,
            borderRadius: 6,
            border: '1px solid #E0E0E0',
            backgroundColor: '#FFFFFF',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#F5F5F5';
            e.currentTarget.style.borderColor = '#CCCCCC';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#FFFFFF';
            e.currentTarget.style.borderColor = '#E0E0E0';
          }}
        >
          <RotateCcw size={16} color="#666666" />
        </button>

        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? '退出全屏' : '全屏显示'}
          style={{
            width: 36,
            height: 36,
            borderRadius: 6,
            border: '1px solid #E0E0E0',
            backgroundColor: '#FFFFFF',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#F5F5F5';
            e.currentTarget.style.borderColor = '#CCCCCC';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#FFFFFF';
            e.currentTarget.style.borderColor = '#E0E0E0';
          }}
        >
          {isFullscreen ? (
            <Minimize size={16} color="#666666" />
          ) : (
            <Maximize size={16} color="#666666" />
          )}
        </button>
      </div>

      {totalNodes > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            padding: '6px 12px',
            backgroundColor: 'rgba(255,255,255,0.9)',
            border: '1px solid #E0E0E0',
            borderRadius: 4,
            fontSize: 12,
            color: '#999999',
            zIndex: 10,
          }}
        >
          节点数: {totalNodes}
          {totalNodes > VIRTUALIZATION_THRESHOLD && ' (虚拟化渲染)'}
        </div>
      )}

      {!parsedTree && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: '#999999',
            pointerEvents: 'none',
          }}
        >
          <div style={{ fontSize: 14, marginBottom: 8 }}>暂无思维导图</div>
          <div style={{ fontSize: 12 }}>在左侧粘贴Markdown并点击生成按钮</div>
        </div>
      )}
    </div>
  );
}
