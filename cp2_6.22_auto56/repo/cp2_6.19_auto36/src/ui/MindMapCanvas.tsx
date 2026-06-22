import React, { useRef, useEffect, useState, useCallback } from 'react';
import { MindMapNode, Theme, Viewport, NodeDragState, CreateDragState } from '../types';
import { mapEngine } from '../core/MapEngine';

interface MindMapCanvasProps {
  theme: Theme;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  viewport: Viewport;
  onViewportChange: (viewport: Viewport) => void;
}

const GRID_SIZE = 20;
const NODE_CORNER_RADIUS = 8;
const SNAP_THRESHOLD = 10;

export const MindMapCanvas: React.FC<MindMapCanvasProps> = ({
  theme,
  selectedNodeId,
  onSelectNode,
  viewport,
  onViewportChange,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const thumbnailRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<MindMapNode[]>([]);
  const [nodeDragState, setNodeDragState] = useState<NodeDragState>({
    isDragging: false,
    nodeId: null,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0,
  });
  const [createDragState, setCreateDragState] = useState<CreateDragState>({
    isCreating: false,
    parentId: null,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  });
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [flashNodeId, setFlashNodeId] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isThumbDragging, setIsThumbDragging] = useState(false);
  const [newlyCreatedNodeId, setNewlyCreatedNodeId] = useState<string | null>(null);
  const [hoveredConnectionId, setHoveredConnectionId] = useState<string | null>(null);
  const [mouseWorldPos, setMouseWorldPos] = useState<{ x: number; y: number } | null>(null);
  const [isOverDeleteBtn, setIsOverDeleteBtn] = useState<string | null>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    setNodes(mapEngine.getNodes());

    const handleNodesChanged = () => {
      setNodes(mapEngine.getNodes());
    };

    const handleNodeCreated = (node: MindMapNode) => {
      setNewlyCreatedNodeId(node.id);
      setTimeout(() => setNewlyCreatedNodeId(null), 300);
    };

    mapEngine.eventBus.on('nodes:changed', handleNodesChanged);
    mapEngine.eventBus.on('node:created', handleNodeCreated);

    return () => {
      mapEngine.eventBus.off('nodes:changed', handleNodesChanged);
      mapEngine.eventBus.off('node:created', handleNodeCreated);
    };
  }, []);

  const screenToWorld = useCallback(
    (screenX: number, screenY: number) => {
      if (!canvasRef.current) return { x: 0, y: 0 };
      const rect = canvasRef.current.getBoundingClientRect();
      return {
        x: (screenX - rect.left - viewport.x) / viewport.scale,
        y: (screenY - rect.top - viewport.y) / viewport.scale,
      };
    },
    [viewport]
  );

  const handleCanvasDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target !== svgRef.current) return;

      const { x, y } = screenToWorld(e.clientX, e.clientY);

      const hasRootNode = nodes.some((n) => n.parentId === null);
      if (!hasRootNode) {
        mapEngine.createNode('中心主题', x - 70, y - 25);
      }
    },
    [nodes, screenToWorld]
  );

  const handleNodeClick = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      e.stopPropagation();
      onSelectNode(nodeId);
    },
    [onSelectNode]
  );

  const handleNodeDoubleClick = useCallback(
    (e: React.MouseEvent, node: MindMapNode) => {
      e.stopPropagation();
      setEditingNodeId(node.id);
      setEditingTitle(node.title);
      onSelectNode(node.id);
    },
    [onSelectNode]
  );

  const handleEditInputBlur = useCallback(() => {
    if (editingNodeId && editingTitle.trim()) {
      mapEngine.updateNode(editingNodeId, { title: editingTitle.trim() });
      setFlashNodeId(editingNodeId);
      setTimeout(() => setFlashNodeId(null), 600);
    }
    setEditingNodeId(null);
    setEditingTitle('');
  }, [editingNodeId, editingTitle]);

  const handleEditKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleEditInputBlur();
      } else if (e.key === 'Escape') {
        setEditingNodeId(null);
        setEditingTitle('');
      }
    },
    [handleEditInputBlur]
  );

  const handleNodeMouseDown = useCallback(
    (e: React.MouseEvent, node: MindMapNode) => {
      e.stopPropagation();
      if (editingNodeId === node.id) return;

      const { x, y } = screenToWorld(e.clientX, e.clientY);

      setNodeDragState({
        isDragging: true,
        nodeId: node.id,
        startX: node.x,
        startY: node.y,
        offsetX: x - node.x,
        offsetY: y - node.y,
      });

      onSelectNode(node.id);
    },
    [editingNodeId, screenToWorld, onSelectNode]
  );

  const handleRightEdgeMouseDown = useCallback(
    (e: React.MouseEvent, node: MindMapNode) => {
      e.stopPropagation();
      const { x, y } = screenToWorld(e.clientX, e.clientY);

      setCreateDragState({
        isCreating: true,
        parentId: node.id,
        startX: node.x + node.width,
        startY: node.y + node.height / 2,
        currentX: x,
        currentY: y,
      });
    },
    [screenToWorld]
  );

  const bezierDistance = (
    px: number,
    py: number,
    p0x: number,
    p0y: number,
    p1x: number,
    p1y: number,
    p2x: number,
    p2y: number,
    p3x: number,
    p3y: number
  ): number => {
    let minDist = Infinity;
    const samples = 40;
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const u = 1 - t;
      const bx =
        u * u * u * p0x +
        3 * u * u * t * p1x +
        3 * u * t * t * p2x +
        t * t * t * p3x;
      const by =
        u * u * u * p0y +
        3 * u * u * t * p1y +
        3 * u * t * t * p2y +
        t * t * t * p3y;
      const dist = Math.sqrt((px - bx) * (px - bx) + (py - by) * (py - by));
      if (dist < minDist) {
        minDist = dist;
      }
    }
    return minDist;
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const { x, y } = screenToWorld(e.clientX, e.clientY);
      setMouseWorldPos({ x, y });

      if (!isOverDeleteBtn) {
        let closestId: string | null = null;
        let closestDist = Infinity;
        const hitThreshold = 12 / viewport.scale;

        nodes.forEach((node) => {
          if (!node.parentId) return;
          const parent = nodes.find((n) => n.id === node.parentId);
          if (!parent) return;

          const startX = parent.x + parent.width;
          const startY = parent.y + parent.height / 2;
          const endX = node.x;
          const endY = node.y + node.height / 2;
          const midX = (startX + endX) / 2;

          const dist = bezierDistance(
            x,
            y,
            startX,
            startY,
            midX,
            startY,
            midX,
            endY,
            endX,
            endY
          );

          if (dist < hitThreshold && dist < closestDist) {
            closestDist = dist;
            closestId = node.id;
          }
        });

        setHoveredConnectionId(closestId);
      }

      if (nodeDragState.isDragging && nodeDragState.nodeId) {
        const newX = Math.round((x - nodeDragState.offsetX) / SNAP_THRESHOLD) * SNAP_THRESHOLD;
        const newY = Math.round((y - nodeDragState.offsetY) / SNAP_THRESHOLD) * SNAP_THRESHOLD;

        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }

        animationFrameRef.current = requestAnimationFrame(() => {
          mapEngine.moveNode(nodeDragState.nodeId!, newX, newY);
        });
      }

      if (createDragState.isCreating) {
        setCreateDragState((prev) => ({
          ...prev,
          currentX: x,
          currentY: y,
        }));
      }

      if (isPanning) {
        const dx = e.clientX - panStart.x;
        const dy = e.clientY - panStart.y;
        onViewportChange({
          ...viewport,
          x: viewport.x + dx,
          y: viewport.y + dy,
        });
        setPanStart({ x: e.clientX, y: e.clientY });
      }
    },
    [nodeDragState, createDragState, isPanning, panStart, viewport, onViewportChange, screenToWorld, nodes, isOverDeleteBtn]
  );

  const handleMouseUp = useCallback(() => {
    if (createDragState.isCreating && createDragState.parentId) {
      const distance = Math.sqrt(
        Math.pow(createDragState.currentX - createDragState.startX, 2) +
          Math.pow(createDragState.currentY - createDragState.startY, 2)
      );

      if (distance > 30) {
        mapEngine.createNode(
          '新节点',
          createDragState.currentX - 70,
          createDragState.currentY - 25,
          createDragState.parentId
        );
      }
    }

    setNodeDragState({
      isDragging: false,
      nodeId: null,
      startX: 0,
      startY: 0,
      offsetX: 0,
      offsetY: 0,
    });
    setCreateDragState({
      isCreating: false,
      parentId: null,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
    });
    setIsPanning(false);

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsThumbDragging(false);
    setHoveredConnectionId(null);
    setIsOverDeleteBtn(null);
    setMouseWorldPos(null);
  }, [createDragState]);

  const handleThumbnailClick = useCallback(
    (e: React.MouseEvent) => {
      if (!thumbnailRef.current || !canvasRef.current) return;

      const thumbRect = thumbnailRef.current.getBoundingClientRect();
      const canvasRect = canvasRef.current.getBoundingClientRect();

      const clickX = e.clientX - thumbRect.left;
      const clickY = e.clientY - thumbRect.top;

      const thumbWidth = thumbRect.width;
      const thumbHeight = thumbRect.height;

      const viewWorldWidth = canvasRect.width / viewport.scale;
      const viewWorldHeight = canvasRect.height / viewport.scale;

      const worldX = (clickX / thumbWidth) * viewWorldWidth;
      const worldY = (clickY / thumbHeight) * viewWorldHeight;

      const newX = canvasRect.width / 2 - worldX * viewport.scale;
      const newY = canvasRect.height / 2 - worldY * viewport.scale;

      onViewportChange({
        ...viewport,
        x: newX,
        y: newY,
      });
    },
    [viewport, onViewportChange]
  );

  const handleThumbnailMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsThumbDragging(true);
      handleThumbnailClick(e);
    },
    [handleThumbnailClick]
  );

  useEffect(() => {
    if (!isThumbDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!thumbnailRef.current || !canvasRef.current) return;

      const thumbRect = thumbnailRef.current.getBoundingClientRect();
      const canvasRect = canvasRef.current.getBoundingClientRect();

      const mouseX = e.clientX - thumbRect.left;
      const mouseY = e.clientY - thumbRect.top;

      const thumbWidth = thumbRect.width;
      const thumbHeight = thumbRect.height;

      const viewWorldWidth = canvasRect.width / viewport.scale;
      const viewWorldHeight = canvasRect.height / viewport.scale;

      const worldX = (mouseX / thumbWidth) * viewWorldWidth;
      const worldY = (mouseY / thumbHeight) * viewWorldHeight;

      const newX = canvasRect.width / 2 - worldX * viewport.scale;
      const newY = canvasRect.height / 2 - worldY * viewport.scale;

      onViewportChange({
        ...viewport,
        x: newX,
        y: newY,
      });
    };

    const handleMouseUp = () => {
      setIsThumbDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isThumbDragging, viewport, onViewportChange]);

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === svgRef.current || e.target === canvasRef.current) {
        onSelectNode(null);
        setIsPanning(true);
        setPanStart({ x: e.clientX, y: e.clientY });
      }
    },
    [onSelectNode]
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.min(2, Math.max(0.5, viewport.scale * delta));

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const worldX = (mouseX - viewport.x) / viewport.scale;
      const worldY = (mouseY - viewport.y) / viewport.scale;

      const newX = mouseX - worldX * newScale;
      const newY = mouseY - worldY * newScale;

      onViewportChange({
        x: newX,
        y: newY,
        scale: newScale,
      });
    },
    [viewport, onViewportChange]
  );

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [handleMouseMove, handleMouseUp]);

  const handleDeleteConnection = useCallback(
    (e: React.MouseEvent, childNodeId: string) => {
      e.preventDefault();
      e.stopPropagation();
      e.nativeEvent.stopImmediatePropagation();

      const node = mapEngine.getNode(childNodeId);
      if (node && node.parentId) {
        const parentId = node.parentId;
        mapEngine.updateNode(childNodeId, { parentId: null });
        const parent = mapEngine.getNode(parentId);
        if (parent) {
          mapEngine.updateNode(parentId, {
            children: parent.children.filter((id) => id !== childNodeId),
          });
        }
      }

      setHoveredConnectionId(null);
      setIsOverDeleteBtn(null);
    },
    []
  );

  const renderConnections = () => {
    return nodes
      .filter((node) => node.parentId)
      .map((node) => {
        const parent = nodes.find((n) => n.id === node.parentId);
        if (!parent) return null;

        const startX = parent.x + parent.width;
        const startY = parent.y + parent.height / 2;
        const endX = node.x;
        const endY = node.y + node.height / 2;

        const midX = (startX + endX) / 2;
        const path = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;

        const isFaded =
          nodeDragState.isDragging && nodeDragState.nodeId !== node.id;
        const isHovered = hoveredConnectionId === node.id;
        const lineColor = isHovered ? '#2563EB' : theme.lineColor;
        const lineWidth = isHovered ? 3 : 2;

        const arrowW = 12;
        const arrowH = 9;

        const mt = 0.5;
        const control1x = midX;
        const control1y = startY;
        const control2x = midX;
        const control2y = endY;

        const bezierPoint = (t: number) => {
          const u = 1 - t;
          const x =
            u * u * u * startX +
            3 * u * u * t * control1x +
            3 * u * t * t * control2x +
            t * t * t * endX;
          const y =
            u * u * u * startY +
            3 * u * u * t * control1y +
            3 * u * t * t * control2y +
            t * t * t * endY;
          return { x, y };
        };

        const deleteBtnPos = bezierPoint(mt);
        const btnRadius = 12;

        const handleBtnMouseEnter = (e: React.MouseEvent) => {
          e.stopPropagation();
          setIsOverDeleteBtn(node.id);
          setHoveredConnectionId(node.id);
        };

        const handleBtnMouseLeave = (e: React.MouseEvent) => {
          e.stopPropagation();
          setIsOverDeleteBtn(null);
        };

        const handleBtnMouseDown = (e: React.MouseEvent) => {
          e.stopPropagation();
          e.preventDefault();
        };

        return (
          <g
            key={`conn-${node.id}`}
            style={{ opacity: isFaded ? 0.3 : 1, transition: 'opacity 0.2s ease' }}
          >
            <defs>
              <linearGradient
                id={`gradient-${node.id}`}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor={lineColor} stopOpacity="0.6" />
                <stop offset="100%" stopColor={lineColor} stopOpacity="1" />
              </linearGradient>
            </defs>

            <path
              d={path}
              fill="none"
              stroke={`url(#gradient-${node.id})`}
              strokeWidth={lineWidth}
              style={{
                transition: 'stroke-width 0.2s ease',
                pointerEvents: 'none',
              }}
            />

            <polygon
              points={`${endX},${endY} ${endX - arrowW},${endY - arrowH} ${endX - arrowW * 0.7},${endY} ${endX - arrowW},${endY + arrowH}`}
              fill={lineColor}
              style={{
                transition: 'fill 0.2s ease',
                pointerEvents: 'none',
              }}
            />

            {isHovered && (
              <g
                transform={`translate(${deleteBtnPos.x}, ${deleteBtnPos.y})`}
                style={{ cursor: 'pointer' }}
                onMouseEnter={handleBtnMouseEnter}
                onMouseLeave={handleBtnMouseLeave}
                onMouseDown={handleBtnMouseDown}
                onClick={(e) => handleDeleteConnection(e, node.id)}
              >
                <circle
                  cx="0"
                  cy="0"
                  r={btnRadius}
                  fill="#FFFFFF"
                  stroke="#2563EB"
                  strokeWidth="1.5"
                />
                <line
                  x1="-5"
                  y1="-5"
                  x2="5"
                  y2="5"
                  stroke="#2563EB"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
                <line
                  x1="5"
                  y1="-5"
                  x2="-5"
                  y2="5"
                  stroke="#2563EB"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </g>
            )}
          </g>
        );
      });
  };

  const renderCreateGuide = () => {
    if (!createDragState.isCreating) return null;

    const midX = (createDragState.startX + createDragState.currentX) / 2;
    const path = `M ${createDragState.startX} ${createDragState.startY} C ${midX} ${createDragState.startY}, ${midX} ${createDragState.currentY}, ${createDragState.currentX} ${createDragState.currentY}`;

    return (
      <g>
        <path
          d={path}
          fill="none"
          stroke={theme.lineColor}
          strokeWidth="2"
          strokeDasharray="5,5"
          opacity="0.5"
        />
        <circle
          cx={createDragState.currentX}
          cy={createDragState.currentY}
          r="8"
          fill={theme.lineColor}
          opacity="0.5"
        />
      </g>
    );
  };

  const renderSnapIndicator = () => {
    if (!nodeDragState.isDragging || !nodeDragState.nodeId) return null;

    const node = nodes.find((n) => n.id === nodeDragState.nodeId);
    if (!node) return null;

    const snapX = Math.round(node.x / SNAP_THRESHOLD) * SNAP_THRESHOLD;
    const snapY = Math.round(node.y / SNAP_THRESHOLD) * SNAP_THRESHOLD;

    return (
      <circle
        cx={snapX}
        cy={snapY + node.height / 2}
        r="4"
        fill={theme.lineColor}
        opacity="0.6"
      />
    );
  };

  const renderNodes = () => {
    return nodes.map((node) => {
      const isSelected = selectedNodeId === node.id;
      const isEditing = editingNodeId === node.id;
      const isFlashing = flashNodeId === node.id;
      const isNew = newlyCreatedNodeId === node.id;
      const isFaded =
        (nodeDragState.isDragging && nodeDragState.nodeId !== node.id) ||
        (createDragState.isCreating && createDragState.parentId !== node.id);

      return (
        <g
          key={node.id}
          transform={`translate(${node.x}, ${node.y})`}
          style={{
            cursor: 'move',
            opacity: isFaded ? 0.3 : 1,
            transition: 'opacity 0.2s ease',
          }}
        >
          {isSelected && (
            <rect
              x="-5"
              y="-5"
              width={node.width + 10}
              height={node.height + 10}
              rx={NODE_CORNER_RADIUS + 5}
              ry={NODE_CORNER_RADIUS + 5}
              fill={theme.glowColor}
              style={{ filter: 'blur(10px)' }}
            />
          )}

          <rect
            width={node.width}
            height={node.height}
            rx={NODE_CORNER_RADIUS}
            ry={NODE_CORNER_RADIUS}
            fill={theme.nodeFill}
            stroke={isFlashing ? '#4A90D9' : theme.nodeStroke}
            strokeWidth={isFlashing ? 3 : isSelected ? 2 : 1}
            style={{
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              transform: isNew ? 'scale(0)' : 'scale(1)',
              transformOrigin: 'center',
              animation: isNew ? 'popIn 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards' : 'none',
            }}
            onMouseDown={(e) => handleNodeMouseDown(e, node)}
            onClick={(e) => handleNodeClick(e, node.id)}
            onDoubleClick={(e) => handleNodeDoubleClick(e, node)}
          />

          {isEditing ? (
            <foreignObject
              x="8"
              y="8"
              width={node.width - 16}
              height={node.height - 16}
            >
              <input
                type="text"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value.slice(0, 50))}
                onBlur={handleEditInputBlur}
                onKeyDown={handleEditKeyDown}
                autoFocus
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontSize: '14px',
                  color: theme.nodeText,
                  textAlign: 'center',
                  fontFamily: 'inherit',
                }}
                maxLength={50}
              />
            </foreignObject>
          ) : (
            <text
              x={node.width / 2}
              y={node.height / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={theme.nodeText}
              fontSize="14"
              style={{
                userSelect: 'none',
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {node.title.length > 12 ? node.title.slice(0, 12) + '...' : node.title}
            </text>
          )}

          <rect
            x={node.width - 6}
            y={node.height / 2 - 8}
            width="12"
            height="16"
            rx="6"
            fill={theme.lineColor}
            opacity="0"
            style={{ cursor: 'crosshair' }}
            onMouseDown={(e) => handleRightEdgeMouseDown(e, node)}
            onMouseEnter={(e) => {
              (e.target as SVGRectElement).style.opacity = '0.5';
            }}
            onMouseLeave={(e) => {
              (e.target as SVGRectElement).style.opacity = '0';
            }}
          />
        </g>
      );
    });
  };

  const gridPatternId = `grid-pattern-${theme.id}`;

  return (
    <div
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        background: theme.background,
        transition: 'background-color 0.6s ease',
      }}
      onMouseDown={handleCanvasMouseDown}
      onWheel={handleWheel}
      onDoubleClick={handleCanvasDoubleClick}
    >
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        style={{ display: 'block' }}
      >
        <defs>
          <pattern
            id={gridPatternId}
            width={GRID_SIZE * viewport.scale}
            height={GRID_SIZE * viewport.scale}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${GRID_SIZE * viewport.scale} 0 L 0 0 0 ${GRID_SIZE * viewport.scale}`}
              fill="none"
              stroke={theme.gridColor}
              strokeWidth="1"
              style={{ transition: 'stroke 0.6s ease' }}
            />
          </pattern>
          <style>
            {`
              @keyframes popIn {
                0% { transform: scale(0); }
                100% { transform: scale(1); }
              }
              @keyframes flash {
                0%, 100% { stroke: ${theme.nodeStroke}; }
                50% { stroke: #4A90D9; }
              }
            `}
          </style>
        </defs>

        <rect width="100%" height="100%" fill={`url(#${gridPatternId})`} />

        <g
          style={{
            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
            transformOrigin: '0 0',
          }}
        >
          {renderConnections()}
          {renderCreateGuide()}
          {renderSnapIndicator()}
          {renderNodes()}
        </g>
      </svg>

      <div
        ref={thumbnailRef}
        style={{
          position: 'absolute',
          right: '20px',
          bottom: '20px',
          width: '180px',
          height: '120px',
          borderRadius: '8px',
          border: `1px solid ${theme.nodeStroke}`,
          background: theme.background,
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          cursor: isThumbDragging ? 'grabbing' : 'grab',
          transition: 'background-color 0.6s ease, border-color 0.6s ease',
        }}
        onClick={handleThumbnailClick}
        onMouseDown={handleThumbnailMouseDown}
      >
        <svg width="100%" height="100%" style={{ display: 'block' }}>
          <defs>
            <pattern
              id="thumb-grid"
              width="10"
              height="10"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 10 0 L 0 0 0 10"
                fill="none"
                stroke={theme.gridColor}
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#thumb-grid)" />

          <g>
            {nodes.map((node) => {
              if (!canvasRef.current) return null;
              const canvasRect = canvasRef.current.getBoundingClientRect();
              const thumbRect = thumbnailRef.current?.getBoundingClientRect();
              if (!thumbRect) return null;

              const scaleX = thumbRect.width / (canvasRect.width / viewport.scale);
              const scaleY = thumbRect.height / (canvasRect.height / viewport.scale);

              return (
                <rect
                  key={node.id}
                  x={node.x * scaleX}
                  y={node.y * scaleY}
                  width={node.width * scaleX}
                  height={node.height * scaleY}
                  rx={2}
                  ry={2}
                  fill={theme.nodeFill}
                  stroke={theme.lineColor}
                  strokeWidth="0.5"
                />
              );
            })}
          </g>

          {(() => {
            if (!canvasRef.current || !thumbnailRef.current) return null;

            const canvasRect = canvasRef.current.getBoundingClientRect();
            const thumbRect = thumbnailRef.current.getBoundingClientRect();

            const viewWorldWidth = canvasRect.width / viewport.scale;
            const viewWorldHeight = canvasRect.height / viewport.scale;

            const thumbScaleX = thumbRect.width / (canvasRect.width / viewport.scale);
            const thumbScaleY = thumbRect.height / (canvasRect.height / viewport.scale);

            const viewportLeft = -viewport.x / viewport.scale;
            const viewportTop = -viewport.y / viewport.scale;

            return (
              <rect
                x={viewportLeft * thumbScaleX}
                y={viewportTop * thumbScaleY}
                width={viewWorldWidth * thumbScaleX}
                height={viewWorldHeight * thumbScaleY}
                fill={theme.lineColor}
                fillOpacity="0.2"
                stroke={theme.lineColor}
                strokeWidth="1"
                style={{ pointerEvents: 'none' }}
              />
            );
          })()}
        </svg>
      </div>
    </div>
  );
};
