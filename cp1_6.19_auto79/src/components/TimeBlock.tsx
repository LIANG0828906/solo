import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaBriefcase, FaBook, FaHome, FaRunning, FaUsers, FaEllipsisH } from 'react-icons/fa';
import { TimeBlock as TimeBlockType, Category, CATEGORY_LABELS } from '@/types/types';
import { minutesToTime } from '@/data/store';

interface TimeBlockProps {
  block: TimeBlockType;
  top: number;
  height: number;
  onClick: (e: React.MouseEvent) => void;
  isWeekView?: boolean;
}

const categoryIcons: Record<Category, React.ReactNode> = {
  [Category.Work]: <FaBriefcase size={10} />,
  [Category.Learning]: <FaBook size={10} />,
  [Category.Life]: <FaHome size={10} />,
  [Category.Sport]: <FaRunning size={10} />,
  [Category.Social]: <FaUsers size={10} />,
  [Category.Other]: <FaEllipsisH size={10} />,
};

export default function TimeBlock({ block, top, height, onClick, isWeekView = false }: TimeBlockProps) {
  const [showNote, setShowNote] = useState(false);

  const displayName = isWeekView ? '' : block.name || CATEGORY_LABELS[block.category];

  return (
    <motion.div
      className="timeline-block absolute left-10 right-4 cursor-pointer group"
      style={{
        top: `${top}px`,
        height: `${height}px`,
        backgroundColor: block.color,
        borderRadius: '8px',
        zIndex: 10,
      }}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300, duration: 0.2 }}
      onClick={onClick}
      onMouseEnter={() => setShowNote(true)}
      onMouseLeave={() => setShowNote(false)}
      whileHover={{
        width: 'calc(100% + 5px)',
        marginLeft: '-2.5px',
        transition: { duration: 0.2 },
      }}
    >
      <div className="h-full px-2 py-1 flex flex-col justify-between overflow-hidden">
        <div className="flex items-center gap-1.5 min-h-0">
          <span className="text-white/90 flex-shrink-0">{categoryIcons[block.category]}</span>
          {!isWeekView && (
            <span className="text-white text-xs font-medium truncate">{displayName}</span>
          )}
        </div>
        {!isWeekView && height > 40 && (
          <div className="font-mono text-[10px] text-white/70">
            {minutesToTime(block.startTime)} - {minutesToTime(block.endTime)}
          </div>
        )}
      </div>

      {block.note && showNote && (
        <motion.div
          className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-20 min-w-[150px] max-w-[250px]"
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -5 }}
          transition={{ duration: 0.2 }}
        >
          <div className="glass-card p-2 text-xs text-white">
            <div className="font-semibold mb-1">{block.name || CATEGORY_LABELS[block.category]}</div>
            <div className="text-gray-300">{block.note}</div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
