import React, { useRef, useState } from 'react';
import { NodeData, ElementType, ELEMENT_COLORS, EnemyTarget, ComboSpellType, COMBO_SPELL_NAMES, COMBO_SPELL_COLORS } from './types';

interface CircleGridProps {
  nodes: NodeData[];
  gridSize: number;
  radius: number;
  draggedElement: ElementType | null;
  onNodePlace: (nodeId: number) => void;
  comboSpell: ComboSpellType | null;
  onComboClick: () => void;
  enemies: EnemyTarget[];
  chargingNodes: number[];
}

const CircleGrid: React.FC<CircleGridProps> = ({
  nodes,
  gridSize,
  radius,
  draggedElement,
  onNodePlace,
  comboSpell,
  onComboClick,
  enemies,
  chargingNodes,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);

  const handleNodeClick = (nodeId: number) => {
    if (draggedElement && !nodes[nodeId].element) {
      onNodePlace(nodeId);
    }
  };

  const handleContainerMouseUp = (e: React.MouseEvent) => {
    if (!draggedElement || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;

    let closestNodeId = -1;
    let closestDistance = Infinity;

    nodes.forEach((node) => {
      if (node.element) return;
      const dx = node.x - gridSize / 2 - mouseX;
      const dy = node.y - gridSize / 2 - mouseY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < 60 && distance < closestDistance) {
        closestDistance = distance;
        closestNodeId = node.id;
      }
    });

    if (closestNodeId >= 0) {
      onNodePlace(closestNodeId);
    }
  };

  const renderHexagon = (size: number) => {
    const points: string[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      const x = size + size * Math.cos(angle);
      const y = size + size * Math.sin(angle);
      points.push(`${x},${y}`);
    }
    return points.join(' ');
  };

  return (
    <div
      ref={containerRef}
      onMouseUp={handleContainerMouseUp}
      style={{
        position: 'relative',
        width: `${gridSize}px`,
        height: `${gridSize}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
      }}
    >
      <svg
        width={gridSize}
        height={gridSize}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
        }}
      >
        <circle
          cx={gridSize / 2}
          cy={gridSize / 2}
          r={radius}
          fill="none"
          stroke="rgba(100,100,200,0.2)"
          strokeWidth="2"
          strokeDasharray="8 8"
        />
        <circle
          cx={gridSize / 2}
          cy={gridSize / 2}
          r={radius - 40}
          fill="none"
          stroke="rgba(100,100,200,0.1)"
          strokeWidth="1"
        />

        {nodes.map((node, i) => {
          const next = nodes[(i + 1) % nodes.length];
          return (
            <line
              key={`line-${i}`}
              x1={node.x}
              y1={node.y}
              x2={next.x}
              y2={next.y}
              stroke="rgba(100,100,200,0.15)"
              strokeWidth="1"
            />
          );
        })}

        {chargingNodes.length > 1 &&
          chargingNodes.slice(0, -1).map((nodeId, i) => {
            const fromNode = nodes[nodeId];
            const toNodeId = chargingNodes[i + 1];
            if (toNodeId === undefined) return null;
            const toNode = nodes[toNodeId];
            const fromColor = fromNode.element ? ELEMENT_COLORS[fromNode.element] : '#fff';
            const toColor = toNode.element ? ELEMENT_COLORS[toNode.element] : '#fff';
            const gradId = `grad-${nodeId}-${toNodeId}`;
            return (
              <g key={`charge-${i}`}>
                <defs>
                  <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={fromColor} stopOpacity="0.9" />
                    <stop offset="100%" stopColor={toColor} stopOpacity="0.9" />
                  </linearGradient>
                </defs>
                <line
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke={`url(#${gradId})`}
                  strokeWidth="4"
                  style={{
                    filter: `drop-shadow(0 0 8px ${fromColor})`,
                  }}
                />
              </g>
            );
          })}
      </svg>

      {nodes.map((node) => {
        const color = node.element ? ELEMENT_COLORS[node.element] : '#4a4a7a';
        const isCharging = chargingNodes.includes(node.id);
        const isHovered = hoveredNode === node.id && !node.element && draggedElement;

        return (
          <div
            key={node.id}
            onMouseEnter={() => setHoveredNode(node.id)}
            onMouseLeave={() => setHoveredNode(null)}
            onMouseUp={(e) => {
              e.stopPropagation();
              if (draggedElement && !node.element) {
                onNodePlace(node.id);
              }
            }}
            onClick={() => handleNodeClick(node.id)}
            style={{
              position: 'absolute',
              left: `${node.x - 40}px`,
              top: `${node.y - 40}px`,
              width: '80px',
              height: '80px',
              cursor: !node.element && draggedElement ? 'pointer' : 'default',
              transition: 'all 0.2s ease',
              transform: isHovered ? 'scale(1.1)' : 'scale(1)',
            }}
          >
            <svg width="80" height="80">
              <polygon
                points={renderHexagon(38)}
                fill={node.element ? `${color}33` : '#1a1a3a'}
                stroke={color}
                strokeWidth={isCharging ? 3 : 2}
                style={{
                  filter: isCharging
                    ? `drop-shadow(0 0 20px ${color}) drop-shadow(0 0 40px ${color})`
                    : node.element
                    ? `drop-shadow(0 0 10px ${color})`
                    : 'none',
                  transition: 'all 0.2s ease',
                  animation: isCharging ? 'nodeBlink 0.3s ease-in-out infinite' : 'none',
                }}
              />
            </svg>

            {node.element && (
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  fontSize: '28px',
                  pointerEvents: 'none',
                }}
              >
                {node.element === ElementType.Fire && '🔥'}
                {node.element === ElementType.Ice && '❄'}
                {node.element === ElementType.Lightning && '⚡'}
                {node.element === ElementType.Shadow && '🌑'}
              </div>
            )}

            <div
              style={{
                position: 'absolute',
                bottom: '-18px',
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: '11px',
                color: '#666699',
                fontFamily: 'monospace',
              }}
            >
              {node.id + 1}
            </div>
          </div>
        );
      })}

      {enemies.map((enemy) => (
        <div
          key={enemy.id}
          style={{
            position: 'absolute',
            left: `${enemy.x - 24}px`,
            top: `${enemy.y - 24}px`,
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, #661111 0%, #220000 100%)',
            border: '2px solid #ff4444',
            boxShadow: '0 0 15px rgba(255,68,68,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            pointerEvents: 'none',
          }}
        >
          👹
        </div>
      ))}

      {comboSpell && (
        <div
          onClick={onComboClick}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${COMBO_SPELL_COLORS[comboSpell]}66 0%, ${COMBO_SPELL_COLORS[comboSpell]}22 100%)`,
            border: `3px solid ${COMBO_SPELL_COLORS[comboSpell]}`,
            color: COMBO_SPELL_COLORS[comboSpell],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: 'bold',
            textAlign: 'center',
            cursor: 'pointer',
            transform: 'translate(-50%, -50%)',
            animation: 'comboIconPulse 1.5s ease-in-out infinite',
            zIndex: 40,
          }}
        >
          <div>
            ✦<br />
            {COMBO_SPELL_NAMES[comboSpell]}
          </div>
        </div>
      )}
    </div>
  );
};

export default CircleGrid;
