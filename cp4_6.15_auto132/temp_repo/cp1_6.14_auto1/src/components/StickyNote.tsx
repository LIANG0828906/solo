import React, { useEffect, useRef, useState } from 'react';
import type { StickyNote as StickyNoteType } from '../types';
import './StickyNote.css';

interface StickyNoteProps {
  sticky: StickyNoteType;
  isSelected: boolean;
  stageScale: number;
  onSelect: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragMove: (id: string, x: number, y: number) => void;
  onDragEnd: (sticky: StickyNoteType) => void;
  onUpdate: (sticky: StickyNoteType) => void;
  onDelete: (id: string) => void;
}

interface EditorModalProps {
  content: string;
  onSave: (content: string) => void;
  onClose: () => void;
}

const EditorModal: React.FC<EditorModalProps> = ({ content, onSave, onClose }) => {
  const [draft, setDraft] = useState(content);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = draft;
      editorRef.current.focus();
    }
  }, []);

  const applyFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setDraft(editorRef.current.innerHTML);
    }
  };

  const handleSave = () => {
    const finalContent = editorRef.current?.innerHTML ?? draft;
    onSave(finalContent);
  };

  return (
    <div className="sticky-modal-overlay" onMouseDown={(e) => {
      if (e.target === e.currentTarget) handleSave();
    }}>
      <div className="sticky-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sticky-modal-toolbar">
          <button
            type="button"
            className="format-btn bold"
            onClick={() => applyFormat('bold')}
            title="粗体"
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            className="format-btn italic"
            onClick={() => applyFormat('italic')}
            title="斜体"
          >
            <em>I</em>
          </button>
          <button
            type="button"
            className="format-btn underline"
            onClick={() => applyFormat('underline')}
            title="下划线"
          >
            <u>U</u>
          </button>
          <button
            type="button"
            className="format-btn strike"
            onClick={() => applyFormat('strikeThrough')}
            title="删除线"
          >
            <s>S</s>
          </button>
          <div className="format-divider" />
          <button
            type="button"
            className="format-btn"
            onClick={() => applyFormat('insertUnorderedList')}
            title="无序列表"
          >
            • 列表
          </button>
        </div>
        <div
          ref={editorRef}
          className="sticky-modal-editor"
          contentEditable
          suppressContentEditableWarning
          onInput={() => {
            if (editorRef.current) {
              setDraft(editorRef.current.innerHTML);
            }
          }}
        />
        <div className="sticky-modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            取消
          </button>
          <button type="button" className="btn-primary" onClick={handleSave}>
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

const StickyNote: React.FC<StickyNoteProps> = ({
  sticky,
  isSelected,
  stageScale,
  onSelect,
  onDragStart,
  onDragMove,
  onDragEnd,
  onUpdate,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const lastClickTimeRef = useRef<number>(0);
  const elementRef = useRef<HTMLDivElement>(null);
  const isClickRef = useRef(false);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();

    onSelect(sticky.id);

    const now = Date.now();
    if (now - lastClickTimeRef.current < 300) {
      setIsEditing(true);
      lastClickTimeRef.current = 0;
      return;
    }
    lastClickTimeRef.current = now;

    isClickRef.current = true;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    dragOffsetRef.current = {
      x: (e.clientX - rect.left) / stageScale,
      y: (e.clientY - rect.top) / stageScale,
    };
    setIsDragging(true);
    onDragStart(sticky.id);

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    if (Math.abs(e.movementX) > 2 || Math.abs(e.movementY) > 2) {
      isClickRef.current = false;
    }
    if (!elementRef.current) return;
    const parentRect = elementRef.current.parentElement?.getBoundingClientRect();
    if (!parentRect) return;

    const newX = (e.clientX - parentRect.left) / stageScale - dragOffsetRef.current.x;
    const newY = (e.clientY - parentRect.top) / stageScale - dragOffsetRef.current.y;
    onDragMove(sticky.id, newX, newY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
    onDragEnd(sticky);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (!isEditing && isSelected) {
        onDelete(sticky.id);
      }
    }
  };

  const handleSaveEdit = (content: string) => {
    onUpdate({ ...sticky, content });
    setIsEditing(false);
  };

  return (
    <>
      <div
        ref={elementRef}
        className={`sticky-note ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
        style={{
          transform: `translate(${sticky.x}px, ${sticky.y}px) scale(${stageScale})`,
          width: sticky.width,
          height: sticky.height,
          transformOrigin: '0 0',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        <div
          className="sticky-content"
          dangerouslySetInnerHTML={{ __html: sticky.content || '<p>双击编辑...</p>' }}
        />
        <div
          className="sticky-creator-dot"
          style={{ backgroundColor: sticky.creatorColor }}
          title="创建者"
        />
        {isSelected && (
          <div className="sticky-resize-handle" onPointerDown={(e) => e.stopPropagation()} />
        )}
      </div>
      {isEditing && (
        <EditorModal
          content={sticky.content}
          onSave={handleSaveEdit}
          onClose={() => setIsEditing(false)}
        />
      )}
    </>
  );
};

export default StickyNote;
