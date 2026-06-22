import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TimelineNode as TimelineNodeType, ThemeType } from '@/types';
import { useTimelineStore } from '@/store/timelineStore';
import '@/styles/Node.css';

interface TimelineNodeProps {
  node: TimelineNodeType;
  theme: ThemeType;
  editorRef: React.RefObject<HTMLDivElement | null>;
  onStartDragConnection: (nodeId: string, e: React.MouseEvent) => void;
}

const TimelineNodeComponent = ({
  node,
  editorRef,
  onStartDragConnection,
}: TimelineNodeProps) => {
  const { toggleExpand, selectNode, clearNewFlag } = useTimelineStore();

  const handleNodeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectNode(node.id);
    toggleExpand(node.id);
  };

  const handleAnimationComplete = () => {
    if (node.isNew) {
      clearNewFlag(node.id);
    }
  };

  const handleConnectionStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onStartDragConnection(node.id, e);
  };

  return (
    <motion.div
      className="timeline-node-wrapper"
      style={{
        left: `${node.x}%`,
        top: `${node.y}%`,
      }}
      initial={node.isNew ? { scale: 0, opacity: 0 } : false}
      animate={{
        scale: 1,
        opacity: 1,
        y: node.isNew ? [0, -10, 0] : 0,
      }}
      transition={
        node.isNew
          ? {
              scale: { type: 'spring', stiffness: 400, damping: 15 },
              opacity: { duration: 0.2 },
              y: { type: 'spring', stiffness: 300, damping: 15, delay: 0.1 },
            }
          : {}
      }
      onAnimationComplete={handleAnimationComplete}
    >
      <motion.div
        className="timeline-node-dot"
        onClick={handleNodeClick}
        onMouseDown={handleConnectionStart}
        whileHover={{ scale: 1.3 }}
        whileTap={{ scale: 0.9 }}
        data-node-id={node.id}
      >
        <div className="timeline-node-dot-inner" />
      </motion.div>

      <AnimatePresence>
        {node.expanded && (
          <motion.div
            className="timeline-node-card"
            initial={{ y: -20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -10, opacity: 0, scale: 0.95 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 20,
              duration: 0.3,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {node.imageUrl && (
              <img
                src={node.imageUrl}
                alt={node.title}
                className="timeline-node-image"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            <div className="timeline-node-content">
              <h3 className="timeline-node-title">{node.title}</h3>
              <p className="timeline-node-date">{node.date}</p>
              <p className="timeline-node-description">{node.description}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const TimelineNode = memo(TimelineNodeComponent);
