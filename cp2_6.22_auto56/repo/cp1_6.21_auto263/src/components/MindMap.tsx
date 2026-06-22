import React, { useState, useRef, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { MindMapNode as MindMapNodeType } from '../utils/apiClient';

interface MindMapProps {
  nodes: MindMapNodeType[];
  setNodes: React.Dispatch<React.SetStateAction<MindMapNodeType[]>>;
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  scale: number;
  setScale: (scale: number) => void;
}

const NODE_RADIUS = 60;
const GRID_SIZE = 30;
const EDGE_HANDLE_SIZE = 12;

const MindMap: React.FC<MindMapProps> = ({
  nodes,
  setNodes,
  selectedNodeId,
  setSelectedNodeId,
  scale,
  setScale
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [isDraggingNode, setIsDraggingNode] = useState(false);
  const [dragNodeId, setDragNodeId] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragNodeStartPos, setDragNodeStartPos] = useState({ x: 0, y: 0 });
  const [isCreatingEdge, setIsCreatingEdge] = useState(false);
  const [edgeStartNodeId, setEdgeStartNodeId] = useState<string | null>(null);
  const [edgeEndPos, setEdgeEndPos] = useState({ x: 0, y: 0 });
  const [visibleNodes, setVisibleNodes] = useState<Set<string>>(new Set());
  const [animatingNodes, setAnimatingNodes] = useState<Map<string, { type: 'expand' | 'collapse'; startTime: number; delay: number }>>(new Map());

  useEffect(() => {
    const rootNodes = nodes.filter(n => n.parentId === null);
    const visible = new Set<string>();
    
    const addVisible = (nodeId: string) => {
      visible.add(nodeId);
      const node = nodes.find(n => n.id === nodeId);
      if (node && !node.collapsed) {
        nodes.filter(n => n.parentId === nodeId).forEach(child => addVisible(child.id));
      }
    };
    
    rootNodes.forEach(n => addVisible(n.id));
    setVisibleNodes(visible);
  }, [nodes]);

  const snapToGrid = useCallback((value: number) => {
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  }, []);

  const screenToSvg = useCallback((clientX: number, clientY: number) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left - offset.x) / scale,
      y: (clientY - rect.top - offset.y) / scale
    };
  }, [offset, scale]);

  const getNodeAtPosition = useCallback((x: number, y: number): MindMapNodeType | null => {
    for (const node of nodes) {
      if (!visibleNodes.has(node.id)) continue;
      const dx = x - node.x;
      const dy = y - node.y;
      if (Math.sqrt(dx * dx + dy * dy) <= NODE_RADIUS) {
        return node;
      }
    }
    return null;
  }, [nodes, visibleNodes]);

  const isOnNodeEdge = useCallback((x: number, y: number, node: MindMapNodeType) => {
    const dx = x - node.x;
    const dy = y - node.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance >= NODE_RADIUS - EDGE_HANDLE_SIZE && distance <= NODE_RADIUS + EDGE_HANDLE_SIZE;
  }, []);

  const getChildren = useCallback((nodeId: string) => {
    return nodes.filter(n => n.parentId === nodeId);
  }, [nodes]);

  const getAllDescendants = useCallback((nodeId: string): string[] => {
    const children = getChildren(nodeId);
    const descendants: string[] = [];
    children.forEach(child => {
      descendants.push(child.id);
      descendants.push(...getAllDescendants(child.id));
    });
    return descendants;
  }, [getChildren]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 2) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
      return;
    }

    const svgPos = screenToSvg(e.clientX, e.clientY);
    const nodeAtPos = getNodeAtPosition(svgPos.x, svgPos.y);

    if (nodeAtPos && isOnNodeEdge(svgPos.x, svgPos.y, nodeAtPos)) {
      e.stopPropagation();
      setIsCreatingEdge(true);
      setEdgeStartNodeId(nodeAtPos.id);
      setEdgeEndPos(svgPos);
      return;
    }

    if (nodeAtPos) {
      e.stopPropagation();
      setSelectedNodeId(nodeAtPos.id);
      setIsDraggingNode(true);
      setDragNodeId(nodeAtPos.id);
      setDragStart(svgPos);
      setDragNodeStartPos({ x: nodeAtPos.x, y: nodeAtPos.y });
      return;
    }

    setSelectedNodeId(null);
  }, [offset, screenToSvg, getNodeAtPosition, isOnNodeEdge, setSelectedNodeId]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
      return;
    }

    const svgPos = screenToSvg(e.clientX, e.clientY);

    if (isCreatingEdge) {
      setEdgeEndPos(svgPos);
      return;
    }

    if (isDraggingNode && dragNodeId) {
      const dx = svgPos.x - dragStart.x;
      const dy = svgPos.y - dragStart.y;
      
      const newX = snapToGrid(dragNodeStartPos.x + dx);
      const newY = snapToGrid(dragNodeStartPos.y + dy);

      setNodes(prev => {
        const node = prev.find(n => n.id === dragNodeId);
        if (!node) return prev;
        
        const offsetX = newX - node.x;
        const offsetY = newY - node.y;
        
        const descendants = getAllDescendants(dragNodeId);
        
        return prev.map(n => {
          if (n.id === dragNodeId) {
            return { ...n, x: newX, y: newY };
          }
          if (descendants.includes(n.id)) {
            return { ...n, x: n.x + offsetX, y: n.y + offsetY };
          }
          return n;
        });
      });
    }
  }, [isPanning, panStart, isCreatingEdge, isDraggingNode, dragNodeId, dragStart, dragNodeStartPos, screenToSvg, snapToGrid, setNodes, getAllDescendants]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (isCreatingEdge && edgeStartNodeId) {
      const svgPos = screenToSvg(e.clientX, e.clientY);
      const targetNode = getNodeAtPosition(svgPos.x, svgPos.y);
      
      if (!targetNode || targetNode.id === edgeStartNodeId) {
        const parentNode = nodes.find(n => n.id === edgeStartNodeId);
        if (parentNode) {
          const newNode: MindMapNodeType = {
            id: uuidv4(),
            text: '新节点',
            x: snapToGrid(svgPos.x),
            y: snapToGrid(svgPos.y),
            parentId: edgeStartNodeId,
            collapsed: false
          };
          setNodes(prev => {
            const updated = prev.map(n => 
              n.id === edgeStartNodeId ? { ...n, collapsed: false } : n
            );
            return [...updated, newNode];
          });
          setSelectedNodeId(newNode.id);
          setEditingNodeId(newNode.id);
          setEditingText('新节点');
        }
      }
      
      setIsCreatingEdge(false);
      setEdgeStartNodeId(null);
      return;
    }

    if (isDraggingNode) {
      setIsDraggingNode(false);
      setDragNodeId(null);
    }
  }, [isPanning, isCreatingEdge, isDraggingNode, edgeStartNodeId, screenToSvg, getNodeAtPosition, nodes, snapToGrid, setNodes, setSelectedNodeId]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newScale = Math.max(0.5, Math.min(2, scale + delta));
    
    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const scaleRatio = newScale / scale;
      const newOffsetX = mouseX - (mouseX - offset.x) * scaleRatio;
      const newOffsetY = mouseY - (mouseY - offset.y) * scaleRatio;
      
      setOffset({ x: newOffsetX, y: newOffsetY });
    }
    
    setScale(newScale);
  }, [scale, offset, setScale]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    const svgPos = screenToSvg(e.clientX, e.clientY);
    const node = getNodeAtPosition(svgPos.x, svgPos.y);
    
    if (node) {
      e.stopPropagation();
      setEditingNodeId(node.id);
      setEditingText(node.text);
    }
  }, [screenToSvg, getNodeAtPosition]);

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingText(e.target.value);
  }, []);

  const handleTextBlur = useCallback(() => {
    if (editingNodeId && editingText.trim()) {
      setNodes(prev => prev.map(n => 
        n.id === editingNodeId ? { ...n, text: editingText.trim() } : n
      ));
    }
    setEditingNodeId(null);
    setEditingText('');
  }, [editingNodeId, editingText, setNodes]);

  const handleTextKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTextBlur();
    } else if (e.key === 'Escape') {
      setEditingNodeId(null);
      setEditingText('');
    }
  }, [handleTextBlur]);

  const handleToggleCollapse = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const children = getChildren(nodeId);
    if (children.length === 0) return;

    setNodes(prev => prev.map(n => 
      n.id === nodeId ? { ...n, collapsed: !n.collapsed } : n
    ));

    if (node.collapsed) {
      const now = Date.now();
      const newAnimating = new Map(animatingNodes);
      children.forEach((child, index) => {
        newAnimating.set(child.id, { type: 'expand', startTime: now, delay: index * 50 });
      });
      setAnimatingNodes(newAnimating);
      
      setTimeout(() => {
        setAnimatingNodes(prev => {
          const updated = new Map(prev);
          children.forEach(child => updated.delete(child.id));
          return updated;
        });
      }, 400 + children.length * 50);
    }
  }, [nodes, getChildren, animatingNodes, setNodes]);

  const getBezierPath = useCallback((startX: number, startY: number, endX: number, endY: number) => {
    const dx = endX - startX;
    const dy = endY - startY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const curvature = Math.min(distance * 0.4, 80);
    
    const startAngle = Math.atan2(dy, dx);
    const endAngle = Math.atan2(-dy, -dx);
    
    const cp1x = startX + Math.cos(startAngle) * NODE_RADIUS + curvature * Math.cos(startAngle - Math.PI / 4);
    const cp1y = startY + Math.sin(startAngle) * NODE_RADIUS + curvature * Math.sin(startAngle - Math.PI / 4);
    const cp2x = endX + Math.cos(endAngle) * NODE_RADIUS + curvature * Math.cos(endAngle + Math.PI / 4);
    const cp2y = endY + Math.sin(endAngle) * NODE_RADIUS + curvature * Math.sin(endAngle + Math.PI / 4);
    
    const sx = startX + Math.cos(startAngle) * NODE_RADIUS;
    const sy = startY + Math.sin(startAngle) * NODE_RADIUS;
    const ex = endX + Math.cos(endAngle) * NODE_RADIUS;
    const ey = endY + Math.sin(endAngle) * NODE_RADIUS;
    
    return `M ${sx} ${sy} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${ex} ${ey}`;
  }, []);

  const renderEdges = () => {
    const edges: JSX.Element[] = [];
    
    nodes.forEach(node => {
      if (!node.parentId) return;
      if (!visibleNodes.has(node.id)) return;
      if (!visibleNodes.has(node.parentId)) return;
      
      const parentNode = nodes.find(n => n.id === node.parentId);
      if (!parentNode) return;
      
      const path = getBezierPath(parentNode.x, parentNode.y, node.x, node.y);
      
      const isAnimating = animatingNodes.has(node.id);
      const animState = animatingNodes.get(node.id);
      let opacity = 1;
      
      if (isAnimating && animState) {
        const elapsed = Date.now() - animState.startTime - animState.delay;
        if (animState.type === 'expand') {
          opacity = Math.max(0, Math.min(1, elapsed / 400));
        } else {
          opacity = Math.max(0, 1 - elapsed / 300);
        }
      }
      
      edges.push(
        <path
          key={`edge-${node.id}`}
          d={path}
          fill="none"
          stroke="#64748B"
          strokeWidth={2 / scale}
          style={{
            opacity,
            transition: 'opacity 0.3s ease-out'
          }}
        />
      );
    });
    
    return edges;
  };

  const renderNodes = () => {
    return nodes.map(node => {
      if (!visibleNodes.has(node.id)) return null;
      
      const isSelected = selectedNodeId === node.id;
      const isEditing = editingNodeId === node.id;
      const isDragging = isDraggingNode && dragNodeId === node.id;
      const children = getChildren(node.id);
      const hasChildren = children.length > 0;
      const isAnimating = animatingNodes.has(node.id);
      const animState = animatingNodes.get(node.id);
      
      let opacity = 1;
      let transform = '';
      
      if (isAnimating && animState) {
        const elapsed = Date.now() - animState.startTime - animState.delay;
        if (animState.type === 'expand') {
          const progress = Math.max(0, Math.min(1, elapsed / 400));
          opacity = progress;
          const parentNode = nodes.find(n => n.id === node.parentId);
          if (parentNode) {
            const dx = node.x - parentNode.x;
            const dy = node.y - parentNode.y;
            const offsetX = dx * (1 - progress);
            const offsetY = dy * (1 - progress);
            transform = `translate(${offsetX}px, ${offsetY}px)`;
          }
        } else {
          const progress = Math.max(0, Math.min(1, elapsed / 300));
          opacity = 1 - progress;
        }
      }
      
      return (
        <g
          key={node.id}
          style={{
            opacity,
            transform,
            transition: isDragging ? 'none' : 'opacity 0.3s ease-out',
            cursor: isDragging ? 'grabbing' : 'grab'
          }}
        >
          <circle
            cx={node.x}
            cy={node.y}
            r={NODE_RADIUS}
            fill="#3B82F6"
            stroke={isSelected ? '#60A5FA' : 'transparent'}
            strokeWidth={isSelected ? 3 : 0}
            style={{
              filter: isSelected ? 'drop-shadow(0 0 12px rgba(59, 130, 246, 0.5))' : 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3))',
              transition: 'all 0.2s ease',
              opacity: isDragging ? 0.7 : 1
            }}
          />
          
          {isEditing ? (
            <foreignObject
              x={node.x - NODE_RADIUS + 10}
              y={node.y - 15}
              width={NODE_RADIUS * 2 - 20}
              height={30}
            >
              <input
                type="text"
                value={editingText}
                onChange={handleTextChange}
                onBlur={handleTextBlur}
                onKeyDown={handleTextKeyDown}
                autoFocus
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  background: 'transparent',
                  color: '#F8FAFC',
                  fontSize: '14px',
                  textAlign: 'center',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
              />
            </foreignObject>
          ) : (
            <text
              x={node.x}
              y={node.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#F8FAFC"
              fontSize="14"
              fontWeight={500}
              style={{
                pointerEvents: 'none',
                userSelect: 'none',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {node.text.length > 10 ? node.text.slice(0, 10) + '...' : node.text}
            </text>
          )}
          
          {hasChildren && (
            <g
              onClick={(e) => {
                e.stopPropagation();
                handleToggleCollapse(node.id);
              }}
              style={{ cursor: 'pointer' }}
            >
              <circle
                cx={node.x - NODE_RADIUS}
                cy={node.y}
                r={12}
                fill="#1E293B"
                stroke="#64748B"
                strokeWidth={1.5}
                style={{ transition: 'all 0.2s ease' }}
              />
              <text
                x={node.x - NODE_RADIUS}
                y={node.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#94A3B8"
                fontSize="16"
                fontWeight="bold"
                style={{ pointerEvents: 'none' }}
              >
                {node.collapsed ? '+' : '−'}
              </text>
            </g>
          )}
        </g>
      );
    });
  };

  const renderGrid = () => {
    const lines: JSX.Element[] = [];
    const width = 3000;
    const height = 2000;
    
    for (let x = -width / 2; x <= width / 2; x += GRID_SIZE) {
      lines.push(
        <line
          key={`v-${x}`}
          x1={x}
          y1={-height / 2}
          x2={x}
          y2={height / 2}
          stroke="#1E293B"
          strokeWidth={0.5}
        />
      );
    }
    
    for (let y = -height / 2; y <= height / 2; y += GRID_SIZE) {
      lines.push(
        <line
          key={`h-${y}`}
          x1={-width / 2}
          y1={y}
          x2={width / 2}
          y2={y}
          stroke="#1E293B"
          strokeWidth={0.5}
        />
      );
    }
    
    return lines;
  };

  const renderCreatingEdge = () => {
    if (!isCreatingEdge || !edgeStartNodeId) return null;
    
    const startNode = nodes.find(n => n.id === edgeStartNodeId);
    if (!startNode) return null;
    
    const path = getBezierPath(startNode.x, startNode.y, edgeEndPos.x, edgeEndPos.y);
    
    return (
      <path
        d={path}
        fill="none"
        stroke="#3B82F6"
        strokeWidth={2 / scale}
        strokeDasharray="6 4"
        style={{ pointerEvents: 'none' }}
      />
    );
  };

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        backgroundColor: '#0F172A',
        position: 'relative',
        overflow: 'hidden'
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
        style={{
          cursor: isPanning ? 'grabbing' : 'default',
          display: 'block'
        }}
      >
        <defs>
          <pattern id="grid" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse">
            <path d={`M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`} fill="none" stroke="#1E293B" strokeWidth="0.5" />
          </pattern>
        </defs>
        
        <g transform={`translate(${offset.x}, ${offset.y}) scale(${scale})`}>
          <rect x={-5000} y={-5000} width={10000} height={10000} fill="url(#grid)" />
          
          {renderEdges()}
          
          {renderCreatingEdge()}
          
          {renderNodes()}
        </g>
      </svg>
    </div>
  );
};

export default MindMap;
