import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStory } from '../context/StoryContext';
import { storyGraph } from '../map/storyGraph';
import { TYPE_LABELS } from '../storyData/storyFragment';
import { GraphNode, GraphLink } from '../eventBus';

const NODE_WIDTH = 100;
const NODE_HEIGHT = 60;

export const GraphCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 800, height: 600 });
  const {
    graphNodes,
    graphLinks,
    fragments,
    selectedNodeId,
    selectNode,
    dropFragment,
    deleteLink,
    isPlaybackMode,
    playbackVisibleNodes,
  } = useStory();

  const draggingNodeRef = useRef<string | null>(null);

  useEffect(() => {
    const updateSize = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setSize({ width: rect.width, height: rect.height });
        storyGraph.setSize(rect.width, rect.height);
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const fragmentId = e.dataTransfer.getData('fragmentId');
    if (!fragmentId || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    dropFragment(fragmentId, x, y);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === canvasRef.current) {
      selectNode(null);
    }
  };

  const handleNodeMouseDown = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      e.stopPropagation();
      draggingNodeRef.current = nodeId;
      storyGraph.dragStart(nodeId);

      const onMouseMove = (moveEvent: MouseEvent) => {
        if (!canvasRef.current || !draggingNodeRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = moveEvent.clientX - rect.left;
        const y = moveEvent.clientY - rect.top;
        storyGraph.dragMove(draggingNodeRef.current, x, y);
      };

      const onMouseUp = () => {
        if (draggingNodeRef.current) {
          storyGraph.dragEnd(draggingNodeRef.current);
          draggingNodeRef.current = null;
        }
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },
    []
  );

  const handleLinkClick = (e: React.MouseEvent, linkId: string) => {
    e.stopPropagation();
    deleteLink(linkId);
  };

  const getFragmentById = (id: string) => {
    return fragments.find((f) => f.id === id);
  };

  const isNodeVisible = (nodeId: string) => {
    if (!isPlaybackMode) return true;
    return playbackVisibleNodes.includes(nodeId);
  };

  const isLinkVisible = (link: GraphLink) => {
    if (!isPlaybackMode) return true;
    const sourceVisible = playbackVisibleNodes.includes(link.source);
    const targetVisible = playbackVisibleNodes.includes(link.target);
    return sourceVisible && targetVisible;
  };

  const getNodePosition = (node: GraphNode) => {
    return {
      x: node.x - NODE_WIDTH / 2,
      y: node.y - NODE_HEIGHT / 2,
    };
  };

  const getLinkPath = (link: GraphLink) => {
    const sourceNode = graphNodes.find((n) => n.id === link.source);
    const targetNode = graphNodes.find((n) => n.id === link.target);
    if (!sourceNode || !targetNode) return '';

    const sx = sourceNode.x;
    const sy = sourceNode.y;
    const tx = targetNode.x;
    const ty = targetNode.y;

    return `M ${sx} ${sy} L ${tx} ${ty}`;
  };

  return (
    <div
      ref={canvasRef}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleCanvasClick}
      style={{
        flex: 1,
        backgroundColor: '#FFFFFF',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
      }}
    >
      <svg
        width={size.width}
        height={size.height}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
        }}
      >
        <g>
          {graphLinks.map((link) => {
            const visible = isLinkVisible(link);
            return (
              <g key={link.id} style={{ pointerEvents: visible ? 'stroke' : 'none' }}>
                <motion.path
                  d={getLinkPath(link)}
                  stroke="#D0D0D0"
                  strokeWidth={2}
                  strokeOpacity={visible ? 0.6 : 0}
                  fill="none"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: visible ? 1 : 0 }}
                  transition={{ duration: 0.4, ease: 'easeInOut' }}
                  style={{
                    cursor: 'pointer',
                    pointerEvents: 'stroke',
                  }}
                  onClick={(e) => handleLinkClick(e, link.id)}
                  whileHover={{
                    stroke: '#FF6F61',
                    strokeWidth: 3,
                    strokeOpacity: 1,
                  }}
                />
                <path
                  d={getLinkPath(link)}
                  stroke="transparent"
                  strokeWidth={12}
                  fill="none"
                  style={{
                    cursor: 'pointer',
                    pointerEvents: 'stroke',
                  }}
                  onClick={(e) => handleLinkClick(e, link.id)}
                />
              </g>
            );
          })}
        </g>
      </svg>

      <AnimatePresence>
        {graphNodes.map((node) => {
          const fragment = getFragmentById(node.fragmentId);
          if (!fragment) return null;

          const visible = isNodeVisible(node.id);
          const isSelected = selectedNodeId === node.id;
          const pos = getNodePosition(node);

          return (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{
                opacity: visible ? 1 : 0,
                y: visible ? pos.y : pos.y - 10,
                x: pos.x,
              }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
              onClick={(e) => {
                e.stopPropagation();
                selectNode(node.id);
              }}
              style={{
                position: 'absolute',
                width: NODE_WIDTH,
                height: NODE_HEIGHT,
                borderRadius: 10,
                backgroundColor: '#FFFFFF',
                border: isSelected ? '2px solid #FF6F61' : `2px solid ${fragment.color}`,
                boxShadow: isSelected
                  ? '0 4px 12px rgba(255, 111, 97, 0.3)'
                  : '0 2px 8px rgba(0, 0, 0, 0.1)',
                cursor: 'grab',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                userSelect: 'none',
                pointerEvents: visible ? 'auto' : 'none',
              }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <div
                style={{
                  backgroundColor: fragment.color,
                  color: '#FFFFFF',
                  fontSize: 10,
                  padding: '2px 8px',
                  fontWeight: 500,
                }}
              >
                {TYPE_LABELS[fragment.type]}
              </div>
              <div
                style={{
                  flex: 1,
                  padding: 6,
                  fontSize: 11,
                  color: '#333333',
                  lineHeight: 1.3,
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {fragment.content}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {graphNodes.length === 0 && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#999999',
            fontSize: 14,
            textAlign: 'center',
            pointerEvents: 'none',
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
          <div>将左侧碎片拖拽到这里</div>
          <div style={{ fontSize: 12, marginTop: 8 }}>开始构建你的故事脉络</div>
        </div>
      )}
    </div>
  );
};
