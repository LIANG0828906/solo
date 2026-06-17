import React, { useState, useRef, useCallback, useEffect, memo } from 'react';
import { BoardNode, NodeTypeColors, NodeTypeLabels } from '@/types';
import { useBoardStore } from '@/stores/boardStore';
import { truncateText } from '@/utils';

interface Props {
  node: BoardNode;
  onEdit: (nodeId: string) => void;
  onStartConnection: (nodeId: string) => void;
  scrollOffset: { x: number; y: number };
}

const CardNode: React.FC<Props> = ({ node, onEdit, onStartConnection, scrollOffset }) => {
  const { selectedNodeId, selectNode, moveNode } = useBoardStore();
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const nodeRef = useRef<HTMLDivElement>(null);
  const isSelected = selectedNodeId === node.id;

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).classList.contains('card-connector')) return;
      e.stopPropagation();
      selectNode(node.id);
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - node.x,
        y: e.clientY - node.y,
      });
    },
    [node.id, node.x, node.y, selectNode]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      const newX = e.clientX - dragOffset.x + scrollOffset.x;
      const newY = e.clientY - dragOffset.y + scrollOffset.y;
      moveNode(node.id, Math.max(0, newX), Math.max(0, newY));
    },
    [isDragging, dragOffset, node.id, moveNode, scrollOffset]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onEdit(node.id);
    },
    [node.id, onEdit]
  );

  const handleConnectorMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      onStartConnection(node.id);
    },
    [node.id, onStartConnection]
  );

  useEffect(() =>