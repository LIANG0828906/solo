import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send } from 'lucide-react';
import type { Annotation } from '@/types';

interface AnnotationBubbleProps {
  annotation: Annotation;
  onImageClick?: (x: number, y: number) => void;
  onUpdate?: (id: string, text: string) => void;
  onDelete?: (id: string) => void;
  isEditing?: boolean;
}

export default function AnnotationBubble({
  annotation,
  onUpdate,
  onDelete,
  isEditing = false,
}: AnnotationBubbleProps) {
  const [editing, setEditing] = useState(isEditing);
  const [text, setText] = useState(annotation.text);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  const handleSubmit = useCallback(() => {
    const trimmed = text.trim();
    if (trimmed && onUpdate) {
      onUpdate(annotation.id, trimmed);
    }
    setEditing(false);
  }, [text, annotation.id, onUpdate]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
      if (e.key === 'Escape') {
        setText(annotation.text);
        setEditing(false);
      }
    },
    [handleSubmit, annotation.text]
  );

  const bubbleLeft = annotation.x > 70 ? annotation.x - 25 : annotation.x + 3;
  const bubbleTop = annotation.y > 70 ? annotation.y - 18 : annotation.y + 3;

  return (
    <div
      className="absolute z-20"
      style={{
        left: `${bubbleLeft}%`,
        top: `${bubbleTop}%`,
      }}
    >
      <div className="absolute w-3 h-3 bg-white rotate-45 border-l border-t border-[#BDC3C7]"
        style={{
          left: annotation.x > 70 ? '20px' : '-4px',
          top: annotation.y > 70 ? '-6px' : 'calc(100% - 7px)',
        }}
      />
      <div
        className="relative bg-white rounded-lg border border-[#BDC3C7] shadow-md p-2 min-w-[120px] max-w-[220px]"
        style={{ borderRadius: 8 }}
      >
        <div className="flex items-start justify-between gap-1 mb-1">
          <span className="text-[10px] text-[#95A5A6]">
            {annotation.authorType === 'client' ? '客户' : '设计师'}
          </span>
          <div className="flex items-center gap-0.5">
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="p-0.5 rounded hover:bg-[#ECF0F1] transition-colors duration-200 text-[#95A5A6]"
              >
                <Send size={10} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(annotation.id)}
                className="p-0.5 rounded hover:bg-[#FDEDEC] transition-colors duration-200 text-[#E74C3C]"
              >
                <X size={10} />
              </button>
            )}
          </div>
        </div>

        {editing ? (
          <div>
            <textarea
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSubmit}
              className="w-full text-xs text-[#2C3E50] bg-transparent border border-[#BDC3C7] rounded px-2 py-1 resize-none focus:border-[#3498DB] focus:outline-none transition-colors duration-200"
              style={{ borderRadius: 8, minHeight: 32 }}
              rows={2}
            />
          </div>
        ) : (
          <p className="text-xs text-[#2C3E50] leading-relaxed whitespace-pre-wrap break-words">
            {annotation.text}
          </p>
        )}
      </div>
    </div>
  );
}

interface AnnotationLayerProps {
  sketchId: string;
  annotations: Annotation[];
  onAdd: (sketchId: string, x: number, y: number, text: string) => void;
  onDelete: (annotationId: string) => void;
  onUpdate: (annotationId: string, text: string) => void;
  authorType: 'designer' | 'client';
}

export function AnnotationLayer({
  sketchId,
  annotations,
  onAdd,
  onDelete,
  onUpdate,
  authorType,
}: AnnotationLayerProps) {
  const [adding, setAdding] = useState<{ x: number; y: number } | null>(null);
  const [newText, setNewText] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (adding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [adding]);

  const handleImageClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setAdding({ x, y });
      setNewText('');
    },
    []
  );

  const handleSubmitAnnotation = useCallback(() => {
    const trimmed = newText.trim();
    if (trimmed && adding) {
      onAdd(sketchId, adding.x, adding.y, trimmed);
      setAdding(null);
      setNewText('');
    }
  }, [newText, adding, sketchId, onAdd]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmitAnnotation();
      }
      if (e.key === 'Escape') {
        setAdding(null);
        setNewText('');
      }
    },
    [handleSubmitAnnotation]
  );

  return (
    <div className="relative" onClick={handleImageClick}>
      {annotations.map((a) => (
        <div key={a.id} onClick={(e) => e.stopPropagation()}>
          <AnnotationBubble
            annotation={a}
            onDelete={onDelete}
            onUpdate={onUpdate}
          />
        </div>
      ))}

      {adding && (
        <div
          className="absolute z-30"
          style={{
            left: `${adding.x > 70 ? adding.x - 25 : adding.x + 3}%`,
            top: `${adding.y > 70 ? adding.y - 18 : adding.y + 3}%`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="absolute w-3 h-3 bg-white rotate-45 border-l border-t border-[#3498DB]"
            style={{
              left: adding.x > 70 ? '20px' : '-4px',
              top: adding.y > 70 ? '-6px' : 'calc(100% - 7px)',
            }}
          />
          <div
            className="relative bg-white border border-[#3498DB] shadow-md p-2 min-w-[160px]"
            style={{ borderRadius: 8 }}
          >
            <span className="text-[10px] text-[#3498DB] mb-1 block">
              {authorType === 'client' ? '客户批注' : '设计师批注'}
            </span>
            <textarea
              ref={inputRef}
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入批注内容..."
              className="w-full text-xs text-[#2C3E50] bg-transparent border border-[#BDC3C7] rounded px-2 py-1 resize-none focus:border-[#3498DB] focus:outline-none transition-colors duration-200"
              style={{ borderRadius: 8, minHeight: 48 }}
              rows={2}
            />
            <div className="flex justify-end gap-1 mt-1">
              <button
                onClick={() => {
                  setAdding(null);
                  setNewText('');
                }}
                className="px-2 py-1 text-xs text-[#95A5A6] rounded hover:bg-[#ECF0F1] transition-colors duration-200"
              >
                取消
              </button>
              <button
                onClick={handleSubmitAnnotation}
                className="px-2 py-1 text-xs bg-[#3498DB] text-white rounded hover:bg-[#2980B9] transition-colors duration-200"
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
