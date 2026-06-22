import React, { useState, useRef, useEffect } from 'react';
import { useCanvasStore } from './store';
import type { StickyNoteElement } from './types';
import { STICKY_NOTE_COLOR } from './types';

interface StickyNoteProps {
  element: StickyNoteElement;
  isSelected: boolean;
  canvasWidth: number;
  canvasHeight: number;
}

export const StickyNote: React.FC<StickyNoteProps> = ({ element, isSelected }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(element.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const updateElement = useCanvasStore((state) => state.updateElement);
  const selectElement = useCanvasStore((state) => state.selectElement);
  const currentTool = useCanvasStore((state) => state.currentTool);

  useEffect(() => {
    setEditText(element.text);
  }, [element.text]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentTool === 'select') {
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (editText !== element.text) {
      updateElement(element.id, { text: editText } as Partial<StickyNoteElement>);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value.slice(0, 200);
    setEditText(value);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditing) return;
    e.stopPropagation();
    if (currentTool === 'select') {
      selectElement(element.id, e.shiftKey);
    }
  };

  const animationClass = element.isNew
    ? 'sticky-note-enter'
    : element.isDeleted
    ? 'sticky-note-exit'
    : '';

  return (
    <div
      className={`sticky-note ${animationClass}`}
      style={{
        position: 'absolute',
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
        backgroundColor: STICKY_NOTE_COLOR,
        borderRadius: '4px',
        boxShadow: '2px 2px 8px rgba(0, 0, 0, 0.15)',
        padding: '12px',
        boxSizing: 'border-box',
        cursor: currentTool === 'select' ? (isEditing ? 'text' : 'move') : 'default',
        userSelect: isEditing ? 'text' : 'none',
        border: isSelected ? '2px solid #4A90D9' : '2px solid transparent',
        transformOrigin: 'center center',
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '6px',
          backgroundColor: 'rgba(0, 0, 0, 0.08)',
          borderRadius: '4px 4px 0 0',
        }}
      />

      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={editText}
          onChange={handleChange}
          onBlur={handleBlur}
          maxLength={200}
          style={{
            width: '100%',
            height: 'calc(100% - 8px)',
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none',
            resize: 'none',
            fontFamily: 'inherit',
            fontSize: '14px',
            lineHeight: '1.5',
            color: '#333',
            marginTop: '6px',
          }}
          placeholder="输入便签内容..."
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: 'calc(100% - 8px)',
            marginTop: '6px',
            fontSize: '14px',
            lineHeight: '1.5',
            color: '#333',
            overflow: 'hidden',
            wordWrap: 'break-word',
          }}
        >
          {element.text || <span style={{ color: 'rgba(0,0,0,0.4)' }}>双击编辑便签...</span>}
        </div>
      )}

      {!isEditing && (
        <div
          style={{
            position: 'absolute',
            bottom: '6px',
            right: '8px',
            fontSize: '11px',
            color: 'rgba(0, 0, 0, 0.4)',
          }}
        >
          {element.text.length}/200
        </div>
      )}
    </div>
  );
};
