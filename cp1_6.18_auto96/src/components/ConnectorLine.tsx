import React, { useState, useRef, useCallback, useEffect, memo } from 'react';
import { useBoardStore } from '@/stores/boardStore';
import { Connection } from '@/types';
import { getBezierPath, getNodeBottom, getNodeTop } from '@/utils';

interface Props {
  connection: Connection;
}

const ConnectorLine = ({ connection }: Props) => {
  const {
    nodes,
    selectedConnectionId,
    selectConnection,
    deleteConnection,
    updateConnection,
  } = useBoardStore();

  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelInput, setLabelInput] = useState(connection.label);

  const svgPathRef = useRef<SVGPathElement>(null);

  const fromNode = nodes.find((n) => n.id === connection.fromNodeId);
  const toNode = nodes.find((n) => n.id === connection.toNodeId);

  if (!fromNode || !toNode) return null;

  const from = getNodeBottom(fromNode);
  const to = getNodeTop(toNode);
  const path = getBezierPath(from, to, 0.5);

  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;

  const isSelected = selectedConnectionId === connection.id;

  const handlePathClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      selectConnection(connection.id);
    },
    [connection.id, selectConnection]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenuPosition({ x: e.clientX, y: e.clientY });
      setShowContextMenu(true);
    },
    []
  );

  const handleEditLabel = useCallback(() => {
    setShowContextMenu(false);
    setEditingLabel(true);
    setLabelInput(connection.label);
  }, [connection.label]);

  const handleDeleteConnection = useCallback(() => {
    setShowContextMenu(false);
    deleteConnection(connection.id);
  }, [connection.id, deleteConnection]);

  const handleLabelKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        updateConnection(connection.id, { label: labelInput });
        setEditingLabel(false);
      } else if (e.key === 'Escape') {
        setLabelInput(connection.label);
        setEditingLabel(false);
      }
    },
    [connection.id, connection.label, labelInput, updateConnection]
  );

  useEffect(() => {
    const handleDocumentClick = () => {
      setShowContextMenu(false);
    };
    if (showContextMenu) {
      document.addEventListener('click', handleDocumentClick);
    }
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [showContextMenu]);

  useEffect(() => {
    setLabelInput(connection.label);
  }, [connection.label]);

  return (
    <g>
      <path
        ref={svgPathRef}
        d={path}
        className={`connection-line animated${isSelected ? ' selected' : ''}`}
        onClick={handlePathClick}
        onContextMenu={handleContextMenu}
      />
      {connection.label && !editingLabel && (
        <text
          x={midX}
          y={midY}
          textAnchor="middle"
          fill="var(--text-primary)"
          fontSize="12"
          style={{ pointerEvents: 'none' }}
        >
          {connection.label}
        </text>
      )}
      {showContextMenu && (
        <div
          className="context-menu"
          style={{ left: contextMenuPosition.x, top: contextMenuPosition.y }}
        >
          <div className="context-menu-item" onClick={handleEditLabel}>
            编辑标签
          </div>
          <div className="context-menu-item danger" onClick={handleDeleteConnection}>
            删除连线
          </div>
        </div>
      )}
      {editingLabel && (
        <div
          className="connection-label-edit"
          style={{ left: midX - 60, top: midY - 16 }}
        >
          <input
            type="text"
            className="connection-label-input"
            value={labelInput}
            onChange={(e) => setLabelInput(e.target.value)}
            onKeyDown={handleLabelKeyDown}
            autoFocus
          />
        </div>
      )}
    </g>
  );
};

export default memo(ConnectorLine, (prev, next) => {
  return (
    prev.connection.id === next.connection.id &&
    prev.connection.fromNodeId === next.connection.fromNodeId &&
    prev.connection.toNodeId === next.connection.toNodeId &&
    prev.connection.label === next.connection.label
  );
});
