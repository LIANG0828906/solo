import React, { useState, useRef, useEffect } from 'react';
import { Check, X, GripVertical } from 'lucide-react';
import type { StickyNoteElement } from '../store/canvasStore';
import { useCanvasStore } from '../store/canvasStore';

interface StickyNoteProps {
  element: StickyNoteElement;
  onDragStart?: (e: React.MouseEvent) => void;
}

const renderMarkdown = (content: string): React.ReactNode => {
  const lines = content.split('\n');
  return lines.map((line, index) => {
    let processed = line;

    processed = processed.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    processed = processed.replace(/\*(.+?)\*/g, '<em>$1</em>');

    if (processed.startsWith('### ')) {
      return (
        <h3 key={index} className="text-base font-bold mb-1"
            dangerouslySetInnerHTML={{ __html: processed.slice(4) }} />
      );
    }
    if (processed.startsWith('## ')) {
      return (
        <h2 key={index} className="text-lg font-bold mb-1"
            dangerouslySetInnerHTML={{ __html: processed.slice(3) }} />
      );
    }
    if (processed.startsWith('# ')) {
      return (
        <h1 key={index} className="text-xl font-bold mb-2"
            dangerouslySetInnerHTML={{ __html: processed.slice(2) }} />
      );
    }
    if (processed.startsWith('- ') || processed.startsWith('* ')) {
      return (
        <li key={index} className="ml-4 text-sm"
            dangerouslySetInnerHTML={{ __html: processed.slice(2) }} />
      );
    }
    if (/^\d+\.\s/.test(processed)) {
      return (
        <li key={index} className="ml-4 text-sm list-decimal"
            dangerouslySetInnerHTML={{ __html: processed.replace(/^\d+\.\s/, '') }} />
      );
    }

    return (
      <p key={index} className="text-sm mb-1"
         dangerouslySetInnerHTML={{ __html: processed || '&nbsp;' }} />
    );
  });
};

const StickyNote: React.FC<StickyNoteProps> = ({ element, onDragStart }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(element.content);
  const [showAnimation, setShowAnimation] = useState(!!element.isNew);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { updateElement, selectedElementId, setSelectedElement } = useCanvasStore();

  const isSelected = selectedElementId === element.id;

  useEffect(() => {
    if (showAnimation) {
      const timer = setTimeout(() => setShowAnimation(false), 300);
      return () => clearTimeout(timer);
    }
  }, [showAnimation]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditContent(element.content);
  };

  const handleSave = () => {
    updateElement(element.id, { content: editContent, isNew: false });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditContent(element.content);
    setIsEditing(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditing) return;
    e.stopPropagation();
    setSelectedElement(element.id);
    if (onDragStart) {
      onDragStart(e);
    }
  };

  return (
    <>
      <style>{`
        .sticky-note {
          position: absolute;
          background: #fef3c7;
          border-radius: 8px;
          padding: 12px;
          min-width: 180px;
          min-height: 120px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          cursor: move;
          transition: box-shadow 0.2s ease, transform 0.3s ease, opacity 0.3s ease;
          transform-origin: center center;
          user-select: none;
        }

        .sticky-note:hover {
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
        }

        .sticky-note.selected {
          box-shadow: 0 0 0 2px #3b82f6, 0 6px 20px rgba(0, 0, 0, 0.15);
        }

        .sticky-note.appearing {
          animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        @keyframes scaleIn {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .sticky-note-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          padding-bottom: 6px;
          border-bottom: 1px dashed #fcd34d;
        }

        .drag-handle {
          cursor: grab;
          color: #d97706;
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: #92400e;
        }

        .drag-handle:active {
          cursor: grabbing;
        }

        .note-content {
          color: #78350f;
          line-height: 1.5;
        }

        .note-content h1,
        .note-content h2,
        .note-content h3 {
          color: #92400e;
        }

        .note-content strong {
          font-weight: 700;
          color: #92400e;
        }

        .note-content em {
          font-style: italic;
        }

        .edit-textarea {
          width: 100%;
          min-height: 100px;
          border: 2px solid #fcd34d;
          border-radius: 6px;
          padding: 8px;
          font-family: inherit;
          font-size: 13px;
          resize: none;
          background: #fef9c3;
          color: #78350f;
          outline: none;
        }

        .edit-actions {
          display: flex;
          gap: 6px;
          margin-top: 8px;
          justify-content: flex-end;
        }

        .edit-btn {
          padding: 4px 10px;
          border-radius: 4px;
          border: none;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: all 0.15s ease;
        }

        .edit-btn.save {
          background: #22c55e;
          color: white;
        }

        .edit-btn.save:hover {
          background: #16a34a;
        }

        .edit-btn.cancel {
          background: #ef4444;
          color: white;
        }

        .edit-btn.cancel:hover {
          background: #dc2626;
        }

        .note-footer {
          position: absolute;
          bottom: 4px;
          right: 8px;
          font-size: 10px;
          color: #d97706;
          opacity: 0.6;
        }
      `}</style>

      <div
        className={`sticky-note ${isSelected ? 'selected' : ''} ${showAnimation ? 'appearing' : ''}`}
        style={{
          left: element.x,
          top: element.y,
          width: element.width,
          height: element.height,
          transform: `rotate(${element.rotation}deg)`,
        }}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
      >
        <div className="sticky-note-header">
          <div className="drag-handle">
            <GripVertical size={14} />
            <span>便签</span>
          </div>
        </div>

        {isEditing ? (
          <div>
            <textarea
              ref={textareaRef}
              className="edit-textarea"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="支持 Markdown：# 标题、**加粗**、- 列表..."
              onClick={(e) => e.stopPropagation()}
            />
            <div className="edit-actions">
              <button className="edit-btn cancel" onClick={handleCancel}>
                <X size={14} />
                取消
              </button>
              <button className="edit-btn save" onClick={handleSave}>
                <Check size={14} />
                保存
              </button>
            </div>
          </div>
        ) : (
          <div className="note-content">
            {renderMarkdown(element.content)}
          </div>
        )}

        <div className="note-footer">双击编辑</div>
      </div>
    </>
  );
};

export default StickyNote;
