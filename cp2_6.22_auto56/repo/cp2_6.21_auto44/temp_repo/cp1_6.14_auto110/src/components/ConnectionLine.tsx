import React, { memo, useState } from 'react';
import { Connection, TreeNodeData } from '@/types/behaviorTree';
import { getPortPosition, getBezierPath } from '@/utils/geometry';

const NODE_WIDTH = 140;
const NODE_HEIGHT = 80;

interface ConnectionLineProps {
  connection: Connection;
  fromNode: TreeNodeData | undefined;
  toNode: TreeNodeData | undefined;
  onRemove?: (id: string) => void;
  isDragging?: boolean;
  dragEndPosition?: { x: number; y: number };
}

const ConnectionLine: React.FC<ConnectionLineProps> = ({
  connection,
  fromNode,
  toNode,
  onRemove,
  isDragging = false,
  dragEndPosition,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const fromPosition = fromNode
    ? getPortPosition(fromNode.x, fromNode.y, NODE_WIDTH, NODE_HEIGHT, 'output')
    : null;

  const toPosition = isDragging && dragEndPosition
    ? dragEndPosition
    : toNode
      ? getPortPosition(toNode.x, toNode.y, NODE_WIDTH, NODE_HEIGHT, 'input')
      : null;

  if (!fromPosition || !toPosition) {
    return null;
  }

  const path = getBezierPath(fromPosition.x, fromPosition.y, toPosition.x, toPosition.y);
  const isActive = connection.isActive || isDragging;
  const strokeColor = isActive ? '#00ff88' : '#4a4a6a';
  const strokeWidth = isHovered ? 5 : isActive ? 4 : 3;

  const midX = (fromPosition.x + toPosition.x) / 2;
  const midY = (fromPosition.y + toPosition.y) / 2;

  return (
    <g>
      <defs>
        <marker
          id={`arrowhead-${connection.id}`}
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L9,3 z" fill={strokeColor} />
        </marker>
      </defs>
      <path
        d={path}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        style={{
          transition: 'stroke 0.3s ease, stroke-width 0.3s ease',
          cursor: 'pointer',
        }}
        markerEnd={`url(#arrowhead-${connection.id})`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => onRemove?.(connection.id)}
      />
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        style={{ cursor: 'pointer' }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => onRemove?.(connection.id)}
      />
      {isHovered && onRemove && (
        <g>
          <circle
            cx={midX}
            cy={midY}
            r={12}
            fill="#1a1a2e"
            stroke="#ff4444"
            strokeWidth={2}
            style={{ cursor: 'pointer' }}
            onClick={(e) => {
              e.stopPropagation();
              onRemove(connection.id);
            }}
          />
          <text
            x={midX}
            y={midY + 4}
            textAnchor="middle"
            fill="#ff4444"
            fontSize={14}
            fontWeight="bold"
            style={{ cursor: 'pointer', pointerEvents: 'none' }}
          >
            ×
          </text>
        </g>
      )}
    </g>
  );
};

export default memo(ConnectionLine);
