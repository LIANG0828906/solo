import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useStore } from '../store';
import { MECHANISM_LABELS, MECHANISM_COLORS, MechanismType, TriggerType, Link } from '../types';

const NODE_W = 140;
const NODE_H = 50;

export function LogicGraphPanel() {
  const props = useStore((s) => s.props);
  const links = useStore((s) => s.links);
  const removeLink = useStore((s) => s.removeLink);
  const logicNodePositions = useStore((s) => s.logicNodePositions);
  const setLogicNodePosition = useStore((s) => s.setLogicNodePosition);
  const selectedPropId = useStore((s) => s.selectedPropId);
  const selectProp = useStore((s) => s.selectProp);
  const startConnecting = useStore((s) => s.startConnecting);
  const connectingFromId = useStore((s) => s.connectingFromId);
  const finishConnecting = useStore((s) => s.finishConnecting);
  const pushSnapshot = useStore((s) => s.pushSnapshot);

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragStartPosRef = useRef<{ x: number; y: number; origX: number; origY: number; lastDx?: number; lastDy?: number } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; linkId: string } | null>(null);
  const [panelHeight, setPanelHeight] = useState(400);

  useEffect(() => {
    const updateH = () => {
      if (containerRef.current) {
        setPanelHeight(containerRef.current.clientHeight);
      }
    };
    updateH();
    window.addEventListener('resize', updateH);
    return () => window.removeEventListener('resize', updateH);
  }, []);

  useEffect(() => {
    if (!draggingId) return;

    const onMove = (e: MouseEvent) => {
      if (!svgRef.current || !dragStartPosRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const dx = e.clientX - dragStartPosRef.current.x;
      const dy = e.clientY - dragStartPosRef.current.y;
      dragStartPosRef.current.lastDx = dx;
      dragStartPosRef.current.lastDy = dy;
      const nx = Math.max(4, Math.min(rect.width - NODE_W - 4, dragStartPosRef.current.origX + dx));
      const ny = Math.max(4, Math.min(rect.height - NODE_H - 4, dragStartPosRef.current.origY + dy));
      setLogicNodePosition(draggingId, nx, ny);
    };

    const onUp = () => {
      if (draggingId && dragStartPosRef.current) {
        const dx = dragStartPosRef.current.lastDx || 0;
        const dy = dragStartPosRef.current.lastDy || 0;
        if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
          pushSnapshot();
        }
      }
      setDraggingId(null);
      dragStartPosRef.current = null;
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [draggingId, setLogicNodePosition, pushSnapshot]);

  const getInitialPosition = useCallback(
    (id: string, index: number) => {
      if (logicNodePositions[id]) return logicNodePositions[id];
      const cols = 1;
      const col = index % cols;
      const row = Math.floor(index / cols);
      return { x: 16 + col * (NODE_W + 8), y: 16 + row * 68 };
    },
    [logicNodePositions]
  );

  const handleNodeMouseDown = useCallback(
    (e: React.MouseEvent, id: string, index: number) => {
      e.stopPropagation();
      e.preventDefault();
      const pos = getInitialPosition(id, index);
      dragStartPosRef.current = {
        x: e.clientX,
        y: e.clientY,
        origX: pos.x,
        origY: pos.y,
      };
      setDraggingId(id);
    },
    [getInitialPosition]
  );

  const handleNodeClick = useCallback(
    (id: string) => {
      if (draggingId && dragStartPosRef.current) {
        if (dragStartPosRef.current) {
        }
        return;
      }
      if (connectingFromId) {
        if (connectingFromId !== id) {
          finishConnecting(id, TriggerType.Continuous);
        }
        return;
      }
      selectProp(id);
    },
    [draggingId, connectingFromId, finishConnecting, selectProp]
  );

  const handleNodeDoubleClick = useCallback(
    (id: string) => {
      if (!connectingFromId) {
        startConnecting(id);
      }
    },
    [connectingFromId, startConnecting]
  );

  const handleContextMenu = (e: React.MouseEvent, linkId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const svgRect = svgRef.current?.getBoundingClientRect();
    if (!svgRect) return;
    setContextMenu({
      x: e.clientX - svgRect.left,
      y: e.clientY - svgRect.top,
      linkId,
    });
  };

  const handleDeleteLink = () => {
    if (contextMenu) {
      pushSnapshot();
      removeLink(contextMenu.linkId);
      setContextMenu(null);
    }
  };

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const nodePos = (id: string, index: number) => {
    const stored = logicNodePositions[id];
    if (stored) return stored;
    return getInitialPosition(id, index);
  };

  const getEdgePath = (link: Link, p: typeof props) => {
    const sourceIdx = p.findIndex((x) => x.id === link.sourceId);
    const targetIdx = p.findIndex((x) => x.id === link.targetId);
    const s = nodePos(link.sourceId, sourceIdx);
    const t = nodePos(link.targetId, targetIdx);
    const sx = s.x + NODE_W / 2;
    const sy = s.y + NODE_H / 2;
    const tx = t.x + NODE_W / 2;
    const ty = t.y + NODE_H / 2;
    const mx = (sx + tx) / 2;
    const my = (sy + ty) / 2 - 28;
    return { d: `M ${sx} ${sy} Q ${mx} ${my} ${tx} ${ty}`, endX: tx, endY: ty, midX: mx, midY: my };
  };

  return (
    <div
      ref={containerRef}
      style={{
        width: 280,
        background: '#1e1e2e',
        borderLeft: '1px solid #333',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '10px 12px',
          borderBottom: '1px solid #333',
          fontSize: '13px',
          fontWeight: 600,
          color: '#aabbdd',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <span>🔗 逻辑图</span>
        <span style={{ fontSize: '11px', color: '#666' }}>
          {props.length}节点 · {links.length}连线
        </span>
      </div>
      <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        <svg
          ref={svgRef}
          width={278}
          height={Math.max(300, props.length * 68 + 80, panelHeight - 40)}
          style={{ display: 'block', userSelect: 'none' }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <defs>
            <marker id="arrowBlue" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">
              <polygon points="0 0, 10 4, 0 8" fill="#4488ff" />
            </marker>
            <marker id="arrowOrange" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">
              <polygon points="0 0, 10 4, 0 8" fill="#ff8844" />
            </marker>
            <filter id="glowBlue">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glowOrange">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect width="100%" height="100%" fill="transparent" />

          {links.map((link) => {
            const color = link.triggerType === TriggerType.Continuous ? '#4488ff' : '#ff8844';
            const markerId = link.triggerType === TriggerType.Continuous ? 'arrowBlue' : 'arrowOrange';
            const filterId = link.triggerType === TriggerType.Continuous ? 'glowBlue' : 'glowOrange';
            const { d, midX, midY } = getEdgePath(link, props);
            return (
              <g key={link.id}>
                <path
                  d={d}
                  fill="none"
                  stroke={color}
                  strokeWidth={3}
                  strokeLinecap="round"
                  markerEnd={`url(#${markerId})`}
                  opacity={0.55}
                  filter={`url(#${filterId})`}
                  pointerEvents="none"
                />
                <path
                  d={d}
                  fill="none"
                  stroke={color}
                  strokeWidth={14}
                  opacity={0}
                  onContextMenu={(e) => handleContextMenu(e as any, link.id)}
                  style={{ cursor: 'pointer' }}
                />
                <circle
                  cx={midX}
                  cy={midY}
                  r={8}
                  fill={color}
                  opacity={0.9}
                  onContextMenu={(e) => handleContextMenu(e as any, link.id)}
                  style={{ cursor: 'context-menu' }}
                >
                  <title>右键删除</title>
                </circle>
              </g>
            );
          })}

          {props.map((prop, idx) => {
            const pos = nodePos(prop.id, idx);
            const typeColors = MECHANISM_COLORS[prop.type];
            const color = prop.activated ? typeColors.active : typeColors.inactive;
            const isSelected = selectedPropId === prop.id;
            const isConnecting = connectingFromId === prop.id;
            const isDraggingThis = draggingId === prop.id;

            return (
              <g
                key={prop.id}
                style={{
                  cursor: isDraggingThis ? 'grabbing' : 'grab',
                  transform: isDraggingThis ? 'scale(1.05)' : 'scale(1)',
                  transformOrigin: `${pos.x + NODE_W / 2}px ${pos.y + NODE_H / 2}px`,
                  transformBox: 'fill-box' as any,
                  transition: isDraggingThis ? 'none' : 'transform 0.12s ease-out',
                }}
                onMouseDown={(e) => handleNodeMouseDown(e as any, prop.id, idx)}
                onClick={() => handleNodeClick(prop.id)}
                onDoubleClick={() => handleNodeDoubleClick(prop.id)}
              >
                {isConnecting && (
                  <rect
                    x={pos.x - 3}
                    y={pos.y - 3}
                    width={NODE_W + 6}
                    height={NODE_H + 6}
                    rx={11}
                    fill="none"
                    stroke="#ffcc44"
                    strokeWidth={2}
                    strokeDasharray="5 3"
                  />
                )}
                <rect
                  x={pos.x}
                  y={pos.y}
                  width={NODE_W}
                  height={NODE_H}
                  rx={8}
                  fill={isSelected ? '#253550' : '#1e1e2e'}
                  stroke={isSelected ? '#5588cc' : isConnecting ? '#ffcc44' : '#3a3a4a'}
                  strokeWidth={isSelected ? 2 : 1}
                  style={{ filter: prop.activated ? `drop-shadow(0 0 4px ${color})` : 'none' }}
                />
                <circle cx={pos.x + 16} cy={pos.y + NODE_H / 2} r={7} fill={color}>
                  {prop.activated && (
                    <animate attributeName="r" values="7;8;7" dur="1.5s" repeatCount="indefinite" />
                  )}
                </circle>
                <text
                  x={pos.x + 32}
                  y={pos.y + 20}
                  fontSize={11}
                  fill="#e0e0e0"
                  fontWeight={isSelected ? 600 : 500}
                >
                  {prop.name.slice(0, 10)}
                </text>
                <text x={pos.x + 32} y={pos.y + 36} fontSize={9} fill="#778">
                  {MECHANISM_LABELS[prop.type]}
                </text>
              </g>
            );
          })}
        </svg>

        {contextMenu && (
          <div
            style={{
              position: 'absolute',
              left: contextMenu.x,
              top: contextMenu.y,
              background: '#2a2a3e',
              border: '1px solid #555',
              borderRadius: '6px',
              padding: '4px 0',
              zIndex: 10,
              minWidth: '110px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            }}
          >
            <div
              onClick={handleDeleteLink}
              style={{
                padding: '7px 14px',
                cursor: 'pointer',
                fontSize: '12px',
                color: '#ff7777',
                transition: 'background 0.15s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#3a2a2a')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              🗑 删除连线
            </div>
          </div>
        )}
      </div>
      <div
        style={{
          padding: '8px 12px',
          borderTop: '1px solid #333',
          fontSize: '10px',
          color: '#666',
          lineHeight: 1.4,
          flexShrink: 0,
        }}
      >
        拖拽节点布局 · 双击节点连接 · 右键连线删除
      </div>
    </div>
  );
}
