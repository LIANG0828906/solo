import React, { memo, useCallback, useMemo } from 'react';
import { useBoardStore } from '@/store/boardStore';
import { getBezierPath, getConnectionPoints } from '@/shared/utils';
import type { Connection, IdeaNode } from '@/shared/types';

interface ConnectionLayerProps {
  nodes: IdeaNode[];
  connections: Connection[];
}

export const ConnectionLayer: React.FC<ConnectionLayerProps> = memo(
  ({ nodes, connections }) => {
    const { tempConnection } = useBoardStore();

    const nodeMap = useMemo(() => {
      const map = new Map<string, IdeaNode>();
      nodes.forEach((node) => map.set(node.id, node));
      return map;
    }, [nodes]);

    const renderConnection = useCallback(
      (connection: Connection) => {
        const fromNode = nodeMap.get(connection.fromNodeId);
        const toNode = nodeMap.get(connection.toNodeId);
        if (!fromNode || !toNode) return null;

        const fromPoints = getConnectionPoints(fromNode);
        const toPoints = getConnectionPoints(toNode);

        const dx = toNode.x - fromNode.x;
        const dy = toNode.y - fromNode.y;

        let startPoint = fromPoints.right;
        let endPoint = toPoints.left;

        if (Math.abs(dx) > Math.abs(dy)) {
          if (dx >= 0) {
            startPoint = fromPoints.right;
            endPoint = toPoints.left;
          } else {
            startPoint = fromPoints.left;
            endPoint = toPoints.right;
          }
        } else {
          if (dy >= 0) {
            startPoint = fromPoints.bottom;
            endPoint = toPoints.top;
          } else {
            startPoint = fromPoints.top;
            endPoint = toPoints.bottom;
          }
        }

        const path = getBezierPath(
          startPoint.x,
          startPoint.y,
          endPoint.x,
          endPoint.y
        );

        return (
          <g key={connection.id} className="connection-group">
            <path
              d={path}
              fill="none"
              stroke="#7C7CFF"
              strokeWidth="2"
              strokeLinecap="round"
              className="connection-path"
              style={{
                filter: 'drop-shadow(0 0 4px rgba(124, 124, 255, 0.3))',
              }}
            />
            <circle
              cx={startPoint.x}
              cy={startPoint.y}
              r="4"
              fill="#7C7CFF"
              className="connection-dot"
            />
            <circle
              cx={endPoint.x}
              cy={endPoint.y}
              r="4"
              fill="#7C7CFF"
              className="connection-dot"
            />
          </g>
        );
      },
      [nodeMap]
    );

    const renderTempConnection = useCallback(() => {
      if (!tempConnection) return null;

      const path = getBezierPath(
        tempConnection.startX,
        tempConnection.startY,
        tempConnection.endX,
        tempConnection.endY
      );

      return (
        <g className="temp-connection-group">
          <path
            d={path}
            fill="none"
            stroke="#7C7CFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="8,4"
            className="temp-connection-path"
            style={{
              filter: 'drop-shadow(0 0 6px rgba(124, 124, 255, 0.5))',
            }}
          />
          <circle
            cx={tempConnection.startX}
            cy={tempConnection.startY}
            r="4"
            fill="#7C7CFF"
          />
          <circle
            cx={tempConnection.endX}
            cy={tempConnection.endY}
            r="6"
            fill="none"
            stroke="#7C7CFF"
            strokeWidth="2"
          />
        </g>
      );
    }, [tempConnection]);

    return (
      <svg
        className="connection-layer"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          overflow: 'visible',
          zIndex: 1,
        }}
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g className="connections">{connections.map(renderConnection)}</g>
        {renderTempConnection()}
      </svg>
    );
  }
);

ConnectionLayer.displayName = 'ConnectionLayer';
