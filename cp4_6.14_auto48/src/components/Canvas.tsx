import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useDebateStore } from '@/store/debateStore';
import {
  DebateNode,
  DebateEdge,
  NODE_COLORS,
  EDGE_COLORS,
} from '@/types';
import { Plus, Save, Trash2 } from 'lucide-react';
import axios from 'axios';

const NODE_HEIGHT = 50;
const NODE_RX = 8;
const MIN_NODE_WIDTH = 120;
const CHAR_WIDTH = 14;
const NODE_PADDING = 40;
const HANDLE_RADIUS = 5;
const HANDLE_GAP = 5;
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 2.0;
const ZOOM_SENSITIVITY = 0.001;

function getNodeWidth(title: string): number {
  return Math.max(MIN_NODE_WIDTH, title.length * CHAR_WIDTH + NODE_PADDING);
}

function getNodeCenter(node: DebateNode): { cx: number; cy: number } {
  const w = getNodeWidth(node.title);
  return { cx: node.x + w / 2, cy: node.y + NODE_HEIGHT / 2 };
}

export default function Canvas() {
  const {
    nodes,
    edges,
    selectedNodeId,
    selectNode,
    moveNode,
    openModal,
    addEdge,
    deleteNode,
    clearCanvas,
  } = useDebateStore();

  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    nodeId: string;
  } | null>(null);
  const [edgeTypePopup, setEdgeTypePopup] = useState<{
    x: number;
    y: number;
    sourceId: string;
    targetId: string;
  } | null>(null);
  const [tempLine, setTempLine] = useState<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const panStartRef = useRef({ x: 0, y: 0 });
  const panOffsetRef = useRef({ x: 0, y: 0 });
  const dragNodeIdRef = useRef<string | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const connectSourceRef = useRef<string | null>(null);
  const connectSourcePosRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);
  const spaceHeldRef = useRef(false);
  const isPanningRef = useRef(false);
  const isDraggingRef = useRef(false);
  const isConnectingRef = useRef(false);
  const newNodeIdsRef = useRef<Set<string>>(new Set());
  const prevNodeIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);
  useEffect(() => {
    panRef.current = pan;
  }, [pan]);
  useEffect(() => {
    spaceHeldRef.current = spaceHeld;
  }, [spaceHeld]);
  useEffect(() => {
    isPanningRef.current = isPanning;
  }, [isPanning]);
  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);
  useEffect(() => {
    isConnectingRef.current = isConnecting;
  }, [isConnecting]);

  useEffect(() => {
    const currentIds = new Set(nodes.map((n) => n.id));
    const newIds = new Set<string>();
    for (const id of currentIds) {
      if (!prevNodeIdsRef.current.has(id)) {
        newIds.add(id);
      }
    }
    if (newIds.size > 0) {
      newNodeIdsRef.current = newIds;
      const timer = setTimeout(() => {
        newNodeIdsRef.current = new Set();
      }, 500);
      return () => clearTimeout(timer);
    }
    prevNodeIdsRef.current = currentIds;
  }, [nodes]);

  const getContainerRect = useCallback(() => {
    return containerRef.current?.getBoundingClientRect() ?? new DOMRect();
  }, []);

  const screenToWorld = useCallback(
    (screenX: number, screenY: number) => {
      const rect = getContainerRect();
      return {
        x: (screenX - rect.left - panRef.current.x) / zoomRef.current,
        y: (screenY - rect.top - panRef.current.y) / zoomRef.current,
      };
    },
    [getContainerRect]
  );

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.code === 'Space') {
      e.preventDefault();
      setSpaceHeld(true);
    }
  }, []);

  const handleKeyUp = useCallback((e: React.KeyboardEvent) => {
    if (e.code === 'Space') {
      setSpaceHeld(false);
    }
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      if (spaceHeldRef.current) {
        setIsPanning(true);
        panStartRef.current = { x: e.clientX, y: e.clientY };
        panOffsetRef.current = { ...panRef.current };
        return;
      }
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanningRef.current) {
        const dx = e.clientX - panStartRef.current.x;
        const dy = e.clientY - panStartRef.current.y;
        setPan({
          x: panOffsetRef.current.x + dx,
          y: panOffsetRef.current.y + dy,
        });
        return;
      }

      if (isDraggingRef.current && dragNodeIdRef.current) {
        const world = screenToWorld(e.clientX, e.clientY);
        moveNode(
          dragNodeIdRef.current,
          world.x - dragOffsetRef.current.x,
          world.y - dragOffsetRef.current.y
        );
        return;
      }

      if (isConnectingRef.current && connectSourceRef.current) {
        const world = screenToWorld(e.clientX, e.clientY);
        setTempLine({
          x1: connectSourcePosRef.current.x,
          y1: connectSourcePosRef.current.y,
          x2: world.x,
          y2: world.y,
        });
      }
    },
    [screenToWorld, moveNode]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (isPanningRef.current) {
        setIsPanning(false);
        return;
      }

      if (isDraggingRef.current) {
        setIsDragging(false);
        dragNodeIdRef.current = null;
        return;
      }

      if (isConnectingRef.current && connectSourceRef.current) {
        const world = screenToWorld(e.clientX, e.clientY);
        let targetNode: DebateNode | null = null;
        for (const node of nodes) {
          const w = getNodeWidth(node.title);
          if (
            world.x >= node.x &&
            world.x <= node.x + w &&
            world.y >= node.y &&
            world.y <= node.y + NODE_HEIGHT
          ) {
            targetNode = node;
            break;
          }
        }

        if (targetNode && targetNode.id !== connectSourceRef.current) {
          const rect = getContainerRect();
          const w = getNodeWidth(targetNode.title);
          setEdgeTypePopup({
            x: targetNode.x * zoomRef.current + panRef.current.x + rect.left + w * zoomRef.current / 2,
            y: targetNode.y * zoomRef.current + panRef.current.y + rect.top + (NODE_HEIGHT + 20) * zoomRef.current,
            sourceId: connectSourceRef.current,
            targetId: targetNode.id,
          });
        }

        setIsConnecting(false);
        connectSourceRef.current = null;
        setTempLine(null);
      }
    },
    [screenToWorld, nodes, getContainerRect]
  );

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const rect = getContainerRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const worldX = (mouseX - panRef.current.x) / zoomRef.current;
    const worldY = (mouseY - panRef.current.y) / zoomRef.current;

    const delta = -e.deltaY * ZOOM_SENSITIVITY;
    const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoomRef.current * (1 + delta)));

    const newPanX = mouseX - worldX * newZoom;
    const newPanY = mouseY - worldY * newZoom;

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  }, [getContainerRect]);

  const handleNodeMouseDown = useCallback(
    (e: React.MouseEvent, node: DebateNode) => {
      e.stopPropagation();
      if (e.button !== 0) return;
      if (spaceHeldRef.current) return;

      selectNode(node.id);
      setIsDragging(true);
      dragNodeIdRef.current = node.id;
      const world = screenToWorld(e.clientX, e.clientY);
      dragOffsetRef.current = {
        x: world.x - node.x,
        y: world.y - node.y,
      };
    },
    [selectNode, screenToWorld]
  );

  const handleHandleMouseDown = useCallback(
    (e: React.MouseEvent, node: DebateNode) => {
      e.stopPropagation();
      if (e.button !== 0) return;
      if (spaceHeldRef.current) return;

      setIsConnecting(true);
      connectSourceRef.current = node.id;
      const center = getNodeCenter(node);
      connectSourcePosRef.current = { x: center.cx, y: center.cy };
    },
    []
  );

  const handleNodeContextMenu = useCallback(
    (e: React.MouseEvent, node: DebateNode) => {
      e.preventDefault();
      e.stopPropagation();
      selectNode(node.id);
      setContextMenu({ x: e.clientX, y: e.clientY, nodeId: node.id });
    },
    [selectNode]
  );

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (edgeTypePopup) {
        setEdgeTypePopup(null);
        return;
      }
      if (contextMenu) {
        setContextMenu(null);
        return;
      }
      selectNode(null);
    },
    [edgeTypePopup, contextMenu, selectNode]
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (spaceHeldRef.current) return;
      const world = screenToWorld(e.clientX, e.clientY);
      openModal(undefined, { x: world.x, y: world.y });
    },
    [screenToWorld, openModal]
  );

  const handleEdgeTypeSelect = useCallback(
    (type: 'support' | 'refute') => {
      if (edgeTypePopup) {
        addEdge(edgeTypePopup.sourceId, edgeTypePopup.targetId, type);
        setEdgeTypePopup(null);
      }
    },
    [edgeTypePopup, addEdge]
  );

  const handleSave = useCallback(async () => {
    const state = useDebateStore.getState();
    await axios.post('/api/layout', {
      nodes: state.nodes,
      edges: state.edges,
    });
  }, []);

  const handleClear = useCallback(() => {
    if (window.confirm('确定要清空画布吗？')) {
      clearCanvas();
    }
  }, [clearCanvas]);

  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu) setContextMenu(null);
      if (edgeTypePopup) setEdgeTypePopup(null);
    };
    if (contextMenu || edgeTypePopup) {
      window.addEventListener('mousedown', handleClickOutside, true);
      return () =>
        window.removeEventListener('mousedown', handleClickOutside, true);
    }
  }, [contextMenu, edgeTypePopup]);

  const gridSize = 30 * zoom;
  const gridStyle: React.CSSProperties = {
    backgroundImage: `
      linear-gradient(to right, #e2e8f0 0.5px, transparent 0.5px),
      linear-gradient(to bottom, #e2e8f0 0.5px, transparent 0.5px)
    `,
    backgroundSize: `${gridSize}px ${gridSize}px`,
    backgroundPosition: `${pan.x}px ${pan.y}px`,
  };

  const contextNode = contextMenu
    ? nodes.find((n) => n.id === contextMenu.nodeId)
    : null;

  return (
    <div
      ref={containerRef}
      className={`canvas-container${spaceHeld ? ' panning' : ''}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onClick={handleCanvasClick}
      onDoubleClick={handleDoubleClick}
    >
      <div className="canvas-grid" style={gridStyle} />

      <svg
        style={{ userSelect: 'none', position: 'absolute', inset: 0 }}
        width="100%"
        height="100%"
      >
        <defs>
          <marker
            id="arrow-support"
            markerWidth="10"
            markerHeight="7"
            refX="10"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill={EDGE_COLORS.support}
            />
          </marker>
          <marker
            id="arrow-refute"
            markerWidth="10"
            markerHeight="7"
            refX="10"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill={EDGE_COLORS.refute} />
          </marker>
        </defs>

        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {edges.map((edge) => {
            const source = nodes.find((n) => n.id === edge.sourceId);
            const target = nodes.find((n) => n.id === edge.targetId);
            if (!source || !target) return null;
            const sc = getNodeCenter(source);
            const tc = getNodeCenter(target);
            return (
              <line
                key={edge.id}
                x1={sc.cx}
                y1={sc.cy}
                x2={tc.cx}
                y2={tc.cy}
                stroke={EDGE_COLORS[edge.type]}
                strokeWidth={2}
                markerEnd={`url(#arrow-${edge.type})`}
              />
            );
          })}

          {nodes.map((node) => {
            const w = getNodeWidth(node.title);
            const isSelected = selectedNodeId === node.id;
            const isNew = newNodeIdsRef.current.has(node.id);
            const center = getNodeCenter(node);
            return (
              <g
                key={node.id}
                className={isNew ? 'node-enter' : undefined}
                onContextMenu={(e) => handleNodeContextMenu(e, node)}
              >
                <rect
                  x={node.x}
                  y={node.y}
                  width={w}
                  height={NODE_HEIGHT}
                  rx={NODE_RX}
                  fill={NODE_COLORS[node.type]}
                  stroke={isSelected ? '#ffffff' : 'none'}
                  strokeWidth={isSelected ? 2 : 0}
                  onMouseDown={(e) => handleNodeMouseDown(e, node)}
                  style={{ cursor: spaceHeld ? undefined : 'move' }}
                />
                <text
                  x={center.cx}
                  y={center.cy}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#ffffff"
                  fontSize={13}
                  style={{ pointerEvents: 'none' }}
                >
                  {node.title}
                </text>
                <circle
                  cx={center.cx}
                  cy={node.y + NODE_HEIGHT + HANDLE_GAP}
                  r={HANDLE_RADIUS}
                  fill="#ffffff"
                  stroke={NODE_COLORS[node.type]}
                  strokeWidth={2}
                  onMouseDown={(e) => handleHandleMouseDown(e, node)}
                  style={{ cursor: 'crosshair' }}
                />
              </g>
            );
          })}

          {tempLine && (
            <line
              x1={tempLine.x1}
              y1={tempLine.y1}
              x2={tempLine.x2}
              y2={tempLine.y2}
              stroke="#64748b"
              strokeWidth={2}
              strokeDasharray="6 3"
            />
          )}
        </g>
      </svg>

      <div
        style={{
          position: 'absolute',
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'white',
          borderRadius: 12,
          boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
          display: 'flex',
          gap: 4,
          padding: '6px 8px',
          zIndex: 50,
        }}
      >
        <button className="toolbar-btn" onClick={() => openModal()}>
          <Plus size={16} />
          添加论点
        </button>
        <button className="toolbar-btn" onClick={handleSave}>
          <Save size={16} />
          保存布局
        </button>
        <button className="toolbar-btn" onClick={handleClear}>
          <Trash2 size={16} />
          清空画布
        </button>
      </div>

      {contextMenu && contextNode && (
        <div
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            background: 'white',
            borderRadius: 8,
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            padding: 4,
            zIndex: 200,
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            style={{
              display: 'block',
              width: '100%',
              padding: '8px 16px',
              border: 'none',
              background: 'transparent',
              textAlign: 'left',
              cursor: 'pointer',
              borderRadius: 6,
              fontSize: 13,
              fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.background = '#f1f5f9';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.background = 'transparent';
            }}
            onClick={() => {
              openModal(contextNode);
              setContextMenu(null);
            }}
          >
            编辑
          </button>
          <button
            style={{
              display: 'block',
              width: '100%',
              padding: '8px 16px',
              border: 'none',
              background: 'transparent',
              textAlign: 'left',
              cursor: 'pointer',
              borderRadius: 6,
              fontSize: 13,
              color: '#ef4444',
              fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.background = '#fef2f2';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.background = 'transparent';
            }}
            onClick={() => {
              deleteNode(contextMenu.nodeId);
              selectNode(null);
              setContextMenu(null);
            }}
          >
            删除
          </button>
        </div>
      )}

      {edgeTypePopup && (
        <div
          className="edge-type-popup"
          style={{
            position: 'fixed',
            left: edgeTypePopup.x,
            top: edgeTypePopup.y,
            transform: 'translate(-50%, -100%)',
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            className="edge-type-btn"
            style={{ background: '#22c55e', color: 'white' }}
            onClick={() => handleEdgeTypeSelect('support')}
          >
            支持
          </button>
          <button
            className="edge-type-btn"
            style={{ background: '#ef4444', color: 'white' }}
            onClick={() => handleEdgeTypeSelect('refute')}
          >
            反驳
          </button>
        </div>
      )}
    </div>
  );
}
