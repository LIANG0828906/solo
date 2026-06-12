import { memo, useMemo } from 'react';
import type { MindMapNode } from '@/types/mindMap';
import { DEFAULT_NODE_WIDTH, DEFAULT_NODE_HEIGHT } from '@/types/mindMap';

interface ConnectionLinesProps {
  nodes: Record<string, MindMapNode>;
  rootId: string;
}

function buildPaths(
  nodes: Record<string, MindMapNode>,
  rootId: string
): { id: string; d: string }[] {
  const paths: { id: string; d: string }[] = [];
  const visited = new Set<string>();
  const stack = [rootId];

  while (stack.length > 0) {
    const parentId = stack.pop()!;
    if (visited.has(parentId)) continue;
    visited.add(parentId);

    const parent = nodes[parentId];
    if (!parent) continue;

    const parentCenterX = parent.x + (parent.width ?? DEFAULT_NODE_WIDTH) / 2;
    const parentBottomY = parent.y + (parent.height ?? DEFAULT_NODE_HEIGHT);

    for (const childId of parent.children) {
      const child = nodes[childId];
      if (!child) continue;

      const childCenterX = child.x + (child.width ?? DEFAULT_NODE_WIDTH) / 2;
      const childTopY = child.y;

      const midY = (parentBottomY + childTopY) / 2;

      const d = `M ${parentCenterX} ${parentBottomY} C ${parentCenterX} ${midY}, ${childCenterX} ${midY}, ${childCenterX} ${childTopY}`;
      paths.push({ id: `${parentId}-${childId}`, d });

      if (!visited.has(childId)) {
        stack.push(childId);
      }
    }
  }

  return paths;
}

function ConnectionLinesInner({ nodes, rootId }: ConnectionLinesProps) {
  const paths = useMemo(() => buildPaths(nodes, rootId), [nodes, rootId]);

  return (
    <svg
      className="connection-svg"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'visible',
      }}
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="6"
          markerHeight="6"
          refX="5"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 6 3, 0 6" fill="#999" />
        </marker>
      </defs>
      {paths.map(({ id, d }) => (
        <path
          key={id}
          d={d}
          fill="none"
          stroke="#999"
          strokeWidth={2}
          strokeLinecap="round"
          style={{
            transition: 'd 0.3s ease',
          }}
        />
      ))}
    </svg>
  );
}

export const ConnectionLines = memo(ConnectionLinesInner);
