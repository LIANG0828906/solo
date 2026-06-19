import { useState, useEffect } from 'react';
import { Type, Bold, Italic, List, X } from 'lucide-react';
import type { Note } from '@/types';
import useBoardStore from '@/store/boardStore';
import { useClickOutside } from '@/hooks/useClickOutside';

interface StickyNoteProps {
  note: Note;
}

export function StickyNote({ note }: StickyNoteProps) {
  const { updateNote, deleteNote } = useBoardStore();
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(note.content);
  const [position, setPosition] = useState({ x: note.x, y: note.y });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isNew, setIsNew] = useState(Date.now() - new Date(note.createdAt).getTime() < 500);
  
  const editorRef = useClickOutside<HTMLDivElement>(() => {
    if (isEditing) {
      handleSave();
    }
  }, isEditing);

  useEffect(() => {
    if (isNew) {
      const timer = setTimeout(() => setIsNew(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isNew]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditing) return;
    e.stopPropagation();
    
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      requestAnimationFrame(() => {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      updateNote(note.id, { x: position.x, y: position.y });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, note.id, updateNote, position.x, position.y]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleSave = () => {
    updateNote(note.id, { content });
    setIsEditing(false);
  };

  const insertFormatting = (prefix: string, suffix: string = prefix) => {
    const textarea = editorRef.current?.querySelector('textarea') as HTMLTextAreaElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newContent = content.substring(0, start) + prefix + selectedText + suffix + content.substring(end);
    
    setContent(newContent);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const renderContent = (text: string) => {
    return text.split('\n').map((line, i) => {
      let formatted = line
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/^- (.*$)/gim, '<li>$1</li>');
      
      if (!/^<h[1-3]|<li>/.test(formatted)) {
        formatted = `<p>${formatted}</p>`;
      }
      
      return <div key={i} dangerouslySetInnerHTML={{ __html: formatted }} />;
    });
  };

  return (
    <div
      className={`sticky-note ${isDragging ? 'dragging' : ''} ${isNew ? 'animate-scaleIn' : ''}`}
      style={{
        left: position.x,
        top: position.y,
        width: note.width,
        height: note.height,
        backgroundColor: note.backgroundColor,
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      <div className="note-header">
        <button
          className="note-delete"
          onClick={(e) => {
            e.stopPropagation();
            deleteNote(note.id);
          }}
          aria-label="删除便签"
        >
          <X size={14} />
        </button>
      </div>
      
      {isEditing ? (
        <div ref={editorRef} className="note-editor">
          <div className="editor-toolbar">
            <button
              type="button"
              className="toolbar-btn"
              onClick={() => insertFormatting('# ')}
              title="标题"
            >
              <Type size={14} />
            </button>
            <button
              type="button"
              className="toolbar-btn"
              onClick={() => insertFormatting('**', '**')}
              title="加粗"
            >
              <Bold size={14} />
            </button>
            <button
              type="button"
              className="toolbar-btn"
              onClick={() => insertFormatting('*', '*')}
              title="斜体"
            >
              <Italic size={14} />
            </button>
            <button
              type="button"
              className="toolbar-btn"
              onClick={() => insertFormatting('- ')}
              title="列表"
            >
              <List size={14} />
            </button>
          </div>
          <textarea
            className="note-textarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="写下你的灵感..."
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                handleSave();
              }
            }}
          />
          <div className="editor-actions">
            <button className="btn-primary btn-sm" onClick={handleSave}>
              保存
            </button>
          </div>
        </div>
      ) : (
        <div className="note-content">
          {content ? renderContent(content) : (
            <span className="note-placeholder">双击编辑</span>
          )}
        </div>
      )}
    </div>
  );
}
