import React, { useState, useRef, useEffect } from 'react';
import { Settings, Trash2, Type, List, Bold, Palette } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { StickyNote as StickyNoteType, NoteColor } from '@/types';
import { NOTE_COLORS } from '@/types';
import { useStore } from '@/store/useStore';

interface StickyNoteProps {
  note: StickyNoteType;
}

const COLORS: { value: NoteColor; label: string }[] = [
  { value: 'yellow', label: '黄色' },
  { value: 'blue', label: '蓝色' },
  { value: 'pink', label: '粉色' },
  { value: 'green', label: '绿色' },
];

const StickyNote: React.FC<StickyNoteProps> = ({ note }) => {
  const [showToolbar, setShowToolbar] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: note.id,
    disabled: useStore.getState().locked,
  });

  const updateNote = useStore((state) => state.updateNote);
  const deleteNote = useStore((state) => state.deleteNote);
  const bringNoteToFront = useStore((state) => state.bringNoteToFront);
  const locked = useStore((state) => state.locked);

  const style: React.CSSProperties = {
    left: note.x,
    top: note.y,
    zIndex: note.zIndex,
    backgroundColor: NOTE_COLORS[note.color],
    transform: CSS.Translate.toString(transform),
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateNote(note.id, { title: e.target.value });
  };

  const handleContentChange = () => {
    if (contentRef.current) {
      updateNote(note.id, { content: contentRef.current.innerHTML });
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNote(note.id);
  };

  const handleColorChange = (color: NoteColor) => {
    updateNote(note.id, { color });
    setShowColorPicker(false);
  };

  const formatText = (command: string) => {
    document.execCommand(command, false);
    handleContentChange();
    if (command === 'bold') {
      setIsBold(!isBold);
    }
  };

  const handleDragStart = () => {
    bringNoteToFront(note.id);
  };

  useEffect(() => {
    if (contentRef.current && note.content) {
      contentRef.current.innerHTML = note.content;
    }
  }, []);

  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        opacity: isHovered ? 1 : 0.6,
        transition: 'opacity 250ms cubic-bezier(0.25, 0.1, 0.25, 1), box-shadow 250ms cubic-bezier(0.25, 0.1, 0.25, 1)',
      }}
      className="sticky-note"
      onMouseDown={handleDragStart}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowColorPicker(false);
      }}
      data-note-id={note.id}
      data-id={note.id}
      data-color={note.color}
    >
      <div
        className="sticky-note-toolbar-wrapper"
        style={{
          position: 'absolute',
          top: -50,
          right: 0,
          overflow: 'hidden',
          pointerEvents: showToolbar ? 'auto' : 'none',
        }}
      >
        <div
          className="sticky-note-toolbar"
          style={{
            transform: showToolbar ? 'translateX(0)' : 'translateX(100%)',
            opacity: showToolbar ? 1 : 0,
            transition: 'transform 250ms cubic-bezier(0.25, 0.1, 0.25, 1), opacity 200ms ease',
          }}
        >
          <button
            className={isBold ? 'active' : ''}
            onClick={() => formatText('bold')}
            title="粗体"
          >
            <Bold size={16} />
          </button>
          <button onClick={() => formatText('insertUnorderedList')} title="列表">
            <List size={16} />
          </button>
          <button onClick={() => { document.execCommand('formatBlock', false, 'h3'); handleContentChange(); }} title="标题">
            <Type size={16} />
          </button>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              title="颜色"
            >
              <Palette size={16} />
            </button>
            {showColorPicker && (
              <div className="note-color-picker">
                {COLORS.map((c) => (
                  <div
                    key={c.value}
                    className={`note-color-option ${note.color === c.value ? 'selected' : ''}`}
                    style={{ backgroundColor: NOTE_COLORS[c.value] }}
                    onClick={() => handleColorChange(c.value)}
                    title={c.label}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="sticky-note-header">
        <input
          ref={titleRef}
          className="sticky-note-title"
          value={note.title}
          onChange={handleTitleChange}
          placeholder="标题"
          disabled={locked}
          {...(!locked ? attributes : {})}
          {...(!locked ? listeners : {})}
        />
        <div
          className="sticky-note-tools"
          style={{
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 200ms ease',
          }}
        >
          <div
            className="sticky-note-tool"
            onClick={(e) => {
              e.stopPropagation();
              setShowToolbar(!showToolbar);
            }}
            title="编辑工具栏"
          >
            <Settings size={14} />
          </div>
          <div
            className="sticky-note-tool"
            onClick={handleDelete}
            title="删除便签"
          >
            <Trash2 size={14} />
          </div>
        </div>
      </div>

      <div
        ref={contentRef}
        className="sticky-note-content"
        contentEditable={!locked}
        onInput={handleContentChange}
        suppressContentEditableWarning
        style={{
          opacity: isHovered ? 1 : 0.85,
          transition: 'opacity 250ms ease',
        }}
      />
    </div>
  );
};

export default React.memo(StickyNote);
