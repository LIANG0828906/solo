import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, useDragControls } from 'framer-motion';
import type { IdeaCard as IdeaCardType } from '@/types';
import { ColorSwatch } from './ColorSwatch';
import { ContextMenu } from './ContextMenu';

interface IdeaCardProps {
  card: IdeaCardType;
  projectId: string;
  onMove: (cardId: string, position: { x: number; y: number }) => void;
  onUpdateNote: (cardId: string, note: string) => void;
  onDelete: (cardId: string) => void;
  zIndex: number;
}

export const IdeaCard = ({
  card,
  projectId: _projectId,
  onMove,
  onUpdateNote,
  onDelete,
  zIndex,
}: IdeaCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editNote, setEditNote] = useState(card.note);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [tempPosition, setTempPosition] = useState(card.position);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dragControls = useDragControls();
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = useCallback(() => {
    if (!isDragging) {
      setIsEditing(true);
    }
  }, [isDragging]);

  const handleNoteSave = useCallback(() => {
    onUpdateNote(card.id, editNote);
    setIsEditing(false);
  }, [card.id, editNote, onUpdateNote]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleNoteSave();
      }
      if (e.key === 'Escape') {
        setEditNote(card.note);
        setIsEditing(false);
      }
    },
    [handleNoteSave, card.note]
  );

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  const handleDelete = useCallback(() => {
    setIsDeleted(true);
    setTimeout(() => {
      onDelete(card.id);
    }, 200);
  }, [card.id, onDelete]);

  const handleEdit = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: { point: { x: number; y: number } }) => {
      setTimeout(() => setIsDragging(false), 100);
      const boardElement = document.querySelector('.idea-board');
      if (boardElement) {
        const rect = boardElement.getBoundingClientRect();
        const newPosition = {
          x: Math.max(0, info.point.x - rect.left - 100),
          y: Math.max(0, info.point.y - rect.top - 140),
        };
        setTempPosition(newPosition);
        onMove(card.id, newPosition);
      }
    },
    [card.id, onMove]
  );

  const displayPosition = isDragging ? tempPosition : card.position;

  return (
    <>
      <motion.div
        ref={cardRef}
        className="idea-card"
        style={{
          x: displayPosition.x,
          y: displayPosition.y,
          zIndex,
        }}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{
          scale: isDeleted ? 0 : isDragging ? 1.05 : 1,
          opacity: isDeleted ? 0 : 1,
          x: displayPosition.x,
          y: displayPosition.y,
        }}
        exit={{ scale: 0, opacity: 0, x: -100 }}
        transition={{
          scale: { duration: isDeleted ? 0.2 : isDragging ? 0.1 : 0.25, ease: isDeleted ? 'easeIn' : 'easeOut' },
          opacity: { duration: 0.2 },
          x: { duration: 0.2, ease: 'easeOut' },
          y: { duration: 0.2, ease: 'easeOut' },
        }}
        drag
        dragControls={dragControls}
        dragMomentum={false}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        whileHover={{ boxShadow: '0 12px 40px rgba(0, 0, 0, 0.25)' }}
      >
        {isDragging && (
          <motion.div
            className="drag-placeholder"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
          />
        )}
        <div className="card-image-container">
          <img src={card.imageUrl} alt={card.imageName} className="card-image" loading="lazy" />
        </div>
        <div className="card-colors">
          {card.colors.map((color, index) => (
            <ColorSwatch key={index} color={color} index={index} />
          ))}
        </div>
        <div className="card-note-container">
          {isEditing ? (
            <textarea
              ref={textareaRef}
              className="card-note-input"
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
              onBlur={handleNoteSave}
              onKeyDown={handleKeyDown}
              placeholder="添加注释..."
            />
          ) : (
            <p className="card-note">{card.note || '双击添加注释...'}</p>
          )}
        </div>
      </motion.div>
      <ContextMenu
        x={contextMenu?.x || 0}
        y={contextMenu?.y || 0}
        isOpen={contextMenu !== null}
        onClose={() => setContextMenu(null)}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </>
  );
};
