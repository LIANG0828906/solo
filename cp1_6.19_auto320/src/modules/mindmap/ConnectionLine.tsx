import React from 'react';
import { MindMapNode } from './types';

interface ConnectionLineProps {
  parent: MindMapNode;
  child: MindMapNode;
}

export const ConnectionLine: React.FC<ConnectionLineProps> = React.memo(({ parent, child }) => {
  const startX = parent.x;
  const startY = parent.y + 30;
  const endX = child.x;
  const endY = child.y - 30;

  const controlY1 = startY + Math.abs(endY - startY) * 0.5;
  const controlY2 = endY - Math.abs(endY - startY) * 0.5;

  const path = `M ${startX} ${startY} C ${startX} ${controlY1}, ${endX} ${controlY2}, ${endX} ${endY}`;

  return (
    <path
      d={path}
      stroke="#0f3460"
      strokeWidth={2}
      fill="none"
      style={{ transition: 'd 0.05s ease-out' }}
    />
  );
});

ConnectionLine.displayName = 'ConnectionLine';
