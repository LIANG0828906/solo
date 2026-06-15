import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useGraph, GraphNode, GraphLink, COLOR_MAP, NodeColor } from '@/context/GraphContext';
import { useForceLayout } from '@/hooks/useForceLayout';

const NODE_GRADIENT_MAP: Record<NodeColor, [string, string]> = {
  red: ['#ff6b6b', '#ee5a5a'],
  blue: ['#4ecdc4', '#44a08d'],
  green: ['#95e1a3', '#6bcf7f'],
  orange: ['#ffa94d', '#ff922b'],
};

interface Triangle {
  id: string;
  a: string;
  b: string;
  c: string;
}

function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : { r: 129, g: 140, b: 248 };
}

function mixColors(color1: string, color2: string, ratio: number = 0.5): string {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  const r = Math.round(c1.r * (1 - ratio) + c2.r * ratio);
  const g = Math.round(c1.g * (1 - ratio) + c2.g * ratio);
  const b = Math.round(c1.b * (1 - ratio) + c2.b * ratio);
  return `rgb(${r}, ${g}, ${b})`;
}

const GraphCanvas: React.FC = () => {
  const {
    nodes,
    links,
    clusters,
    selectedNodeId,
    connectingFromId,
    selectNode,
    startConnecting,
    cancelConnecting,
    addLink,
    updateNode,
    deleteNode,
  } = useGraph();

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ width: 800, height: 600 });
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 800, height: 600 });
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [editingNode, setEditingNode] = useState<GraphNode | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [cameraAnimating, setCameraAnimating] = useState(false);
  const [originPos, setOriginPos] = useState({ x: 0, y: 0 });
  const [editAnim, setEditAnim] = useState({
    visible: false,
    scale: 0,
    offsetX: 0,
    offsetY: 0,
  });

  const trianglesCacheRef = useRef<Triangle[]>([]);
  const prevNodeIdsRef = useRef<Set<string>>(new Set());
  const prevLinkIdsRef = useRef<Set<string>>(new Set());
  const prevNodePositionsRef = useRef<string>('');
  const adjacencyMapRef = useRef<Record<string, Set<string>>>({});
  const draggingNodeIdRef = useRef<string | null>(null);

  const { getNodePosition, dragStart, drag, dragEnd } = useForceLayout(nodes, links, size.width, size.height);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setSize({ width: rect.width, height: rect.height });
        setViewBox({ x: 0, y: 0, width: rect.width, height: rect.height });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const currentNodeIds = useMemo(() => {
    return new Set(nodes.map(n => n.id));
  }, [nodes]);

  const currentLinkIds = useMemo(() => {
    return new Set(links.map(l => l.id));
  }, [links]);

  const nodePositionHash = useMemo(() => {
    return nodes
      .map(n => `${n.id}:${n.x ?? 0},${n.y ?? 0}`)
      .sort()
      .join('|');
  }, [nodes]);

  const triangles = useMemo<Triangle[]>(() => {
    const nodeIdsChanged =
      currentNodeIds.size !== prevNodeIdsRef.current.size ||
      [...currentNodeIds].some(id => !prevNodeIdsRef.current.has(id));

    const linkIdsChanged =
      currentLinkIds.size !== prevLinkIdsRef.current.size ||
      [...currentLinkIds].some(id => !prevLinkIdsRef.current.has(id));

    if (!nodeIdsChanged && !linkIdsChanged) {
      prevNodePositionsRef.current = nodePositionHash;
      return trianglesCacheRef.current;
    }

    const map: Record<string, Set<string>> = {};
    nodes.forEach(n => { map[n.id] = new Set(); });
    links.forEach(l => {
      map[l.source]?.add(l.target);
      map[l.target]?.add(l.source);
    });
    adjacencyMapRef.current = map;

    const result: Triangle[] = [];
    const n = nodes.length;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        for (let k = j + 1; k < n; k++) {
          const a = nodes[i].id;
          const b = nodes[j].id;
          const c = nodes[k].id;
          const ab = map[a]?.has(b);
          const ac = map[a]?.has(c);
          const bc = map[b]?.has(c);
          if (ab && ac && bc) {
            result.push({ id: `tri-${a}-${b}-${c}`, a, b, c });
          }
        }
      }
    }

    trianglesCacheRef.current = result;
    prevNodeIdsRef.current = new Set(currentNodeIds);
    prevLinkIdsRef.current = new Set(currentLinkIds);
    prevNodePositionsRef.current = nodePositionHash;

    return result;
  }, [currentNodeIds, currentLinkIds, nodes, links, nodePositionHash]);

  const screenToSvg = useCallback((clientX: number, clientY: number) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const pt = svgRef.current.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svgRef.current.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const svgPt = pt.matrixTransform(ctm.inverse());
    return { x: svgPt.x, y: svgPt.y };
  }, []);

  const handleNodeMouseDown = (e: React.MouseEvent, node: GraphNode) => {
    e.preventDefault();
    e.stopPropagation();
    const svgCoords = screenToSvg(e.clientX, e.clientY);
    draggingNodeIdRef.current = node.id;
    dragStart({ x: svgCoords.x, y: svgCoords.y, dx: 0, dy: 0 }, node.id);
    setDraggingNodeId(node.id);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingNodeIdRef.current) return;
      const svgCoords = screenToSvg(e.clientX, e.clientY);
      drag({ x: svgCoords.x, y: svgCoords.y, dx: 0, dy: 0 }, draggingNodeIdRef.current);
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!draggingNodeIdRef.current) return;
      const svgCoords = screenToSvg(e.clientX, e.clientY);
      const nodeId = draggingNodeIdRef.current;
      draggingNodeIdRef.current = null;
      dragEnd({ x: svgCoords.x, y: svgCoords.y, dx: 0, dy: 0 }, nodeId);
      setDraggingNodeId(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [drag, dragEnd, screenToSvg]);

  const handleNodeClick = (e: React.MouseEvent, node: GraphNode) => {
    e.stopPropagation();
    if (e.ctrlKey || e.metaKey) {
      if (connectingFromId === null) {
        startConnecting(node.id);
      } else if (connectingFromId !== node.id) {
        addLink(connectingFromId, node.id);
        animateCameraToNodes(connectingFromId, node.id);
      } else {
        cancelConnecting();
      }
    } else {
      if (draggingNodeId === null) {
        const rect = e.currentTarget.getBoundingClientRect();
        const nodeCenterX = rect.left + rect.width / 2;
        const nodeCenterY = rect.top + rect.height / 2;
        const windowCenterX = window.innerWidth / 2;
        const windowCenterY = window.innerHeight / 2;
        setOriginPos({ x: nodeCenterX, y: nodeCenterY });
        setEditingNode(node);
        setEditAnim({
          visible: true,
          scale: 0,
          offsetX: nodeCenterX - windowCenterX,
          offsetY: nodeCenterY - windowCenterY,
        });
        requestAnimationFrame(() => {
          setEditAnim({
            visible: true,
            scale: 1,
            offsetX: 0,
            offsetY: 0,
          });
        });
        selectNode(node.id);
      }
    }
  };

  const animateCameraToNodes = (id1: string, id2: string) => {
    const [x1, y1] = getNodePosition(id1);
    const [x2, y2] = getNodePosition(id2);
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;
    const targetX = cx - size.width / 2;
    const targetY = cy - size.height / 2;

    setCameraAnimating(true);
    const startX = viewBox.x;
    const startY = viewBox.y;
    const duration = 500;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setViewBox({
        x: startX + (targetX - startX) * eased,
        y: startY + (targetY - startY) * eased,
        width: size.width,
        height: size.height,
      });
      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        setCameraAnimating(false);
      }
    };
    requestAnimationFrame(animate);
  };

  const handleNodeMouseEnter = (e: React.MouseEvent, node: GraphNode) => {
    setHoveredNodeId(node.id);
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };

  const handleNodeMouseMove = (e: React.MouseEvent) => {
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };

  const handleNodeMouseLeave = () => {
    setHoveredNodeId(null);
  };

  const handleSvgClick = () => {
    selectNode(null);
    cancelConnecting();
  };

  const closeEditPanel = () => {
    const windowCenterX = window.innerWidth / 2;
    const windowCenterY = window.innerHeight / 2;
    setEditAnim({
      visible: true,
      scale: 0,
      offsetX: originPos.x - windowCenterX,
      offsetY: originPos.y - windowCenterY,
    });
    setTimeout(() => {
      setEditingNode(null);
      setEditAnim({
        visible: false,
        scale: 0,
        offsetX: 0,
        offsetY: 0,
      });
    }, 300);
  };

  const handleEditSave = () => {
    closeEditPanel();
  };

  const hoveredNode = hoveredNodeId ? nodes.find(n => n.id === hoveredNodeId) : null;
  const newNodeIds = useMemo(() => {
    const cutoff = Date.now() - 2000;
    return new Set(nodes.filter(n => n.createdAt > cutoff).map(n => n.id));
  }, [nodes]);

  const getNodeColorPair = (color: NodeColor) => NODE_GRADIENT_MAP[color] || NODE_GRADIENT_MAP.blue;

  const renderClusterRings = () => {
    return clusters.map((cluster, idx) => {
      const clusterNodes = cluster.nodeIds
        .map(id => nodes.find(n => n.id === id))
        .filter(Boolean) as GraphNode[];
      if (clusterNodes.length < 2) return null;

      const positions = clusterNodes.map(n => getNodePosition(n.id));
      const xs = positions.map(p => p[0]);
      const ys = positions.map(p => p[1]);
      const cx = xs.reduce((a, b) => a + b, 0) / xs.length;
      const cy = ys.reduce((a, b) => a + b, 0) / ys.length;
      const maxDist = Math.max(
        ...positions.map(p => Math.sqrt((p[0] - cx) ** 2 + (p[1] - cy) ** 2))
      );
      const r = maxDist + 40;

      const hue = (idx * 60) % 360;

      return (
        <circle
          key={cluster.id}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={`hsla(${hue}, 70%, 60%, 0.5)`}
          strokeWidth={1.5}
          strokeDasharray="8 6"
          style={{
            animation: `clusterBreath 3s ease-in-out ${idx * 0.5}s infinite`,
            transformOrigin: `${cx}px ${cy}px`,
          }}
        />
      );
    });
  };

  const renderTriangles = () => {
    return triangles.map(tri => {
      const [ax, ay] = getNodePosition(tri.a);
      const [bx, by] = getNodePosition(tri.b);
      const [cx, cy] = getNodePosition(tri.c);
      return (
        <polygon
          key={tri.id}
          points={`${ax},${ay} ${bx},${by} ${cx},${cy}`}
          fill="rgba(255,255,255,0.05)"
          stroke="none"
        />
      );
    });
  };

  const renderLinks = () => {
    return links.map((link, idx) => {
      const sourceNode = nodes.find(n => n.id === link.source);
      const targetNode = nodes.find(n => n.id === link.target);
      if (!sourceNode || !targetNode) return null;

      const [sx, sy] = getNodePosition(link.source);
      const [tx, ty] = getNodePosition(link.target);
      const color1 = COLOR_MAP[sourceNode.color];
      const color2 = COLOR_MAP[targetNode.color];
      const midColor = mixColors(color1, color2);
      const gradId = `grad-${link.id}`;
      const dotId = `flowdot-${link.id}`;

      const dx = tx - sx;
      const dy = ty - sy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const normX = dx / (dist || 1);
      const normY = dy / (dist || 1);
      const offX = -normY * 20;
      const offY = normX * 20;
      const cx1 = sx + dx * 0.3 + offX;
      const cy1 = sy + dy * 0.3 + offY;
      const cx2 = sx + dx * 0.7 + offX;
      const cy2 = sy + dy * 0.7 + offY;
      const pathD = `M ${sx} ${sy} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${tx} ${ty}`;

      return (
        <g key={link.id}>
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={color1} />
              <stop offset="50%" stopColor={midColor} />
              <stop offset="100%" stopColor={color2} />
            </linearGradient>
            <path id={`path-${link.id}`} d={pathD} fill="none" />
          </defs>
          <path
            d={pathD}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth={2}
            opacity={0.6}
            strokeDasharray="6 4"
            style={{
              animation: `dashFlow 1.5s linear infinite`,
            }}
          />
          <circle r={3} fill={midColor} opacity={0.9}>
            <animateMotion
              dur={`${1.5 + idx * 0.2}s`}
              repeatCount="indefinite"
              rotate="auto"
            >
              <mpath href={`#path-${link.id}`} />
            </animateMotion>
          </circle>
        </g>
      );
    });
  };

  const renderNodes = () => {
    return nodes.map(node => {
      const [x, y] = getNodePosition(node.id);
      const [c1, c2] = getNodeColorPair(node.color);
      const gradId = `nodegrad-${node.id}`;
      const isHovered = hoveredNodeId === node.id;
      const isSelected = selectedNodeId === node.id;
      const isConnecting = connectingFromId === node.id;
      const isNew = newNodeIds.has(node.id);
      const isDragging = draggingNodeId === node.id;

      return (
        <g
          key={node.id}
          style={{
            cursor: draggingNodeId === node.id ? 'grabbing' : 'grab',
            transform: `translate(${x}px, ${y}px)`,
            transition: draggingNodeId === node.id ? 'none' : 'transform 0.2s ease',
          }}
          onMouseDown={(e) => handleNodeMouseDown(e, node)}
          onClick={(e) => handleNodeClick(e, node)}
          onMouseEnter={(e) => handleNodeMouseEnter(e, node)}
          onMouseMove={(e) => handleNodeMouseMove(e)}
          onMouseLeave={handleNodeMouseLeave}
        >
          <defs>
            <radialGradient id={gradId} cx="30%" cy="30%" r="70%">
              <stop offset="0%" stopColor={c1} />
              <stop offset="100%" stopColor={c2} />
            </radialGradient>
            <filter id={`shadow-${node.id}`} x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="rgba(0,0,0,0.3)" />
            </filter>
          </defs>
          <circle
            r={isHovered || isConnecting || isDragging ? 27 : 24}
            fill={`url(#${gradId})`}
            filter={`url(#shadow-${node.id})`}
            stroke={isConnecting ? '#ffffff' : 'rgba(255,255,255,0.2)'}
            strokeWidth={isConnecting ? 3 : (isSelected ? 2 : 1)}
            style={{
              transform: isDragging ? 'scale(1.15)' : (isHovered ? 'scale(1.1)' : 'scale(1)'),
              transformOrigin: 'center',
              transition: isDragging ? 'none' : 'all 0.2s ease',
              animation: isNew ? 'nodeFadeIn 800ms ease-out forwards' : undefined,
              opacity: isNew ? 0 : 1,
            }}
          />
          <text
            y={45}
            textAnchor="middle"
            fill="#ffffff"
            fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif"
            fontSize={12}
            fontWeight={500}
            pointerEvents="none"
            style={{
              textShadow: '0 1px 3px rgba(0,0,0,0.5)',
              userSelect: 'none',
              maxWidth: 100,
            }}
          >
            {node.title.length > 12 ? node.title.slice(0, 12) + '...' : node.title}
          </text>
        </g>
      );
    });
  };

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        backgroundColor: '#0d1117',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <svg
        ref={svgRef}
        width={size.width}
        height={size.height}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        style={{ display: 'block' }}
        onClick={handleSvgClick}
      >
        <style>{`
          @keyframes clusterBreath {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.6; }
          }
          @keyframes dashFlow {
            from { stroke-dashoffset: 0; }
            to { stroke-dashoffset: -20; }
          }
          @keyframes nodeFadeIn {
            from { opacity: 0; transform: scale(0.5); }
            to { opacity: 1; transform: scale(1); }
          }
          @keyframes editPanelIn {
            from { opacity: 0; transform: scale(0.8); }
            to { opacity: 1; transform: scale(1); }
          }
        `}</style>
        {renderClusterRings()}
        {renderTriangles()}
        {renderLinks()}
        {renderNodes()}
      </svg>

      {hoveredNode && (
        <div
          style={{
            position: 'fixed',
            left: tooltipPos.x,
            top: tooltipPos.y - 70,
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(22, 27, 34, 0.95)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            padding: '10px 14px',
            color: '#ffffff',
            fontFamily: 'Inter, sans-serif',
            fontSize: 12,
            pointerEvents: 'none',
            zIndex: 1000,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            whiteSpace: 'nowrap',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 13 }}>{hoveredNode.title}</div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>
            创建于 {formatDate(hoveredNode.createdAt)}
          </div>
        </div>
      )}

      {editingNode && editAnim.visible && (
        <div
          style={{
            position: 'fixed',
            left: '50%',
            top: '50%',
            transform: `translate(calc(-50% + ${editAnim.offsetX}px), calc(-50% + ${editAnim.offsetY}px)) scale(${editAnim.scale})`,
            transformOrigin: 'center center',
            transition: 'transform 300ms cubic-bezier(0.68, -0.55, 0.265, 1.55), opacity 200ms ease',
            opacity: editAnim.scale,
            zIndex: 9999,
            backgroundColor: '#161b22',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            padding: 24,
            width: 380,
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            fontFamily: 'Inter, sans-serif',
            color: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>编辑节点</h3>
            <button
              onClick={closeEditPanel}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255,255,255,0.6)',
                fontSize: 20,
                cursor: 'pointer',
                padding: 4,
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>标题</label>
            <input
              type="text"
              value={editingNode.title}
              onChange={(e) => updateNode(editingNode.id, { title: e.target.value })}
              style={{
                width: '100%',
                backgroundColor: '#0d1117',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6,
                padding: '10px 12px',
                color: '#ffffff',
                fontSize: 13,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>关联描述</label>
            <textarea
              value={editingNode.description}
              onChange={(e) => updateNode(editingNode.id, { description: e.target.value })}
              rows={3}
              style={{
                width: '100%',
                backgroundColor: '#0d1117',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6,
                padding: '10px 12px',
                color: '#ffffff',
                fontSize: 13,
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>颜色标签</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {(['red', 'blue', 'green', 'orange'] as NodeColor[]).map(color => {
                const [c1] = getNodeColorPair(color);
                return (
                  <button
                    key={color}
                    onClick={() => updateNode(editingNode.id, { color })}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      backgroundColor: c1,
                      border: editingNode.color === color ? '2px solid #ffffff' : '2px solid transparent',
                      cursor: 'pointer',
                      padding: 0,
                      transition: 'transform 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  />
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => {
                deleteNode(editingNode.id);
                closeEditPanel();
              }}
              style={{
                flex: 1,
                padding: '10px 16px',
                backgroundColor: 'rgba(255,107,107,0.15)',
                border: '1px solid rgba(255,107,107,0.3)',
                color: '#ff6b6b',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,107,107,0.25)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,107,107,0.15)')}
            >
              删除节点
            </button>
            <button
              onClick={handleEditSave}
              style={{
                flex: 1,
                padding: '10px 16px',
                backgroundColor: '#6366f1',
                border: 'none',
                color: '#ffffff',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#4f46e5')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#6366f1')}
            >
              保存
            </button>
          </div>
        </div>
      )}

      {connectingFromId && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(99, 102, 241, 0.95)',
            color: '#ffffff',
            padding: '10px 20px',
            borderRadius: 8,
            fontFamily: 'Inter, sans-serif',
            fontSize: 13,
            fontWeight: 500,
            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)',
            zIndex: 1000,
          }}
        >
          连接模式：点击另一个节点建立连接，或再次点击当前节点取消
        </div>
      )}
    </div>
  );
};

export default GraphCanvas;
