import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Draggable } from 'react-beautiful-dnd';
import { MdClose } from 'react-icons/md';
import { Note } from './themeStore.tsx';

interface NoteCardProps {
  note: Note;
  index: number;
  onDelete: (id: string) => void;
  compact?: boolean;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, index, onDelete, compact = false }) => {
  const [isHovered, setIsHovered] = useState(false);

  const cardStyle = compact
    ? {
        width: 80,
        height: 60,
        borderRadius: 8,
        padding: 6,
      }
    : {
        width: 160,
        height: 120,
        borderRadius: 12,
        padding: 12,
      };

  return (
    <Draggable draggableId={note.id} index={index} isDragDisabled={compact}>
      {(provided, snapshot) => (
        <motion.div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          whileHover={!compact ? { scale: 1.02 } : {}}
          style={{
            ...cardStyle,
            backgroundColor: note.color,
            boxShadow: snapshot.isDragging
              ? '0 12px 24px rgba(0, 0, 0, 0.15)'
              : '0 2px 8px rgba(0, 0, 0, 0.08)',
            position: 'relative',
            cursor: compact ? 'default' : 'grab',
            overflow: 'hidden',
            transition: 'box-shadow 0.2s ease-in-out',
            transform: snapshot.isDragging ? 'scale(1.05) rotate(2deg)' : undefined,
            ...provided.draggableProps.style,
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {!compact && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovered ? 1 : 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(note.id);
              }}
              style={{
                position: 'absolute',
                top: 6,
                right: 6,
                width: 20,
                height: 20,
                borderRadius: '50%',
                backgroundColor: 'rgba(45, 52, 54, 0.8)',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                zIndex: 10,
              }}
            >
              <MdClose size={14} />
            </motion.button>
          )}
          <div
            style={{
              color: '#2D3436',
              fontSize: compact ? 10 : 13,
              lineHeight: compact ? 1.2 : 1.4,
              height: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: compact ? 3 : 5,
              WebkitBoxOrient: 'vertical',
              wordBreak: 'break-word',
            }}
          >
            {note.content}
          </div>
        </motion.div>
      )}
    </Draggable>
  );
};

export default NoteCard;
