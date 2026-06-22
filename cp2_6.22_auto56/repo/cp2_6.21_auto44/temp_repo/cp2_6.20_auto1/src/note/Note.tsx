import React, { useState, useRef, useEffect } from 'react';
import { NoteData, NoteColor, NOTE_COLORS } from '../types';

interface NoteProps {
  note: NoteData;
  onUpdate: (note: NoteData) => void;
  onDelete: (id: string) => void;
  zIndex: number;
  onDragStart?: () => void;
  onDragMove?: (note: NoteData) => void;
  onDragEnd?: () => void;
  onEditStart?: () => void;
  onEditEnd?: () => void;
  onColorChange?: () => void;
}

const Note: React.FC<NoteProps> = ({
  note,
  onUpdate,
  onDelete,
  zIndex,
  onDragStart,
  onDragMove,
  onDragEnd,
  onEditStart,
  onEditEnd,
  onColorChange,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dragRef = useRef({
    startX: 0,
    startY: 0,
    noteX: 0,
    noteY: 0,
    lastSendTime: 0,
  });

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const lastPositionRef = useRef<{ x: number; y: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditing) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    onDragStart?.();

    const initialX = note.x;
    const initialY = note.y;

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      noteX: initialX,
      noteY: initialY,
      lastSendTime: 0,
    };

    lastPositionRef.current = { x: initialX, y: initialY };

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      const newX = dragRef.current.noteX + dx;
      const newY = dragRef.current.noteY + dy;

      lastPositionRef.current = { x: newX, y: newY };

      const updatedNote = {
        ...note,
        x: newX,
        y: newY,
      };
      onUpdate(updatedNote);

      const now = performance.now();
      if (now - dragRef.current.lastSendTime > 16) {
        dragRef.current.lastSendTime = now;
        onDragMove?.(updatedNote);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);

      if (lastPositionRef.current) {
        const finalNote = {
          ...note,
          x: lastPositionRef.current.x,
          y: lastPositionRef.current.y,
        };
        onDragMove?.(finalNote);
      }

      lastPositionRef.current = null;
      onDragEnd?.();
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEditStart?.();
    setIsEditing(true);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate({
      ...note,
      content: e.target.value,
    });
  };

  const handleBlur = () => {
    setIsEditing(false);
    onEditEnd?.();
  };

  const handleColorSelect = (color: NoteColor) => {
    onColorChange?.();
    onUpdate({
      ...note,
      color,
    });
    setShowColorPicker(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(note.id);
  };

  const handleColorButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowColorPicker(!showColorPicker);
  };

  const bgColor = NOTE_COLORS[note.color];

  const getTransform = () => {
    if (isDragging && isVisible) {
      return 'scale(1.05)';
    }
    return isVisible ? 'scale(1)' : 'scale(0.8)';
  };

  const getOpacity = () => {
    if (!isVisible) return 0;
    if (isDragging) return 0.7;
    return 1;
  };

  const getTransition = () => {
    if (isDragging) {
      return 'box-shadow 0.15s ease-out, opacity 0.15s ease-out';
    }
    return 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out, box-shadow 0.2s ease-in, left 0.2s ease-out, top 0.2s ease-out';
  };

  const getBoxShadow = () => {
    if (isDragging) {
      return '0 16px 32px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.1)';
    }
    return '0 2px 4px rgba(0,0,0,0.1)';
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: note.x,
        top: note.y,
        width: 180,
        minHeight: 120,
        backgroundColor: bgColor,
        borderRadius: 12,
        padding: 12,
        cursor: isEditing ? 'text' : 'move',
        boxShadow: getBoxShadow(),
        zIndex,
        transform: getTransform(),
        transformOrigin: 'center center',
        opacity: getOpacity(),
        transition: getTransition(),
        userSelect: 'none',
        color: '#333',
        willChange: isDragging ? 'transform, box-shadow, opacity' : 'auto',
      }}
      className={isDragging ? 'note-dragging' : ''}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4, marginBottom: 6 }}>
        <button
          onClick={handleColorButtonClick}
          style={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            border: '2px solid rgba(0,0,0,0.2)',
            backgroundColor: bgColor,
            cursor: 'pointer',
            padding: 0,
          }}
          title="更改颜色"
        />
        <button
          onClick={handleDelete}
          style={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            border: 'none',
            backgroundColor: 'rgba(0,0,0,0.1)',
            color: '#333',
            cursor: 'pointer',
            fontSize: 12,
            lineHeight: '20px',
            padding: 0,
          }}
          title="删除便签"
        >
          ×
        </button>
      </div>

      {showColorPicker && (
        <div
          style={{
            position: 'absolute',
            top: 30,
            right: 10,
            display: 'flex',
            gap: 6,
            padding: 6,
            backgroundColor: 'white',
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 10,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {(Object.keys(NOTE_COLORS) as NoteColor[]).map((c) => (
            <button
              key={c}
              onClick={() => handleColorSelect(c)}
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                border: note.color === c ? '2px solid #333' : '2px solid transparent',
                backgroundColor: NOTE_COLORS[c],
                cursor: 'pointer',
                padding: 0,
              }}
            />
          ))}
        </div>
      )}

      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={note.content}
          onChange={handleContentChange}
          onBlur={handleBlur}
          style={{
            width: '100%',
            minHeight: 80,
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none',
            resize: 'none',
            fontFamily: 'inherit',
            fontSize: 14,
            color: '#333',
            cursor: 'text',
          }}
          placeholder="输入便签内容..."
        />
      ) : (
        <div
          style={{
            fontSize: 14,
            lineHeight: 1.4,
            wordWrap: 'break-word',
            minHeight: 60,
            whiteSpace: 'pre-wrap',
          }}
        >
          {note.content || <span style={{ color: 'rgba(0,0,0,0.4)' }}>双击编辑...</span>}
        </div>
      )}
    </div>
  );
};

export default Note;
