import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { MindNode, User } from '../services/api';
import { MindMapSocket } from '../services/websocket';

interface CanvasEngineProps {
  canvasId: string;
  nodes: MindNode[];
  selectedNodeId: string | null;
  onNodeSelect: (nodeId: string | null) => void;
  onNodesChange: (nodes: MindNode[]) => void;
  socket?: MindMapSocket;
  currentUser?: User;
  historyMode?: boolean;
  highlightedNodeId?: string | null;
}

interface DragState {
  isDragging: boolean;
  nodeId: string;
  startX: number;
  startY: number;
  nodeStartX: number;
  nodeStartY: number;
  offsetX: number;
  offsetY: number;
}

const NODE_WIDTH = 160;
const NODE_HEIGHT = 48;
const EDGE_SCROLL_THRESHOLD = 50;
const EDGE_SCROLL_SPEED = 8;
const BOUNCE_DURATION = 300;

const colorMap: Record<string, string> = {
  red: '#ff4757',
  blue: '#3742fa',
  green: '#2ed573',
  yellow: '#ffa502',
  purple: '#a55eea',
};

const flattenNodes = (nodes: MindNode[]): MindNode[] => {
  const result: MindNode[] = [];
  const traverse = (nodeList: MindNode[]) => {
    nodeList.forEach((node) => {
      result.push(node);
      if (node.children && node.children.length > 0) {
        traverse(node.children);
      }
    });
  };
  traverse(nodes);
  return result;
};

const buildTree = (flatNodes: MindNode[]): MindNode[] => {
  const nodeMap = new Map<string, MindNode>();
  const roots: MindNode[] = [];

  flatNodes.forEach((node) => {
    nodeMap.set(node.id, { ...node, children: [] });
  });

  flatNodes.forEach((node) => {
    const mappedNode = nodeMap.get(node.id)!;
    if (node.parentId && nodeMap.has(node.parentId)) {
      const parent = nodeMap.get(node.parentId)!;
      parent.children = parent.children || [];
      parent.children.push(mappedNode);
    } else {
      roots.push(mappedNode);
    }
  });

  return roots;
};

export const CanvasEngine: React.FC<CanvasEngineProps> = ({
  canvasId,
  nodes,
  selectedNodeId,
  onNodeSelect,
  onNodesChange,
  socket,
  currentUser,
  historyMode = false,
  highlightedNodeId = null,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [offsetStart, setOffsetStart] = useState({ x: 0, y: 0 });
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [hoverDropTargetId, setHoverDropTargetId] = useState<string | null>(null);
  const [dragLabelPos, setDragLabelPos] = useState({ x: 0, y: 0 });
  const [bouncingNodeIds, setBouncingNodeIds] = useState<Set<string>>(new Set());
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const edgeScrollRef = useRef<number | null>(null);
  const dragNodeRef = useRef<MindNode | null>(null);

  const flatNodes = useMemo(() => flattenNodes(nodes), [nodes]);
  const nodeMap = useMemo(() => {
    const map = new Map<string, MindNode>();
    flatNodes.forEach((node) => map.set(node.id, node));
    return map;
  }, [flatNodes]);

  const generateId = () => `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const getNodeById = (id: string): MindNode | undefined => nodeMap.get(id);

  const screenToCanvas = (clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (clientX - rect.left - offset.x) / scale,
      y: (clientY - rect.top - offset.y) / scale,
    };
  };

  const findDropTarget = (canvasX: number, canvasY: number, draggingNodeId: string): MindNode | null => {
    let target: MindNode | null = null;
    let minDist = Infinity;

    flatNodes.forEach((node) => {
      if (node.id === draggingNodeId) return;
      const nodeCenterX = node.x + NODE_WIDTH / 2;
      const nodeCenterY = node.y + NODE_HEIGHT / 2;
      const dist = Math.sqrt((canvasX - nodeCenterX) ** 2 + (canvasY - nodeCenterY) ** 2);

      if (canvasX >= node.x && canvasX <= node.x + NODE_WIDTH &&
          canvasY >= node.y && canvasY <= node.y + NODE_HEIGHT) {
        if (dist < minDist) {
          minDist = dist;
          target = node;
        }
      }
    });

    const targetNode = target as MindNode | null;
    if (targetNode) {
      const draggingNode = getNodeById(draggingNodeId);
      if (draggingNode && isDescendant(draggingNodeId, targetNode.id)) {
        return null;
      }
    }

    return target;
  };

  const isDescendant = (nodeId: string, potentialAncestorId: string): boolean => {
    const node = getNodeById(nodeId);
    if (!node) return false;
    if (!node.parentId) return false;
    if (node.parentId === potentialAncestorId) return true;
    return isDescendant(node.parentId, potentialAncestorId);
  };

  const startEdgeScroll = useCallback((clientX: number, clientY: number) => {
    if (edgeScrollRef.current) {
      cancelAnimationFrame(edgeScrollRef.current);
    }

    const scroll = () => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect || !dragState) {
        edgeScrollRef.current = null;
        return;
      }

      let dx = 0;
      let dy = 0;

      if (clientX - rect.left < EDGE_SCROLL_THRESHOLD) {
        dx = -EDGE_SCROLL_SPEED;
      } else if (rect.right - clientX < EDGE_SCROLL_THRESHOLD) {
        dx = EDGE_SCROLL_SPEED;
      }

      if (clientY - rect.top < EDGE_SCROLL_THRESHOLD) {
        dy = -EDGE_SCROLL_SPEED;
      } else if (rect.bottom - clientY < EDGE_SCROLL_THRESHOLD) {
        dy = EDGE_SCROLL_SPEED;
      }

      if (dx !== 0 || dy !== 0) {
        setOffset((prev) => ({
          x: prev.x + dx,
          y: prev.y + dy,
        }));

        setDragState((prev) => {
          if (!prev) return prev;
          const newNodeX = prev.nodeStartX + dx / scale;
          const newNodeY = prev.nodeStartY + dy / scale;
          return {
            ...prev,
            nodeStartX: newNodeX,
            nodeStartY: newNodeY,
          };
        });

        const canvasPos = {
          x: dragState.nodeStartX + (dragState.offsetX + dx) / scale,
          y: dragState.nodeStartY + (dragState.offsetY + dy) / scale,
        };
        const dropTarget = findDropTarget(canvasPos.x, canvasPos.y, dragState.nodeId);
        setHoverDropTargetId(dropTarget?.id || null);
      }

      edgeScrollRef.current = requestAnimationFrame(scroll);
    };

    edgeScrollRef.current = requestAnimationFrame(scroll);
  }, [dragState, scale]);

  const stopEdgeScroll = useCallback(() => {
    if (edgeScrollRef.current) {
      cancelAnimationFrame(edgeScrollRef.current);
      edgeScrollRef.current = null;
    }
  }, []);

  const handleMouseDown = (e: React.MouseEvent, node: MindNode) => {
    if (historyMode || editingNodeId) return;
    e.stopPropagation();
    onNodeSelect(node.id);

    const canvasPos = screenToCanvas(e.clientX, e.clientY);
    setDragState({
      isDragging: false,
      nodeId: node.id,
      startX: e.clientX,
      startY: e.clientY,
      nodeStartX: node.x,
      nodeStartY: node.y,
      offsetX: canvasPos.x - node.x,
      offsetY: canvasPos.y - node.y,
    });
    dragNodeRef.current = node;
    setDragLabelPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragState) {
      const dx = e.clientX - dragState.startX;
      const dy = e.clientY - dragState.startY;
      const threshold = 5;

      if (!dragState.isDragging && (Math.abs(dx) > threshold || Math.abs(dy) > threshold)) {
        setDragState({ ...dragState, isDragging: true });
      }

      if (dragState.isDragging) {
        const canvasPos = screenToCanvas(e.clientX, e.clientY);
        const newX = canvasPos.x - dragState.offsetX;
        const newY = canvasPos.y - dragState.offsetY;

        updateNodePosition(dragState.nodeId, newX, newY);

        const dropTarget = findDropTarget(canvasPos.x, canvasPos.y, dragState.nodeId);
        setHoverDropTargetId(dropTarget?.id || null);

        setDragLabelPos({ x: e.clientX, y: e.clientY });
        startEdgeScroll(e.clientX, e.clientY);
      }
    } else if (isPanning) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      setOffset({
        x: offsetStart.x + dx,
        y: offsetStart.y + dy,
      });
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (dragState && dragState.isDragging) {
      const canvasPos = screenToCanvas(e.clientX, e.clientY);
      const dropTarget = findDropTarget(canvasPos.x, canvasPos.y, dragState.nodeId);

      if (dropTarget && dropTarget.id !== dragState.nodeId) {
        moveNodeToParent(dragState.nodeId, dropTarget.id);
      }

      triggerBounceAnimation(dragState.nodeId);
      stopEdgeScroll();
    }

    setDragState(null);
    setHoverDropTargetId(null);
    dragNodeRef.current = null;
    setIsPanning(false);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current || e.target === containerRef.current) {
      onNodeSelect(null);
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      setOffsetStart({ ...offset });
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(Math.max(scale * delta, 0.2), 3);

    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      setOffset({
        x: mouseX - (mouseX - offset.x) * (newScale / scale),
        y: mouseY - (mouseY - offset.y) * (newScale / scale),
      });
    }

    setScale(newScale);
  };

  const updateNodePosition = (nodeId: string, x: number, y: number) => {
    const newFlatNodes = flatNodes.map((node) =>
      node.id === nodeId ? { ...node, x, y } : node
    );
    onNodesChange(buildTree(newFlatNodes));
  };

  const moveNodeToParent = (nodeId: string, newParentId: string) => {
    const newFlatNodes = flatNodes.map((node) =>
      node.id === nodeId ? { ...node, parentId: newParentId } : node
    );
    onNodesChange(buildTree(newFlatNodes));

    if (socket) {
      const node = getNodeById(nodeId);
      if (node) {
        socket.emitNodeMove({
          nodeId,
          newParentId,
          x: node.x,
          y: node.y,
        });
      }
    }
  };

  const triggerBounceAnimation = (nodeId: string) => {
    setBouncingNodeIds((prev) => new Set(prev).add(nodeId));
    setTimeout(() => {
      setBouncingNodeIds((prev) => {
        const next = new Set(prev);
        next.delete(nodeId);
        return next;
      });
    }, BOUNCE_DURATION);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (historyMode) return;
    const canvasPos = screenToCanvas(e.clientX, e.clientY);
    const clickedNode = flatNodes.find(
      (node) =>
        canvasPos.x >= node.x &&
        canvasPos.x <= node.x + NODE_WIDTH &&
        canvasPos.y >= node.y &&
        canvasPos.y <= node.y + NODE_HEIGHT
    );

    if (clickedNode) {
      setEditingNodeId(clickedNode.id);
      setEditText(clickedNode.text);
    } else if (flatNodes.length === 0) {
      const newNode: MindNode = {
        id: generateId(),
        text: '中心主题',
        parentId: null,
        x: canvasPos.x - NODE_WIDTH / 2,
        y: canvasPos.y - NODE_HEIGHT / 2,
        children: [],
      };
      onNodesChange([...nodes, newNode]);
      if (socket) socket.emitNodeCreate(newNode);
      onNodeSelect(newNode.id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (historyMode || !selectedNodeId || editingNodeId) return;

    if (e.key === 'Tab') {
      e.preventDefault();
      addChildNode(selectedNodeId);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      addSiblingNode(selectedNodeId);
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      deleteNode(selectedNodeId);
    }
  };

  const addChildNode = (parentId: string) => {
    const parent = getNodeById(parentId);
    if (!parent) return;

    const siblings = flatNodes.filter((n) => n.parentId === parentId);
    const newNode: MindNode = {
      id: generateId(),
      text: '新节点',
      parentId,
      x: parent.x + NODE_WIDTH + 60,
      y: parent.y + siblings.length * (NODE_HEIGHT + 20),
      children: [],
    };

    onNodesChange(buildTree([...flatNodes, newNode]));
    if (socket) socket.emitNodeCreate(newNode);
    onNodeSelect(newNode.id);
    setEditingNodeId(newNode.id);
    setEditText('新节点');
  };

  const addSiblingNode = (nodeId: string) => {
    const node = getNodeById(nodeId);
    if (!node) return;

    const newNode: MindNode = {
      id: generateId(),
      text: '新节点',
      parentId: node.parentId,
      x: node.x,
      y: node.y + NODE_HEIGHT + 20,
      children: [],
    };

    onNodesChange(buildTree([...flatNodes, newNode]));
    if (socket) socket.emitNodeCreate(newNode);
    onNodeSelect(newNode.id);
    setEditingNodeId(newNode.id);
    setEditText('新节点');
  };

  const deleteNode = (nodeId: string) => {
    const deleteRecursive = (id: string): string[] => {
      const node = getNodeById(id);
      if (!node) return [id];
      const children = flatNodes.filter((n) => n.parentId === id);
      const childIds = children.flatMap((c) => deleteRecursive(c.id));
      return [id, ...childIds];
    };

    const idsToDelete = new Set(deleteRecursive(nodeId));
    const newFlatNodes = flatNodes.filter((n) => !idsToDelete.has(n.id));
    onNodesChange(buildTree(newFlatNodes));
    if (socket) socket.emitNodeDelete(nodeId);
    onNodeSelect(null);
  };

  const handleEditBlur = () => {
    if (editingNodeId) {
      const newFlatNodes = flatNodes.map((node) =>
        node.id === editingNodeId ? { ...node, text: editText } : node
      );
      onNodesChange(buildTree(newFlatNodes));
      if (socket) {
        const node = getNodeById(editingNodeId);
        if (node) socket.emitNodeUpdate({ ...node, text: editText });
      }
      setEditingNodeId(null);
      setEditText('');
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEditBlur();
    } else if (e.key === 'Escape') {
      setEditingNodeId(null);
      setEditText('');
    }
  };

  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  const renderConnections = () => {
    const connections: JSX.Element[] = [];
    flatNodes.forEach((node) => {
      if (node.parentId) {
        const parent = getNodeById(node.parentId);
        if (parent) {
          const startX = parent.x + NODE_WIDTH;
          const startY = parent.y + NODE_HEIGHT / 2;
          const endX = node.x;
          const endY = node.y + NODE_HEIGHT / 2;
          const midX = (startX + endX) / 2;

          const pathD = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;
          connections.push(
            <path
              key={`conn-${node.id}`}
              d={pathD}
              stroke="#cbd5e0"
              strokeWidth="2"
              fill="none"
              opacity={historyMode ? 0.3 : 0.8}
            />
          );
        }
      }
    });
    return connections;
  };

  const renderNode = (node: MindNode) => {
    const isSelected = node.id === selectedNodeId;
    const isHoverDropTarget = node.id === hoverDropTargetId;
    const isDragging = dragState?.isDragging && dragState.nodeId === node.id;
    const isBouncing = bouncingNodeIds.has(node.id);
    const isEditing = editingNodeId === node.id;
    const isHighlighted = highlightedNodeId === node.id;

    const nodeStyle: React.CSSProperties = {
      position: 'absolute',
      left: node.x,
      top: node.y,
      width: NODE_WIDTH,
      minHeight: NODE_HEIGHT,
      padding: '10px 14px 10px 14px',
      paddingLeft: node.color ? '18px' : '14px',
      background: 'white',
      borderRadius: 8,
      boxShadow: isSelected
        ? '0 0 0 3px #3ebf8f55, 0 2px 8px rgba(0,0,0,0.1)'
        : '0 2px 8px rgba(0,0,0,0.1)',
      transform: isSelected ? 'scale(1.02)' : isBouncing ? undefined : 'scale(1)',
      transition: isBouncing
        ? 'none'
        : 'box-shadow 0.3s ease-in-out, transform 0.3s ease-in-out, background-color 0.2s ease',
      cursor: historyMode ? 'default' : 'move',
      zIndex: isSelected || isDragging ? 100 : isHoverDropTarget ? 50 : 1,
      opacity: historyMode ? 0.5 : 1,
      color: historyMode ? '#999' : 'inherit',
      animation: isBouncing ? 'bounce 0.3s ease-out' : undefined,
      userSelect: 'none',
    };

    const dotStyle: React.CSSProperties = node.color
      ? {
          position: 'absolute',
          left: 6,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: colorMap[node.color],
        }
      : {};

    const hoverIndicatorStyle: React.CSSProperties = isHoverDropTarget
      ? {
          position: 'absolute',
          inset: -4,
          borderRadius: 12,
          border: '2px dashed rgba(100, 180, 255, 0.7)',
          background: 'rgba(180, 220, 255, 0.25)',
          pointerEvents: 'none',
          animation: 'pulse 1.5s ease-in-out infinite',
        }
      : {};

    return (
      <div
        key={node.id}
        className={`mind-map-node ${isSelected ? 'selected' : ''} ${
          isHighlighted ? 'search-highlight' : ''
        }`}
        style={nodeStyle}
        onMouseDown={(e) => handleMouseDown(e, node)}
        onDoubleClick={(e) => {
          e.stopPropagation();
          if (!historyMode) {
            setEditingNodeId(node.id);
            setEditText(node.text);
          }
        }}
        onMouseEnter={() => {
          if (dragState?.isDragging && dragState.nodeId !== node.id) {
            const draggingNode = dragNodeRef.current;
            if (draggingNode && !isDescendant(dragState.nodeId, node.id)) {
              setHoverDropTargetId(node.id);
            }
          }
        }}
        onMouseLeave={() => {
          if (dragState?.isDragging) {
            setHoverDropTargetId(null);
          }
        }}
      >
        {node.color && <div style={dotStyle} />}
        {isHoverDropTarget && <div style={hoverIndicatorStyle} />}
        {isEditing ? (
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={handleEditBlur}
            onKeyDown={handleEditKeyDown}
            autoFocus
            style={{
              width: '100%',
              minHeight: 24,
              border: 'none',
              outline: 'none',
              resize: 'none',
              background: 'transparent',
              fontSize: 14,
              fontFamily: 'inherit',
              color: historyMode ? '#999' : 'inherit',
            }}
          />
        ) : (
          <span
            style={{
              fontSize: 14,
              lineHeight: 1.4,
              wordBreak: 'break-word',
              fontWeight: node.richText?.bold ? 'bold' : 'normal',
              fontStyle: node.richText?.italic ? 'italic' : 'normal',
            }}
          >
            {node.text}
          </span>
        )}
        {isSelected && !historyMode && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              addChildNode(node.id);
            }}
            className="tool-button"
            style={{
              position: 'absolute',
              right: -12,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 24,
              height: 24,
              padding: 0,
              borderRadius: '50%',
              background: '#3ebf8f',
              color: 'white',
              fontSize: 16,
              lineHeight: '22px',
              textAlign: 'center',
            }}
          >
            +
          </button>
        )}
      </div>
    );
  };

  const dragLabelStyle: React.CSSProperties = dragState?.isDragging
    ? {
        position: 'fixed',
        left: dragLabelPos.x + 15,
        top: dragLabelPos.y + 15,
        padding: '6px 12px',
        background: 'rgba(30, 42, 58, 0.9)',
        color: 'white',
        fontSize: 12,
        borderRadius: 6,
        pointerEvents: 'none',
        zIndex: 10000,
        maxWidth: 200,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
      }
    : { display: 'none' };

  const ghostIndicatorStyle: React.CSSProperties = dragState?.isDragging && hoverDropTargetId
    ? {
        position: 'absolute',
        left: (getNodeById(hoverDropTargetId)?.x || 0) + NODE_WIDTH + 30,
        top: (getNodeById(hoverDropTargetId)?.y || 0) + NODE_HEIGHT / 2 - 16,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        background: 'rgba(62, 191, 143, 0.15)',
        border: '2px dashed #3ebf8f',
        borderRadius: 8,
        pointerEvents: 'none',
        animation: 'pulse 1s ease-in-out infinite',
      }
    : { display: 'none' };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: historyMode ? 'rgba(240, 244, 248, 0.5)' : '#f0f4f8',
        cursor: isPanning ? 'grabbing' : 'default',
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div
        ref={canvasRef}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
          cursor: historyMode ? 'default' : isPanning ? 'grabbing' : 'grab',
        }}
        onMouseDown={handleCanvasMouseDown}
        onDoubleClick={handleDoubleClick}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: '0 0',
            transition: isPanning ? 'none' : 'transform 0.1s ease-out',
          }}
        >
          <svg
            style={{
              position: 'absolute',
              left: -5000,
              top: -5000,
              width: 10000,
              height: 10000,
              pointerEvents: 'none',
            }}
          >
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="1"
                  opacity="0.5"
                />
              </pattern>
            </defs>
            <rect x="-5000" y="-5000" width="10000" height="10000" fill="url(#grid)" />
          </svg>

          <svg
            style={{
              position: 'absolute',
              left: -2000,
              top: -2000,
              width: 4000,
              height: 4000,
              pointerEvents: 'none',
            }}
          >
            <g transform="translate(2000, 2000)">{renderConnections()}</g>
          </svg>

          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
            }}
          >
            {flatNodes.map((node) => renderNode(node))}
          </div>

          <div style={ghostIndicatorStyle} />
        </div>
      </div>

      {dragState?.isDragging && dragNodeRef.current && (
        <div style={dragLabelStyle}>
          {truncateText(dragNodeRef.current.text, 15)}
        </div>
      )}

      {historyMode && (
        <div
          style={{
            position: 'absolute',
            top: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '10px 24px',
            background: 'rgba(30, 42, 58, 0.85)',
            color: 'white',
            borderRadius: 8,
            fontSize: 14,
            pointerEvents: 'none',
            zIndex: 100,
          }}
        >
          历史版本预览 - 仅查看
        </div>
      )}

      <div
        style={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          background: 'white',
          padding: '8px 12px',
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <button
          className="tool-button"
          onClick={() => setScale((s) => Math.max(s * 0.9, 0.2))}
          style={{ padding: '4px 8px' }}
        >
          -
        </button>
        <span style={{ fontSize: 12, minWidth: 48, textAlign: 'center' }}>
          {Math.round(scale * 100)}%
        </span>
        <button
          className="tool-button"
          onClick={() => setScale((s) => Math.min(s * 1.1, 3))}
          style={{ padding: '4px 8px' }}
        >
          +
        </button>
      </div>

      <style>{`
        @keyframes bounce {
          0% { transform: scale(1); }
          40% { transform: scale(1.08); }
          60% { transform: scale(0.97); }
          80% { transform: scale(1.02); }
          100% { transform: scale(1); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
};

export default CanvasEngine;
