import React, { useState, useRef, useEffect } from 'react';
import { NoteData, NoteColor, NOTE_COLORS } from '../types';

interface NoteProps {
  note: NoteData;
  onUpdate: (note: NoteData) => void;
  onDelete: (id: string) => void;
  zIndex: number;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onEditStart?: () => void;
  onEditEnd?: () => void;
  onColorChange?: () => void;
}

const Note: React.FC<NoteProps> = ({ note, onUpdate, onDelete, zIndex, onDragStart, onDragEnd, onEditStart, onEditEnd, onColorChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dragRef = useRef({ startX: 0, startY: 0, noteX: 0, noteY: 0 });

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

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditing) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    onDragStart?.();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      noteX: note.x,
      noteY: note.y,
    };

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      onUpdate({
        ...note,
        x: dragRef.current.noteX + dx,
        y: dragRef.current.noteY + dy,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
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
        boxShadow: isDragging
          ? '0 12px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,0,0,0.1)'
          : '0 2px 4px rgba(0,0,0,0.1)',
        zIndex,
        transform: getTransform(),
        transformOrigin: 'center center',
        opacity: isVisible ? 1 : 0,
        transition: isDragging
          ? 'box-shadow 0.15s ease-out, opacity 0.3s ease-in-out'
          : 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out, box-shadow 0.15s ease-in',
        userSelect: 'none',
        color: '#333',
        willChange: 'transform, box-shadow',
      }}
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
