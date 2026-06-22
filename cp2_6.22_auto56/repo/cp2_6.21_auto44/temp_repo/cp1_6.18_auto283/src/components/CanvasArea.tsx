import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { DndContext, DragEndEvent, MouseSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useStore, Connection } from '../store';
import {
  getBezierPath,
  getAnchorPoint,
  getMidpoint,
  Point,
  CARD_WIDTH,
  CARD_HEIGHT,
} from '../utils/connection';
import { NodeCard } from './NodeCard';

interface CanvasAreaProps {
  onCanvasClick: (e: React.MouseEvent) => void;
}

export const CanvasArea: React.FC<CanvasAreaProps> = ({ onCanvasClick }) => {
  const nodes = useStore((state) => state.nodes);
  const connections = useStore((state) => state.connections);
  const addConnection = useStore((state) => state.addConnection);
  const deleteConnection = useStore((state) => state.deleteConnection);
  const updateNodePosition = useStore((state) => state.updateNodePosition);

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [connectionStart, setConnectionStart] = useState<{ id: string; point: Point } | null>(null);
  const [mousePos, setMousePos] = useState<Point | null>(null);
  const [hoveredConnection, setHoveredConnection] = useState<string | null>(null);
  const [targetNodeId, setTargetNodeId] = useState<string | null>(null);
  const rafRef = useRef<number | null>(null);

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 5,
    },
  });

  const sensors = useSensors(mouseSensor);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, delta } = event;
    const nodeId = active.id as string;
    const node = nodes.find((n) => n.id === nodeId);
    if (node) {
      updateNodePosition(nodeId, node.x + delta.x, node.y + delta.y);
    }
  }, [nodes, updateNodePosition]);

  const handleConnectionStart = useCallback((id: string, e: React.MouseEvent) => {
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;
    setConnectionStart({
      id,
      point: {
        x: e.clientX - containerRect.left,
        y: e.clientY - containerRect.top,
      },
    });
  }, []);

  const handleConnectionEnd = useCallback((toId: string | null) => {
    if (connectionStart && toId) {
      addConnection(connectionStart.id, toId);
    }
    setConnectionStart(null);
    setMousePos(null);
    setTargetNodeId(null);
  }, [connectionStart, addConnection]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!connectionStart) return;

    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    const currentMousePos = {
      x: e.clientX - containerRect.left,
      y: e.clientY - containerRect.top,
    };

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(() => {
      setMousePos(currentMousePos);

      let foundTarget: string | null = null;
      for (const node of nodes) {
        if (node.id !== connectionStart.id) {
          const nx = node.x;
          const ny = node.y;
          if (
            currentMousePos.x >= nx &&
            currentMousePos.x <= nx + CARD_WIDTH &&
            currentMousePos.y >= ny &&
            currentMousePos.y <= ny + CARD_HEIGHT
          ) {
            foundTarget = node.id;
            break;
          }
        }
      }
      setTargetNodeId(foundTarget);
      rafRef.current = null;
    });
  }, [connectionStart, nodes]);

  const handleMouseUp = useCallback(() => {
    if (connectionStart) {
      handleConnectionEnd(targetNodeId);
    }
  }, [connectionStart, targetNodeId, handleConnectionEnd]);

  useEffect(() => {
    if (connectionStart) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }
      };
    }
  }, [connectionStart, handleMouseMove, handleMouseUp]);

  const getNodeColor = useCallback(
    (nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      return node?.color || '#999';
    },
    [nodes]
  );

  const renderConnection = useCallback(
    (conn: Connection) => {
      const fromNode = nodes.find((n) => n.id === conn.fromId);
      const toNode = nodes.find((n) => n.id === conn.toId);

      if (!fromNode || !toNode) return null;

      const fromBounds = {
        id: fromNode.id,
        x: fromNode.x,
        y: fromNode.y,
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
      };

      const toBounds = {
        id: toNode.id,
        x: toNode.x,
        y: toNode.y,
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
      };

      const toCenter = {
        x: toNode.x + CARD_WIDTH / 2,
        y: toNode.y + CARD_HEIGHT / 2,
      };

      const fromCenter = {
        x: fromNode.x + CARD_WIDTH / 2,
        y: fromNode.y + CARD_HEIGHT / 2,
      };

      const fromPoint = getAnchorPoint(fromBounds, toCenter);
      const toPoint = getAnchorPoint(toBounds, fromCenter);

      const path = getBezierPath(fromPoint, toPoint);
      const midpoint = getMidpoint(fromPoint, toPoint);
      const color = getNodeColor(conn.fromId);
      const isHovered = hoveredConnection === conn.id;

      return (
        <g key={conn.id}>
          <path
            d={path}
            stroke="transparent"
            strokeWidth={12}
            fill="none"
            style={{ cursor: 'pointer', pointerEvents: 'stroke' }}
            onMouseEnter={() => setHoveredConnection(conn.id)}
            onMouseLeave={() => setHoveredConnection(null)}
          />
          <path
            d={path}
            stroke={color}
            strokeWidth={isHovered ? 4 : 2}
            fill="none"
            strokeDasharray={isHovered ? '4 4' : undefined}
            style={{
              transition: 'all 200ms ease-out',
              pointerEvents: 'none',
            }}
          />
          <circle cx={fromPoint.x} cy={fromPoint.y} r={4} fill={color} style={{ pointerEvents: 'none' }} />
          <circle cx={toPoint.x} cy={toPoint.y} r={4} fill={color} style={{ pointerEvents: 'none' }} />
          {isHovered && (
            <g style={{ cursor: 'pointer', pointerEvents: 'auto' }}>
              <circle
                cx={midpoint.x}
                cy={midpoint.y}
                r={12}
                fill="white"
                stroke={color}
                strokeWidth={2}
                onClick={(e) => {
                  e.stopPropagation();
                  deleteConnection(conn.id);
                }}
              />
              <text
                x={midpoint.x}
                y={midpoint.y + 4}
                textAnchor="middle"
                fill={color}
                fontSize={14}
                style={{ pointerEvents: 'none' }}
              >
                ✕
              </text>
            </g>
          )}
        </g>
      );
    },
    [nodes, hoveredConnection, getNodeColor, deleteConnection]
  );

  const renderTempConnection = useMemo(() => {
    if (!connectionStart || !mousePos) return null;

    const fromNode = nodes.find((n) => n.id === connectionStart.id);
    if (!fromNode) return null;

    const fromBounds = {
      id: fromNode.id,
      x: fromNode.x,
      y: fromNode.y,
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
    };

    const fromPoint = getAnchorPoint(fromBounds, mousePos);
    const path = getBezierPath(fromPoint, mousePos);
    const color = fromNode.color;

    return (
      <g style={{ pointerEvents: 'none' }}>
        <path
          d={path}
          stroke={color}
          strokeWidth={2}
          fill="none"
          strokeDasharray="6 3"
          opacity={0.8}
        />
        <circle cx={fromPoint.x} cy={fromPoint.y} r={4} fill={color} />
        <circle cx={mousePos.x} cy={mousePos.y} r={4} fill={color} />
      </g>
    );
  }, [connectionStart, mousePos, nodes]);

  const handleCanvasClickInternal = useCallback((e: React.MouseEvent) => {
    if (connectionStart) return;
    if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === 'svg') {
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (containerRect) {
        const clickEvent = {
          ...e,
          clientX: e.clientX - containerRect.left,
          clientY: e.clientY - containerRect.top,
        } as unknown as React.MouseEvent;
        onCanvasClick(clickEvent);
      }
    }
  }, [connectionStart, onCanvasClick]);

  const isTargetNode = (nodeId: string) =>
    connectionStart !== null && targetNodeId === nodeId;

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div
        ref={containerRef}
        onClick={handleCanvasClickInternal}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          background: '#F5F5F5',
          overflow: 'hidden',
        }}
      >
        <svg
          ref={svgRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
        >
          {connections.map(renderConnection)}
          {renderTempConnection}
        </svg>

        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          {nodes.map((node) => (
            <NodeCard
              key={node.id}
              id={node.id}
              isTarget={isTargetNode(node.id)}
              onConnectionStart={handleConnectionStart}
            />
          ))}
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            fontSize: 12,
            color: '#999',
            userSelect: 'none',
            pointerEvents: 'none',
            textAlign: 'right',
          }}
        >
          {nodes.length}/30 卡片 · {connections.length}/50 连线
          <br />
          <span style={{ fontSize: 11 }}>
            点击空白创建 · 拖拽移动 · 长按/Shift+拖拽连接 · 双击编辑
          </span>
        </div>
      </div>
    </DndContext>
  );
};
