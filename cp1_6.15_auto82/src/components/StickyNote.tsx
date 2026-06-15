import React, { useState, useRef, useEffect } from 'react';
import { StickyNote as StickyNoteType } from '../types';

interface StickyNoteProps {
  note: StickyNoteType;
  scale: number;
  offsetX: number;
  offsetY: number;
  onUpdate: (note: StickyNoteType) => void;
  onDelete: (id: string) => void;
  isOwn: boolean;
}

const StickyNote: React.FC<StickyNoteProps> = ({
  note,
  scale,
  offsetX,
  offsetY,
  onUpdate,
  onDelete,
  isOwn,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [text, setText] = useState(note.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleDelete = () => {
    setIsDeleting(true);
    setTimeout(() => {
      onDelete(note.id);
    }, 300);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOwn) {
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (text !== note.text) {
      onUpdate({ ...note, text });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setText(note.text);
      setIsEditing(false);
    }
    if (e.key === 'Enter' && e.ctrlKey) {
      handleBlur();
    }
  };

  const left = note.position.x * scale + offsetX;
  const top = note.position.y * scale + offsetY;
  const width = note.width * scale;
  const height = note.height * scale;

  return (
    <div
      className={isDeleting ? 'sticky-delete' : ''}
      onDoubleClick={handleDoubleClick}
      style={{
        position: 'absolute',
        left,
        top,
        width,
        height,
        backgroundColor: '#FFEB9C',
        borderRadius: '4px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        padding: `${16 * scale}px ${12 * scale}px`,
        cursor: isOwn ? 'pointer' : 'default',
        transformOrigin: 'top left',
        zIndex: 50,
        border: '1px solid #E6D28A',
      }}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (isOwn) handleDelete();
        }}
        style={{
          position: 'absolute',
          top: `${4 * scale}px`,
          right: `${4 * scale}px`,
          width: `${20 * scale}px`,
          height: `${20 * scale}px`,
          borderRadius: '50%',
          border: 'none',
          backgroundColor: 'transparent',
          color: '#999',
          cursor: 'pointer',
          fontSize: `${14 * scale}px`,
          lineHeight: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          opacity: 0.7,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '1';
          e.currentTarget.style.color = '#D32F2F';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '0.7';
          e.currentTarget.style.color = '#999';
        }}
      >
        ×
      </button>

      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none',
            resize: 'none',
            fontSize: `${18 * scale}px`,
            color: '#333',
            fontFamily: 'inherit',
            lineHeight: 1.4,
          }}
        />
      ) : (
        <div style={{
          fontSize: `${18 * scale}px`,
          color: '#333',
          lineHeight: 1.4,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          overflow: 'hidden',
          width: '100%',
          height: '100%',
        }}>
          {note.text || <span style={{ color: '#999' }}>双击编辑...</span>}
        </div>
      )}
    </div>
  );
};

export default StickyNote;
