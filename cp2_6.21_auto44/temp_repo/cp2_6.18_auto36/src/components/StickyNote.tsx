import { useState, useRef, useEffect } from 'react';
import type { StickyNote as StickyNoteType } from '@/types';
import { CONSTANTS } from '@/constants';

interface StickyNoteProps {
  note: StickyNoteType;
  scale: number;
  isSelected: boolean;
  isConnectionStart: boolean;
  onUpdate: (note: StickyNoteType) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string | null) => void;
  onStartConnection: (id: string) => void;
  onEndConnection: (id: string) => void;
}

export function StickyNote({
  note,
  scale,
  isSelected,
  isConnectionStart,
  onUpdate,
  onDelete,
  onSelect,
  onStartConnection,
  onEndConnection,
}: StickyNoteProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(note.text);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [dragDirection, setDragDirection] = useState<1 | -1>(1);
  const [lastMouseX, setLastMouseX] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(
        textareaRef.current.value.length,
        textareaRef.current.value.length
      );
    }
  }, [isEditing]);

  useEffect(() => {
    setEditText(note.text);
  }, [note.text]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditing) return;

    if (e.ctrlKey || e.metaKey) {
      e.stopPropagation();
      if (isConnectionStart) {
        onEndConnection(note.id);
      } else {
        onStartConnection(note.id);
      }
      return;
    }

    e.stopPropagation();
    onSelect(note.id);
    setIsDragging(true);
    setLastMouseX(e.clientX);
    setDragDirection(Math.random() > 0.5 ? 1 : -1);
    setDragOffset({
      x: e.clientX / scale - note.x,
      y: e.clientY / scale - note.y,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const newX = e.clientX / scale - dragOffset.x;
    const newY = e.clientY / scale - dragOffset.y;

    onUpdate({
      ...note,
      x: newX,
      y: newY,
    });

    const deltaX = e.clientX - lastMouseX;
    setLastMouseX(e.clientX);

    const totalDeltaX = Math.abs(e.clientX / scale - dragOffset.x - note.x);
    const totalDeltaY = Math.abs(e.clientY / scale - dragOffset.y - note.y);
    const distance = Math.sqrt(totalDeltaX * totalDeltaX + totalDeltaY * totalDeltaY);

    const baseRotation = Math.min(5, distance / 20);
    const wobble = Math.sin(Date.now() / 100) * 0.5;
    const direction = deltaX >= 0 ? 1 : -1;

    setRotation((baseRotation + wobble) * direction * dragDirection);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setRotation(0);
  };

  useEffect(() => {
    if (isDragging) {
      const handleMove = (e: MouseEvent) => handleMouseMove(e);
      const handleUp = () => handleMouseUp();
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
      return () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
      };
    }
  }, [isDragging, dragOffset, note, scale, dragDirection, lastMouseX, onUpdate]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= CONSTANTS.MAX_NOTE_TEXT) {
      setEditText(value);
    }
  };

  const handleTextBlur = () => {
    setIsEditing(false);
    onUpdate({
      ...note,
      text: editText,
    });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(note.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
      onUpdate({
        ...note,
        text: editText,
      });
    }
  };

  const handleDeleteBtnMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    (e.currentTarget as HTMLElement).style.transform = 'scale(0.9)';
  };

  const handleDeleteBtnMouseUp = (e: React.MouseEvent) => {
    (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
  };

  return (
    <div
      style={{
        ...noteStyle,
        width: note.width,
        height: note.height,
        opacity: isDragging ? 0.7 : 1,
        transform: `rotate(${rotation}deg)`,
        transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease',
        border: isConnectionStart ? '2px dashed #4A90D9' : isSelected ? '2px solid rgba(74, 144, 217, 0.5)' : 'none',
        boxShadow: isConnectionStart
          ? '0 4px 12px rgba(74, 144, 217, 0.3)'
          : isSelected
          ? '0 6px 20px rgba(0, 0, 0, 0.15)'
          : '0 4px 12px rgba(0, 0, 0, 0.12)',
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      <button
        style={deleteButtonStyle}
        onClick={handleDelete}
        onMouseDown={handleDeleteBtnMouseDown}
        onMouseUp={handleDeleteBtnMouseUp}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
        }}
      >
        ×
      </button>

      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={editText}
          onChange={handleTextChange}
          onBlur={handleTextBlur}
          onKeyDown={handleKeyDown}
          style={textareaStyle}
          placeholder="输入便签内容..."
          maxLength={CONSTANTS.MAX_NOTE_TEXT}
        />
      ) : (
        <div style={noteTextStyle}>
          {note.text || (
            <span style={placeholderStyle}>双击编辑...</span>
          )}
        </div>
      )}

      {isConnectionStart && (
        <>
          <div style={connectionIndicatorStyle}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4A90D9" strokeWidth="2.5">
              <circle cx="12" cy="12" r="9"/>
              <path d="M8 12h8M12 8v8"/>
            </svg>
          </div>
          <span style={connectionHintStyle}>Ctrl+点击另一个便签连接</span>
        </>
      )}

      {!isEditing && note.text.length >= CONSTANTS.MAX_NOTE_TEXT - 20 && (
        <div style={charCountStyle}>
          {note.text.length}/{CONSTANTS.MAX_NOTE_TEXT}
        </div>
      )}
    </div>
  );
}

const noteStyle: React.CSSProperties = {
  position: 'relative',
  backgroundColor: CONSTANTS.NOTE_BG,
  borderRadius: `${CONSTANTS.NOTE_RADIUS}px`,
  padding: '16px',
  paddingTop: '28px',
  cursor: 'move',
  userSelect: 'none',
  willChange: 'transform',
  boxSizing: 'border-box',
};

const deleteButtonStyle: React.CSSProperties = {
  position: 'absolute',
  top: '-10px',
  right: '-10px',
  width: '20px',
  height: '20px',
  borderRadius: '50%',
  backgroundColor: CONSTANTS.DELETE_BTN_COLOR,
  color: '#fff',
  border: '2px solid #fff',
  fontSize: '16px',
  lineHeight: '1',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  boxShadow: '0 2px 8px rgba(255, 107, 107, 0.4)',
  transition: 'transform 0.15s ease',
  zIndex: 10,
};

const textareaStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  border: 'none',
  backgroundColor: 'transparent',
  resize: 'none',
  fontFamily: 'inherit',
  fontSize: '14px',
  lineHeight: 1.5,
  color: '#333',
  outline: 'none',
  padding: 0,
  margin: 0,
};

const noteTextStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  fontSize: '14px',
  lineHeight: 1.5,
  color: '#333',
  overflow: 'hidden',
  wordWrap: 'break-word',
  pointerEvents: 'none',
};

const placeholderStyle: React.CSSProperties = {
  color: '#999',
  fontStyle: 'italic',
};

const connectionIndicatorStyle: React.CSSProperties = {
  position: 'absolute',
  top: '-8px',
  left: '50%',
  transform: 'translateX(-50%)',
  backgroundColor: '#fff',
  borderRadius: '50%',
  padding: '4px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
};

const connectionHintStyle: React.CSSProperties = {
  position: 'absolute',
  top: '-32px',
  left: '50%',
  transform: 'translateX(-50%)',
  backgroundColor: '#4A90D9',
  color: '#fff',
  padding: '4px 8px',
  borderRadius: '4px',
  fontSize: '12px',
  whiteSpace: 'nowrap',
  fontWeight: 500,
};

const charCountStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: '4px',
  right: '8px',
  fontSize: '10px',
  color: '#999',
};
