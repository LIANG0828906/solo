import React, {
  useRef,
  useEffect,
  useCallback,
  useMemo,
  useState,
} from 'react';
import { useBoardStore } from '@/store/boardStore';
import { ideaService } from '@/services/ideaService';
import { IdeaNode } from './IdeaNode';
import { ConnectionLayer } from './ConnectionLayer';
import { clamp, screenToWorld } from '@/shared/utils';

const GRID_SIZE = 40;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2;
const TOOLBAR_HEIGHT = 56;

export const Board: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const {
    nodes,
    connections,
    zoom,
    pan,
    selectedNodeId,
    isDraggingCanvas,
    dragStart,
    draggingNodeId,
    dragOffset,
    isCreatingConnection,
    tempConnection,
    showDeleteConfirm,
    deleteNodeId,
    showNodeList,
    showNodePanel,
    setZoom,
    setPan,
    selectNode,
    setIsDraggingCanvas,
    setDragStart,
    setDraggingNodeId,
    setTempConnection,
    setIsCreatingConnection,
    setShowNodePanel,
    setPanelPosition,
    setPanelNodeId,
    setShowDeleteConfirm,
    setDeleteNodeId,
    updateNode,
  } = useBoardStore();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    ideaService.initializeData();
  }, []);

  const getCanvasPoint = useCallback(
    (e: MouseEvent | React.MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    },
    []
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      if (showNodePanel) return;

      const canvasPoint = getCanvasPoint(e);
      const worldPoint = screenToWorld(canvasPoint.x, canvasPoint.y, pan, zoom);

      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newZoom = clamp(zoom + delta, MIN_ZOOM, MAX_ZOOM);

      const newPanX = canvasPoint.x - worldPoint.x * newZoom;
      const newPanY = canvasPoint.y - worldPoint.y * newZoom;

      setZoom(newZoom);
      setPan({ x: newPanX, y: newPanY });
    },
    [zoom, pan, showNodePanel, getCanvasPoint, setZoom, setPan]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      if (isCreatingConnection || showNodePanel) return;

      const target = e.target as HTMLElement;
      if (
        target.closest('.idea-node') ||
        target.closest('.connection-handle') ||
        target.closest('.node-panel') ||
        target.closest('.node-list-panel') ||
        target.closest('.toolbar')
      ) {
        return;
      }

      const canvasPoint = getCanvasPoint(e);
      setIsDraggingCanvas(true);
      setDragStart({ x: canvasPoint.x - pan.x, y: canvasPoint.y - pan.y });
      selectNode(null);
    },
    [
      isCreatingConnection,
      showNodePanel,
      pan,
      getCanvasPoint,
      setIsDraggingCanvas,
      setDragStart,
      selectNode,
    ]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const canvasPoint = getCanvasPoint(e);
      const worldPoint = screenToWorld(canvasPoint.x, canvasPoint.y, pan, zoom);

      if (isDraggingCanvas && dragStart) {
        const newPanX = canvasPoint.x - dragStart.x;
        const newPanY = canvasPoint.y - dragStart.y;

        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }

        animationFrameRef.current = requestAnimationFrame(() => {
          setPan({ x: newPanX, y: newPanY });
        });
      }

      if (draggingNodeId) {
        const newX = worldPoint.x - dragOffset.x;
        const newY = worldPoint.y - dragOffset.y;

        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }

        animationFrameRef.current = requestAnimationFrame(() => {
          updateNode(draggingNodeId, { x: newX, y: newY });
        });
      }

      if (isCreatingConnection && tempConnection) {
        setTempConnection({
          ...tempConnection,
          endX: worldPoint.x,
          endY: worldPoint.y,
        });
      }
    },
    [
      isDraggingCanvas,
      dragStart,
      draggingNodeId,
      dragOffset,
      isCreatingConnection,
      tempConnection,
      pan,
      zoom,
      getCanvasPoint,
      setPan,
      updateNode,
      setTempConnection,
    ]
  );

  const handleMouseUp = useCallback(
    async (e: React.MouseEvent) => {
      if (isDraggingCanvas) {
        setIsDraggingCanvas(false);
        setDragStart(null);
      }

      if (draggingNodeId) {
        const node = nodes.find((n) => n.id === draggingNodeId);
        if (node) {
          await ideaService.updateNode({
            id: draggingNodeId,
            x: node.x,
            y: node.y,
          });
        }
        setDraggingNodeId(null);
      }

      if (isCreatingConnection && tempConnection) {
        const target = e.target as HTMLElement;
        const nodeContainer = target.closest('[data-node-id]');
        if (nodeContainer) {
          const nodeId = nodeContainer.getAttribute('data-node-id');
          if (nodeId && nodeId !== tempConnection.fromId) {
            try {
              await ideaService.createConnection(
                tempConnection.fromId,
                nodeId
              );
            } catch (err) {
              console.error('Failed to create connection:', err);
            }
          }
        }
        setIsCreatingConnection(false);
        setTempConnection(null);
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    },
    [
      isDraggingCanvas,
      draggingNodeId,
      isCreatingConnection,
      tempConnection,
      nodes,
      setIsDraggingCanvas,
      setDragStart,
      setDraggingNodeId,
      setIsCreatingConnection,
      setTempConnection,
    ]
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (showNodePanel) return;

      const target = e.target as HTMLElement;
      if (
        target.closest('.idea-node') ||
        target.closest('.connection-handle') ||
        target.closest('.node-panel') ||
        target.closest('.node-list-panel') ||
        target.closest('.toolbar')
      ) {
        return;
      }

      const canvasPoint = getCanvasPoint(e);
      setPanelPosition({ x: e.clientX, y: e.clientY });
      setPanelNodeId(null);
      setShowNodePanel(true);
    },
    [
      showNodePanel,
      getCanvasPoint,
      setPanelPosition,
      setPanelNodeId,
      setShowNodePanel,
    ]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (
          selectedNodeId &&
          !showNodePanel &&
          !showDeleteConfirm &&
          !(e.target instanceof HTMLInputElement) &&
          !(e.target instanceof HTMLTextAreaElement)
        ) {
          setDeleteNodeId(selectedNodeId);
          setShowDeleteConfirm(true);
        }
      }
      if (e.key === 'Escape') {
        if (showNodePanel) {
          setShowNodePanel(false);
          setPanelNodeId(null);
        }
        if (isCreatingConnection) {
          setIsCreatingConnection(false);
          setTempConnection(null);
        }
        if (showDeleteConfirm) {
          setShowDeleteConfirm(false);
          setDeleteNodeId(null);
        }
      }
    },
    [
      selectedNodeId,
      showNodePanel,
      showDeleteConfirm,
      isCreatingConnection,
      setDeleteNodeId,
      setShowDeleteConfirm,
      setShowNodePanel,
      setPanelNodeId,
      setIsCreatingConnection,
      setTempConnection,
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (deleteNodeId) {
      await ideaService.deleteNode(deleteNodeId);
      setShowDeleteConfirm(false);
      setDeleteNodeId(null);
      selectNode(null);
    }
  }, [deleteNodeId, setShowDeleteConfirm, setDeleteNodeId, selectNode]);

  const handleCancelDelete = useCallback(() => {
    setShowDeleteConfirm(false);
    setDeleteNodeId(null);
  }, [setShowDeleteConfirm, setDeleteNodeId]);

  const gridLines = useMemo(() => {
    if (!canvasRef.current) return null;
    const width = canvasRef.current.clientWidth;
    const height = canvasRef.current.clientHeight;
    const lines: JSX.Element[] = [];

    const startX = -pan.x % (GRID_SIZE * zoom);
    const startY = -pan.y % (GRID_SIZE * zoom);

    for (let x = startX; x < width; x += GRID_SIZE * zoom) {
      lines.push(
        <line
          key={`v-${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={height}
          stroke="#2A2A44"
          strokeWidth="1"
        />
      );
    }
    for (let y = startY; y < height; y += GRID_SIZE * zoom) {
      lines.push(
        <line
          key={`h-${y}`}
          x1={0}
          y1={y}
          x2={width}
          y2={y}
          stroke="#2A2A44"
          strokeWidth="1"
        />
      );
    }

    return lines;
  }, [pan, zoom]);

  const canvasStyle: React.CSSProperties = useMemo(
    () => ({
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: '#1A1A2E',
      overflow: 'hidden',
      cursor: isDraggingCanvas ? 'grabbing' : isCreatingConnection ? 'crosshair' : 'grab',
      userSelect: 'none',
    }),
    [isDraggingCanvas, isCreatingConnection]
  );

  const contentTransform = useMemo(
    () => `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
    [pan, zoom]
  );

  const toolbarHeight = isMobile ? 48 : TOOLBAR_HEIGHT;

  return (
    <>
      <div
        ref={canvasRef}
        className="board-canvas"
        style={{
          ...canvasStyle,
          top: toolbarHeight,
          height: `calc(100% - ${toolbarHeight}px)`,
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onWheel={handleWheel}
      >
        <svg
          className="grid-layer"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        >
          {gridLines}
        </svg>

        <div
          className="canvas-content"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            transform: contentTransform,
            transformOrigin: '0 0',
            willChange: 'transform',
          }}
        >
          <ConnectionLayer nodes={nodes} connections={connections} />
          {nodes.map((node) => (
            <div key={node.id} data-node-id={node.id}>
              <IdeaNode node={node} />
            </div>
          ))}
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="delete-confirm-overlay" onClick={handleCancelDelete}>
          <div
            className="delete-confirm-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="delete-confirm-icon">
              <svg viewBox="0 0 24 24" fill="none" width="32" height="32">
                <path
                  d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
                  stroke="#FF6B6B"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </div>
            <h3 className="delete-confirm-title">确认删除</h3>
            <p className="delete-confirm-message">
              删除后无法恢复，确定要删除这个想法吗？
            </p>
            <div className="delete-confirm-actions">
              <button
                className="btn btn-secondary"
                onClick={handleCancelDelete}
              >
                取消
              </button>
              <button
                className="btn btn-danger"
                onClick={handleConfirmDelete}
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
