import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Connection, ThemeType } from '@/types';
import { useTimelineStore } from '@/store/timelineStore';
import '@/styles/Connection.css';

interface ConnectionLineProps {
  connection: Connection;
  nodes: { id: string; x: number; y: number }[];
  theme: ThemeType;
}

const connectionTypeLabels: Record<string, string> = {
  causal: '因果关系',
  parallel: '平行关系',
};

const ConnectionLineComponent = ({ connection, nodes }: ConnectionLineProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const { deleteConnection } = useTimelineStore();

  const fromNode = nodes.find((n) => n.id === connection.fromId);
  const toNode = nodes.find((n) => n.id === connection.toId);

  if (!fromNode || !toNode) return null;

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    deleteConnection(connection.id);
  };

  const startX = fromNode.x;
  const startY = fromNode.y;
  const endX = toNode.x;
  const endY = toNode.y;

  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;
  const controlOffset = Math.abs(endX - startX) * 0.2;

  const pathD = `M ${startX}% ${startY}% Q ${midX}% ${midY - controlOffset}% ${endX}% ${endY}%`;

  return (
    <AnimatePresence mode="wait">
      <motion.g
        key={connection.id}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        exit={{ pathLength: 0, opacity: 0, scale: 0.5 }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
        style={{ transformOrigin: `${midX}% ${midY}%` }}
        onContextMenu={handleContextMenu}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <path
          d={pathD}
          fill="none"
          stroke="transparent"
          strokeWidth="20"
          style={{ cursor: 'pointer' }}
        />
        <motion.path
          d={pathD}
          fill="none"
          stroke="var(--node-color, #4a90d9)"
          strokeWidth={isHovered ? 3 : 2}
          strokeDasharray="8 4"
          style={{ pointerEvents: 'none' }}
          animate={{ strokeDashoffset: isHovered ? 0 : 24 }}
          transition={{ duration: 0.5, repeat: isHovered ? Infinity : 0, ease: 'linear' }}
        />
        <AnimatePresence>
          {isHovered && (
            <motion.foreignObject
              x={`${midX}%`}
              y={`${midY}%`}
              width="100"
              height="32"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{ transform: 'translate(-50%, -50%)', overflow: 'visible' }}
            >
              <div className="connection-label">
                {connectionTypeLabels[connection.type]}
              </div>
            </motion.foreignObject>
          )}
        </AnimatePresence>
      </motion.g>
    </AnimatePresence>
  );
};

export const ConnectionLine = memo(ConnectionLineComponent);
