import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useBoardStore } from '@/stores/boardStore';
import { BoardNode, NodeTypeColors, NodeTypeLabels, NodeType } from '@/types';
import { FileText, User, Zap, Settings, LucideIcon } from 'lucide-react';
import ConnectorLine from './ConnectorLine';

interface Props {
  onCreateNode: (position: { x: number; y: number }) => void;
  onEditNode: (nodeId: string) => void;
}

const typeIcons: Record<NodeType, LucideIcon> = {
  scene: FileText,
  character: User,
  event: Zap,
  setting: Settings,
};

const KanbanBoard: React.FC<Props> = ({ onCreateNode, onEditNode }) => {
  const { nodes, connections, selectedNodeId, selectNode, moveNode, isReverting } = useBoardStore();
  const boardRef = useRef<HTMLDivElement>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleBoardClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === boardRef.current) {
        const rect = boardRef.current!.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        onCreateNode({ x, y });
        selectNode(null);
      }
    },
    [onCreateNode, selectNode]
  );

  const handleNodeMouseDown = useCallback(
    (e: React.MouseEvent, node: BoardNode) => {
      e.stopPropagation();
      selectNode(node.id);
      setDraggingNodeId(node.id);
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    },
    [selectNode]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!draggingNodeId || !boardRef.current) return;
      const rect = boardRef.current.getBoundingClientRect();
      const x = e.client