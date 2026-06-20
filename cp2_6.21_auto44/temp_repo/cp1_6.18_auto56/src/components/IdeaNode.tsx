import React, { memo, useCallback, useRef, useState } from 'react';
import type { IdeaNode as IdeaNodeType } from '@/shared/types';
import { useBoardStore } from '@/store/boardStore';
import { ideaService } from '@/services/ideaService';
import { screenToWorld } from '@/shared/utils';

interface IdeaNodeProps {
  node: IdeaNodeType;
}

export const IdeaNode: React.FC<IdeaNodeProps> = memo(({ node }) => {
  const [isHovered, setIsHovered] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);

  const {
    selectedNodeId,
    zoom,
    pan,
    draggingNodeId,
    animatingNodeIds,
    selectNode,
    setDraggingNodeId,
    setDragOffset,
    setIsCreatingConnection,
    setTempConnection,
    setShowNodePanel,
    setPanelNodeId,
    setPanelPosition,
    addAnimatingNode,
    removeAnimatingNode,
  } = useBoardStore();

  const isSelected = selectedNodeId === node.id;
  const isDragging = draggingNodeId === node.id;
  const isAnimating = animatingNodeIds.has(node.id);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (e.button !== 0) return;

      const rect = nodeRef.current?.getBoundingClientRect();
      if (!rect) return;

      const worldPos = screenToWorld(e.clientX, e.clientY, pan, zoom);
      const offsetX = worldPos.x - node.x;
      const offsetY = worldPos.y - node.y;

      selectNode(node.id);
      setDraggingNodeId(node.id);
      setDragOffset({ x: offsetX, y: offsetY });
    },
    [node.id, node.x, node.y, pan, zoom, selectNode, setDraggingNodeId, setDragOffset]
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const rect = nodeRef.current?.getBoundingClientRect();
      if (!rect) return;

      setPanelNodeId(node.id);
      setPanelPosition({ x: e.clientX, y: e.clientY });
      setShowNodePanel(true);
    },
    [node.id, setPanelNodeId, setPanelPosition, setShowNodePanel]
  );

  const handleConnectionStart = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      const startX = node.x + node.width;
      const startY = node.y + node.height;

      setIsCreatingConnection(true);
      setTempConnection({
        fromId: node.id,
        startX,
        startY,
        endX: startX,
        endY: startY,
      });
    },
    [
      node.id,
      node.x,
      node.y,
      node.width,
      node.height,
      setIsCreatingConnection,
      setTempConnection,
    ]
  );

  const handleVote = useCallback(
    async (type: 'up' | 'down') => {
      addAnimatingNode(node.id);
      await ideaService.vote({ nodeId: node.id, type });
      setTimeout(() => {
        removeAnimatingNode(node.id);
      }, 300);
    },
    [node.id, addAnimatingNode, removeAnimatingNode]
  );

  const handleVoteUp = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      handleVote('up');
    },
    [handleVote]
  );

  const handleVoteDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      handleVote('down');
    },
    [handleVote]
  );

  const transform = `translate(${node.x}px, ${node.y}px)`;
  const opacity = isDragging ? 0.5 : 1;

  return (
    <>
      {isDragging && (
        <div
          className="idea-node-ghost"
          style={{
            position: 'absolute',
            transform,
            width: node.width,
            height: node.height,
            borderRadius: 16,
            backgroundColor: 'rgba(124, 124, 255, 0.1)',
            border: '1.5px dashed rgba(124, 124, 255, 0.5)',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
      )}
      <div
        ref={nodeRef}
        className={`idea-node ${isSelected ? 'selected' : ''} ${
          isAnimating ? 'animating' : ''
        }`}
        style={{
          position: 'absolute',
          transform,
          width: node.width,
          minHeight: node.height,
          opacity,
          zIndex: isSelected ? 10 : isDragging ? 5 : 2,
          transition: isDragging ? 'none' : 'opacity 0.3s ease',
          willChange: 'transform',
        }}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="idea-node-content">
          <div className="idea-node-title">{node.title}</div>
          <div className="idea-node-body">{node.content}</div>
          <div className="idea-node-footer">
            <button
              className={`vote-btn vote-up ${isAnimating ? 'pulse-up' : ''}`}
              onClick={handleVoteUp}
              title="赞成"
            >
              <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                <path
                  d="M12 4L4 15h5v5h6v-5h5L12 4z"
                  fill="currentColor"
                />
              </svg>
              <span className="vote-count">{node.votes.up}</span>
            </button>
            <button
              className={`vote-btn vote-down ${isAnimating ? 'pulse-down' : ''}`}
              onClick={handleVoteDown}
              title="反对"
            >
              <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                <path
                  d="M12 20L20 9h-5V4H9v5H4l8 11z"
                  fill="currentColor"
                />
              </svg>
              <span className="vote-count">{node.votes.down}</span>
            </button>
          </div>
        </div>
        {(isHovered || isSelected) && (
          <div
            className="connection-handle"
            onMouseDown={handleConnectionStart}
            title="拖拽创建连接"
          />
        )}
      </div>
    </>
  );
});

IdeaNode.displayName = 'IdeaNode';
