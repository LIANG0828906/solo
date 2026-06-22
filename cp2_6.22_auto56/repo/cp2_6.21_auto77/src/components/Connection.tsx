import React, { useState, useEffect, useRef } from 'react';
import type { Connection, BrainstormNode } from '@/types';

interface ConnectionProps {
  connection: Connection;
  fromNode: BrainstormNode | undefined;
  toNode: BrainstormNode | undefined;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function Connection({
  connection,
  fromNode,
  toNode,
  isSelected,
  onSelect,
  onDelete,
}: ConnectionProps) {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const handleClickOutside = () => {
      setShowContextMenu(false);
    };
    if (showContextMenu) {
      window.addEventListener('click', handleClickOutside);
      return () => window.removeEventListener('click', handleClickOutside);
    }
  }, [showContextMenu]);

  if (!fromNode || !toNode) return null;

  const fromX = fromNode.x + fromNode.width;
  const fromY = fromNode.y + fromNode.height / 2;
  const toX = toNode.x;
  const toY = toNode.y + toNode.height / 2;

  const dx = Math.abs(toX - fromX);
  const controlOffset = Math.max(50, dx * 0.5);

  const pathD = `M ${fromX} ${fromY} C ${fromX + controlOffset} ${fromY}, ${toX - controlOffset} ${toY}, ${toX} ${toY}`;

  const arrowId = `arrow-${connection.id}`;
  const arrowColor = isSelected ? '#2196F3' : '#BDBDBD';

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(connection.id);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
    onSelect(connection.id);
  };

  const handleDelete = () => {
    onDelete(connection.id);
    setShowContextMenu(false);
  };

  return (
    <g>
      <defs>
        <marker
          id={arrowId}
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
          style={{ transition: 'all 0.2s ease' }}
        >
          <path
            d="M 0 0 L 10 5 L 0 10 z"
            fill={arrowColor}
          />
        </marker>
      </defs>
      <path
        d={pathD}
        fill="none"
        stroke="transparent"
        strokeWidth={16}
        style={{ cursor: 'pointer' }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      />
      <path
        ref={pathRef}
        d={pathD}
        fill="none"
        stroke={isSelected ? '#2196F3' : '#BDBDBD'}
        strokeWidth={isSelected ? 3 : 2}
        markerEnd={`url(#${arrowId})`}
        style={{
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          pointerEvents: 'none',
        }}
      />
      {showContextMenu && (
        <foreignObject x={menuPosition.x - 10} y={menuPosition.y - 10} width={120} height={40}>
          <div
            style={{
              position: 'fixed',
              left: menuPosition.x,
              top: menuPosition.y,
              backgroundColor: '#FFFFFF',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              padding: '4px 0',
              minWidth: '100px',
              zIndex: 1000,
            }}
          >
            <div
              onClick={handleDelete}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                color: '#D32F2F',
                cursor: 'pointer',
                fontFamily: "'Roboto', sans-serif",
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#FFEBEE';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              删除连线
            </div>
          </div>
        </foreignObject>
      )}
    </g>
  );
}
