import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useStore } from '../store';
import { MECHANISM_LABELS, MECHANISM_COLORS, MechanismType, TriggerType, Link } from '../types';

const NODE_W = 120;
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

  const svgRef = useRef<SVGSVGElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; linkId: string } | null>(null);

  const getInitialPosition = useCallback(
    (id: string, index: number) => {
      if (logicNodePositions[id]) return logicNodePositions[id];
      const col = index % 3;
      const row = Math.floor(index / 3);
      return { x: 20 + col * 140, y: 20 + row * 70 };
    },
    [logicNodePositions]
  );

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const pos = getInitialPosition(id, props.findIndex((p) => p.id === id));
    setDraggingId(id);
    setDragOffset({ x: e.clientX - pos.x, y: e.clientY - pos.y });
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!draggingId) return;
      const svgRect = svgRef.current?.getBoundingClientRect();
      if (!svgRect) return;
      const x = Math.max(0, e.clientX - dragOffset.x - svgRect.left);
      const y = Math.max(0, e.clientY - dragOffset.y - svgRect.top);
      setLogicNodePosition(draggingId, x, y);
    },
    [draggingId, dragOffset, setLogicNodePosition]
  );

  const handleMouseUp = useCallback(() => {
    setDraggingId(null);
  }, []);

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

  const getEdgePath = (link: Link) => {
    const sourceIdx = props.findIndex((p) => p.id === link.sourceId);
    const targetIdx = props.findIndex((p) => p.id === link.targetId);
    const s = nodePos(link.sourceId, sourceIdx);
    const t = nodePos(link.targetId, targetIdx);
    const sx = s.x + NODE_W / 2;
    const sy = s.y + NODE_H / 2;
    const tx = t.x + NODE_W / 2;
    const ty = t.y + NODE_H / 2;
    const mx = (sx + tx) / 2;
    const my = (sy + ty) / 2 - 30;
    return `M ${sx} ${sy} Q ${mx} ${my} ${tx} ${ty}`;
  };

  const panelW = 280;

  return (
    <div
      style={{
        width: panelW,
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
        }}
      >
        <span>🔗 逻辑图</span>
        <span style={{ fontSize: '11px', color: '#666' }}>{links.length} 条连线</span>
      </div>
      <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        <svg
          ref={svgRef}
          width={panelW - 2}
          height={Math.max(300, props.length * 70 + 40)}
          style={{ display: 'block' }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <defs>
            <marker id="arrowBlue" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#4488ff" />
            </marker>
            <marker id="arrowOrange" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#ff8844" />
            </marker>
          </defs>

          {links.map((link) => {
            const color = link.triggerType === TriggerType.Continuous ? '#4488ff' : '#ff8844';
            const markerId = link.triggerType === TriggerType.Continuous ? 'arrowBlue' : 'arrowOrange';
            return (
              <path
                key={link.id}
                d={getEdgePath(link)}
                fill="none"
                stroke={color}
                strokeWidth={2}
                markerEnd={`url(#${markerId})`}
                opacity={0.7}
                onContextMenu={(e) => handleContextMenu(e as any, link.id)}
                style={{ cursor: 'context-menu' }}
              />
            );
          })}

          {props.map((prop, idx) => {
            const pos = nodePos(prop.id, idx);
            const color = prop.activated
              ? MECHANISM_COLORS[prop.type].active
              : MECHANISM_COLORS[prop.type].inactive;
            const isSelected = selectedPropId === prop.id;
            return (
              <g
                key={prop.id}
                style={{
                  cursor: draggingId === prop.id ? 'grabbing' : 'grab',
                  transform: draggingId === prop.id ? 'scale(1.05)' : 'scale(1)',
                  transformOrigin: `${pos.x + NODE_W / 2}px ${pos.y + NODE_H / 2}px`,
                  transition: draggingId === prop.id ? 'none' : 'transform 0.15s',
                }}
                onMouseDown={(e) => handleMouseDown(e as any, prop.id)}
                onClick={() => selectProp(prop.id)}
                onDoubleClick={() => startConnecting(prop.id)}
              >
                <rect
                  x={pos.x}
                  y={pos.y}
                  width={NODE_W}
                  height={NODE_H}
                  rx={8}
                  fill={isSelected ? '#2a3a5a' : '#252535'}
                  stroke={isSelected ? '#5588cc' : '#444'}
                  strokeWidth={isSelected ? 2 : 1}
                />
                <circle cx={pos.x + 14} cy={pos.y + NODE_H / 2} r={5} fill={color} />
                <text
                  x={pos.x + 26}
                  y={pos.y + 20}
                  fontSize={11}
                  fill="#ddd"
                  fontWeight={500}
                >
                  {prop.name.slice(0, 8)}
                </text>
                <text
                  x={pos.x + 26}
                  y={pos.y + 36}
                  fontSize={9}
                  fill="#888"
                >
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
              minWidth: '100px',
            }}
          >
            <div
              onClick={handleDeleteLink}
              style={{
                padding: '6px 14px',
                cursor: 'pointer',
                fontSize: '12px',
                color: '#ff6666',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#3a2a2a')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              删除连线
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
        }}
      >
        双击节点开始连接 | 右键连线删除
      </div>
    </div>
  );
}
