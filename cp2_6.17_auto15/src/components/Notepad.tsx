import React, { useRef, useEffect } from 'react';
import { useCanvasStore } from '../store/useCanvasStore';

interface NoteInputModalProps {
  onSubmit: (text: string) => void;
  onCancel: () => void;
}

export const NoteInputModal: React.FC<NoteInputModalProps> = ({ onSubmit, onCancel }) => {
  const { notepadInputContent, setNotepadInputContent } = useCanvasStore();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit(notepadInputContent);
    }
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div
      style={{
        width: 200,
        height: 120,
        backgroundColor: '#FFF9C4',
        borderRadius: 8,
        padding: 12,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
        border: '1px solid #E0D890',
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
    >
      <textarea
        ref={inputRef}
        value={notepadInputContent}
        onChange={(e) => setNotepadInputContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="输入便签内容... (Enter保存)"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          outline: 'none',
          resize: 'none',
          backgroundColor: 'transparent',
          fontSize: 14,
          color: '#333333',
          fontFamily: 'inherit',
          lineHeight: '1.5',
        }}
      />
    </div>
  );
};

interface NotepadProps {
  position: { x: number; y: number };
  scale: number;
  offsetX: number;
  offsetY: number;
  rectLeft: number;
  rectTop: number;
  onSubmit: (text: string) => void;
  onCancel: () => void;
}

const Notepad: React.FC<NotepadProps> = ({
  position,
  scale,
  offsetX,
  offsetY,
  rectLeft,
  rectTop,
  onSubmit,
  onCancel,
}) => {
  const getNoteStyle = (): React.CSSProperties => {
    return {
      position: 'fixed',
      left: position.x * scale + offsetX + rectLeft,
      top: position.y * scale + offsetY + rectTop,
      transform: `scale(${scale})`,
      transformOrigin: 'top left',
      zIndex: 100,
    };
  };

  return (
    <div style={getNoteStyle()}>
      <NoteInputModal onSubmit={onSubmit} onCancel={onCancel} />
    </div>
  );
};

export default Notepad;
