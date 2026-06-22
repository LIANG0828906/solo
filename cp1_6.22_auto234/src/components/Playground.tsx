import React, { useState, useRef, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { RigidBody, RopeConstraint, Vector2, BodyType } from '../PhysicsEngine';
import { LevelBuilder } from '../LevelBuilder';

interface PlacedElement {
  id: string;
  body: RigidBody;
}

interface Connection {
  id: string;
  constraint: RopeConstraint;
}

interface PlaygroundProps {
  width: number;
  height: number;
  bodies: RigidBody[];
  constraints: RopeConstraint[];
  goalPosition: Vector2;
  goalRadius: number;
  startPosition: Vector2;
  placedElements: PlacedElement[];
  connections: Connection[];
  isRunning: boolean;
  isPaused: boolean;
  availableElements: BodyType[];
  onElementPlaced: (body: RigidBody) => void;
  onElementMoved: (id: string, position: Vector2) => void;
  onConnectionCreated: (constraint: RopeConstraint) => void;
  onStartBall: () => void;
  trail: Vector2[];
}

const GRID_SIZE = 20;

const ElementIcon: React.FC<{ type: BodyType; size?: number }> = ({ type, size = 40 }) => {
  if (type === 'lever') {
    return (
      <g>
        <rect x={-size * 0.9} y={-6} width={size * 1.8} height={12} rx={3} fill="#8B4513" />
      </g>
    );
  }
  if (type === 'pulley') {
    return (
      <g>
        <circle cx={0} cy={0} r={size / 2.5} fill="none" stroke="#6B7280" strokeWidth={4} />
        <circle cx={0} cy={0} r={3} fill="#6B7280" />
      </g>
    );
  }
  if (type === 'incline') {
    return (
      <g>
        <polygon points={`${-size * 0.9},${size / 2.5} ${size * 0.9},${size / 2.5} ${-size * 0.9},${-size / 2.5}`} fill="#9CA3AF" />
      </g>
    );
  }
  if (type === 'anchor') {
    return (
      <g>
        <rect x={-size / 3} y={-size / 3} width={(size / 3) * 2} height={(size / 3) * 2} rx={3} fill="#374151" />
        <circle cx={0} cy={0} r={size / 6} fill="#1F2937" />
      </g>
    );
  }
  return null;
};

const renderBody = (body: RigidBody, key: string) => {
  if (body.type === 'ball') {
    return (
      <g key={key} transform={`translate(${body.position.x}, ${body.position.y})`}>
        <defs>
          <radialGradient id={`ballGrad-${key}`} cx="35%" cy="35%">
            <stop offset="0%" stopColor="#FCA5A5" />
            <stop offset="50%" stopColor="#EF4444" />
            <stop offset="100%" stopColor="#B91C1C" />
          </radialGradient>
        </defs>
        <circle cx={0} cy={0} r={body.radius || 10} fill={`url(#ballGrad-${key})`} />
        <circle cx={-3} cy={-3} r={2} fill="#FEE2E2" opacity={0.8} />
      </g>
    );
  }
  if (body.type === 'lever') {
    return (
      <g key={key} transform={`translate(${body.position.x}, ${body.position.y}) rotate(${body.rotation * 180 / Math.PI})`}>
        <rect
          x={-(body.width || 150) / 2}
          y={-(body.height || 12) / 2}
          width={body.width || 150}
          height={body.height || 12}
          rx={4}
          fill="#8B4513"
        />
      </g>
    );
  }
  if (body.type === 'incline') {
    const w = body.width || 180;
    const h = body.height || 80;
    return (
      <g key={key} transform={`translate(${body.position.x}, ${body.position.y}) rotate(${body.rotation * 180 / Math.PI})`}>
        <polygon
          points={`${-w / 2},${h / 2} ${w / 2},${h / 2} ${-w / 2},${-h / 2}`}
          fill="#9CA3AF"
          stroke="#6B7280"
          strokeWidth={1}
        />
      </g>
    );
  }
  if (body.type === 'pulley') {
    return (
      <g key={key} transform={`translate(${body.position.x}, ${body.position.y}) rotate(${body.rotation * 180 / Math.PI})`}>
        <circle cx={0} cy={0} r={body.radius || 20} fill="none" stroke="#6B7280" strokeWidth={4} />
        <circle cx={0} cy={0} r={4} fill="#4B5563" />
      </g>
    );
  }
  if (body.type === 'anchor') {
    return (
      <g key={key} transform={`translate(${body.position.x}, ${body.position.y})`}>
        <rect x={-12} y={-12} width={24} height={24} rx={4} fill="#374151" />
        <circle cx={0} cy={0} r={body.radius || 6} fill="#1F2937" stroke="#4B5563" strokeWidth={2} />
      </g>
    );
  }
  return null;
};

export const Playground: React.FC<PlaygroundProps> = ({
  width,
  height,
  bodies,
  constraints,
  goalPosition,
  goalRadius,
  startPosition,
  placedElements,
  connections,
  isRunning,
  isPaused,
  availableElements,
  onElementPlaced,
  onElementMoved,
  onConnectionCreated,
  onStartBall,
  trail,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<{
    type: 'new' | 'move' | 'connect';
    elementType?: BodyType;
    elementId?: string;
    mousePosition: Vector2;
    connectStart?: { bodyId: string; position: Vector2 };
  } | null>(null);

  const snapToGrid = useCallback((value: number) => {
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  }, []);

  const getSvgPoint = useCallback((clientX: number, clientY: number): Vector2 => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }, []);

  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent, type: BodyType) => {
    if (isRunning) return;
    if (!availableElements.includes(type)) return;
    e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const point = getSvgPoint(clientX, clientY);
    setDragging({
      type: 'new',
      elementType: type,
      mousePosition: point,
    });
  }, [isRunning, availableElements, getSvgPoint]);

  const handleBodyMouseDown = useCallback((e: React.MouseEvent, bodyId: string) => {
    if (isRunning) return;
    if (bodyId === 'ball') return;
    e.stopPropagation();
    e.preventDefault();
    const point = getSvgPoint(e.clientX, e.clientY);
    setDragging({
      type: 'move',
      elementId: bodyId,
      mousePosition: point,
    });
  }, [isRunning, getSvgPoint]);

  const handleBodyRightClick = useCallback((e: React.MouseEvent, bodyId: string) => {
    if (isRunning) return;
    if (bodyId === 'ball') return;
    e.preventDefault();
    e.stopPropagation();
    const body = bodies.find(b => b.id === bodyId);
    if (!body) return;
    const point = getSvgPoint(e.clientX, e.clientY);
    setDragging({
      type: 'connect',
      elementId: bodyId,
      mousePosition: point,
      connectStart: { bodyId, position: { ...body.position } },
    });
  }, [isRunning, bodies, getSvgPoint]);

  const handleMouseMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!dragging) return;
    e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const point = getSvgPoint(clientX, clientY);

    if (dragging.type === 'move' && dragging.elementId) {
      const snapped = { x: snapToGrid(point.x), y: snapToGrid(point.y) };
      onElementMoved(dragging.elementId, snapped);
    }

    setDragging({ ...dragging, mousePosition: point });
  }, [dragging, getSvgPoint, snapToGrid, onElementMoved]);

  const handleMouseUp = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!dragging) return;
    e.preventDefault();

    if (dragging.type === 'new' && dragging.elementType) {
      const snapped = {
        x: Math.max(100, Math.min(width - 100, snapToGrid(dragging.mousePosition.x))),
        y: Math.max(60, Math.min(height - 60, snapToGrid(dragging.mousePosition.y))),
      };
      const size = LevelBuilder.getDefaultElementSize(dragging.elementType);
      const isStatic = dragging.elementType === 'anchor' || dragging.elementType === 'incline';
      const newBody: RigidBody = {
        id: uuidv4(),
        type: dragging.elementType,
        position: snapped,
        velocity: { x: 0, y: 0 },
        mass: dragging.elementType === 'anchor' ? 10000 : dragging.elementType === 'pulley' ? 0.5 : 10,
        rotation: 0,
        angularVelocity: 0,
        ...size,
        isStatic,
        restitution: 0.3,
        friction: dragging.elementType === 'incline' ? 0.3 : dragging.elementType === 'lever' ? 0.5 : 0.8,
      };
      onElementPlaced(newBody);
    }

    if (dragging.type === 'connect' && dragging.connectStart) {
      const endBody = bodies.find(b => {
        if (b.id === 'ball' || b.id === dragging.connectStart!.bodyId) return false;
        const dx = b.position.x - dragging.mousePosition.x;
        const dy = b.position.y - dragging.mousePosition.y;
        return Math.sqrt(dx * dx + dy * dy) < 40;
      });
      if (endBody && dragging.connectStart) {
        const constraint = LevelBuilder.createRopeConstraint(
          dragging.connectStart.bodyId,
          endBody.id,
          { x: 0, y: 0 },
          { x: 0, y: 0 }
        );
        onConnectionCreated(constraint);
      }
    }

    setDragging(null);
  }, [dragging, width, height, snapToGrid, onElementPlaced, onConnectionCreated, bodies]);

  const handleCanvasClick = useCallback(() => {
    if (!isRunning && !isPaused && bodies.find(b => b.id === 'ball')) {
      onStartBall();
    }
  }, [isRunning, isPaused, bodies, onStartBall]);

  const allConstraints = [...constraints, ...connections.map(c => c.constraint)];
  const allBodies = [...bodies, ...placedElements.map(p => p.body)];

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{
          backgroundColor: '#E5E7EB',
          display: 'block',
          cursor: isRunning ? 'default' : 'crosshair',
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
        onClick={handleCanvasClick}
      >
        <defs>
          <pattern id="grid" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse">
            <path d={`M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`} fill="none" stroke="#D1D5DB" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        <g style={{ pointerEvents: 'none' }}>
          <circle
            cx={startPosition.x}
            cy={startPosition.y}
            r={15}
            fill="none"
            stroke="#9CA3AF"
            strokeWidth={2}
            strokeDasharray="4 4"
          />
          <text x={startPosition.x} y={startPosition.y - 25} textAnchor="middle" fill="#6B7280" fontSize={12}>
            起点
          </text>
        </g>

        <g style={{ pointerEvents: 'none' }}>
          <circle
            cx={goalPosition.x}
            cy={goalPosition.y}
            r={goalRadius}
            fill="#22C55E"
            opacity={0.2}
          >
            <animate attributeName="r" values={`${goalRadius};${goalRadius + 8};${goalRadius}`} dur="1s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.2;0.4;0.2" dur="1s" repeatCount="indefinite" />
          </circle>
          <circle
            cx={goalPosition.x}
            cy={goalPosition.y}
            r={goalRadius}
            fill="none"
            stroke="#22C55E"
            strokeWidth={3}
          >
            <animate attributeName="stroke" values="#22C55E;#4ADE80;#22C55E" dur="1s" repeatCount="indefinite" />
          </circle>
          <text x={goalPosition.x} y={goalPosition.y - goalRadius - 10} textAnchor="middle" fill="#16A34A" fontSize={12} fontWeight="bold">
            终点
          </text>
        </g>

        {trail.length > 1 && (
          <polyline
            points={trail.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="#EF4444"
            strokeWidth={2}
            opacity={0.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {allConstraints.map((constraint, idx) => {
          const bodyA = allBodies.find(b => b.id === constraint.bodyAId);
          const bodyB = allBodies.find(b => b.id === constraint.bodyBId);
          if (!bodyA || !bodyB) return null;
          const ax = bodyA.position.x + constraint.anchorA.x;
          const ay = bodyA.position.y + constraint.anchorA.y;
          const bx = bodyB.position.x + constraint.anchorB.x;
          const by = bodyB.position.y + constraint.anchorB.y;
          return (
            <line
              key={`rope-${constraint.id || idx}`}
              x1={ax}
              y1={ay}
              x2={bx}
              y2={by}
              stroke="#1F2937"
              strokeWidth={2}
            />
          );
        })}

        {dragging?.type === 'connect' && dragging.connectStart && (
          <line
            x1={dragging.connectStart.position.x}
            y1={dragging.connectStart.position.y}
            x2={dragging.mousePosition.x}
            y2={dragging.mousePosition.y}
            stroke="#1F2937"
            strokeWidth={2}
            strokeDasharray="4 4"
          />
        )}

        {allBodies.map((body) => (
          <g
            key={body.id}
            style={{
              cursor: isRunning || body.id === 'ball' ? 'default' : body.type === 'anchor' ? 'context-menu' : 'move',
              transition: dragging?.type === 'move' && dragging.elementId === body.id ? 'none' : 'transform 0.1s ease',
            }}
            onMouseDown={(e) => handleBodyMouseDown(e, body.id)}
            onContextMenu={(e) => handleBodyRightClick(e, body.id)}
          >
            {renderBody(body, body.id)}
          </g>
        ))}

        {dragging?.type === 'new' && dragging.elementType && (
          <g
            transform={`translate(${snapToGrid(dragging.mousePosition.x)}, ${snapToGrid(dragging.mousePosition.y)})`}
            style={{ pointerEvents: 'none', opacity: 0.7 }}
          >
            <ElementIcon type={dragging.elementType} size={80} />
          </g>
        )}
      </svg>

      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: 200,
        height: '100%',
        backgroundColor: '#F3F4F6',
        padding: '16px 12px',
        boxSizing: 'border-box',
        borderRight: '1px solid #E5E7EB',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        <div style={{ fontSize: 14, fontWeight: 'bold', color: '#374151', marginBottom: 8, padding: '0 4px' }}>
          元件库
        </div>
        {(['lever', 'incline', 'pulley', 'anchor'] as BodyType[]).map((type) => {
          const available = availableElements.includes(type);
          const names: Record<BodyType, string> = {
            lever: '杠杆',
            incline: '斜面',
            pulley: '滑轮',
            anchor: '固定点',
            ball: '小球',
          };
          return (
            <div
              key={type}
              style={{
                height: 60,
                borderRadius: 8,
                backgroundColor: available ? '#FFFFFF' : '#E5E7EB',
                border: available ? '1px solid #D1D5DB' : '1px solid #E5E7EB',
                display: 'flex',
                alignItems: 'center',
                padding: '0 12px',
                gap: 12,
                cursor: isRunning || !available ? 'not-allowed' : 'grab',
                opacity: available ? 1 : 0.5,
                userSelect: 'none',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
              onMouseDown={(e) => handleDragStart(e, type)}
              onMouseEnter={(e) => {
                if (available && !isRunning) {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
              }}
            >
              <svg width={40} height={40} viewBox="-25 -25 50 50">
                <ElementIcon type={type} size={50} />
              </svg>
              <span style={{ fontSize: 13, fontWeight: 500, color: available ? '#374151' : '#9CA3AF' }}>
                {names[type]}
              </span>
            </div>
          );
        })}
        <div style={{ marginTop: 'auto', padding: '8px 4px', fontSize: 11, color: '#6B7280', lineHeight: 1.6 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>操作提示：</div>
          <div>• 拖拽元件到画布</div>
          <div>• 移动已放置元件</div>
          <div>• 右键拖拽连接绳索</div>
          <div>• 点击画布释放小球</div>
        </div>
      </div>
    </div>
  );
};
