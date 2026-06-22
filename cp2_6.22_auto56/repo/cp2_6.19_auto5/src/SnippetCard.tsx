import { memo, useCallback } from 'react';
import { Pencil, Trash2, GripVertical } from 'lucide-react';
import type { Snippet } from './types';

function formatDate(ts: number): string {
  const d = new Date(ts);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hours = d.getHours().toString().padStart(2, '0');
  const mins = d.getMinutes().toString().padStart(2, '0');
  return `${month}/${day} ${hours}:${mins}`;
}

function stripMarkdown(md: string): string {
  return md
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/^\-\s+/gm, '• ')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

interface SnippetCardProps {
  snippet: Snippet;
  highlightQuery?: string;
  onEdit: (snippet: Snippet) => void;
  onDelete: (id: string) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDrop: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  isDragOver: boolean;
  isDragging: boolean;
}

const SnippetCard = memo(function SnippetCard({
  snippet,
  highlightQuery = '',
  onEdit,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragOver,
  isDragging,
}: SnippetCardProps) {
  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(snippet);
  }, [snippet, onEdit]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(snippet.id);
  }, [snippet.id, onDelete]);

  const highlightText = useCallback((text: string, query: string) => {
    if (!query.trim()) return text;
    const q = query.trim().toLowerCase();
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let lowerText = text.toLowerCase();
    let idx = lowerText.indexOf(q);

    while (idx !== -1) {
      if (idx > lastIndex) {
        parts.push(<span key={`text-${lastIndex}`}>{text.slice(lastIndex, idx)}</span>);
      }
      parts.push(
        <mark key={`highlight-${idx}`} className="highlight-term">
          {text.slice(idx, idx + q.length)}
        </mark>
      );
      lastIndex = idx + q.length;
      idx = lowerText.indexOf(q, lastIndex);
    }

    if (lastIndex < text.length) {
      parts.push(<span key={`text-${lastIndex}`}>{text.slice(lastIndex)}</span>);
    }

    return parts.length > 0 ? <>{parts}</> : text;
  }, []);

  const plainContent = stripMarkdown(snippet.content);

  return (
    <div
      className={`snippet-card ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
      draggable
      onDragStart={(e) => onDragStart(e, snippet.id)}
      onDragOver={(e) => onDragOver(e, snippet.id)}
      onDrop={(e) => onDrop(e, snippet.id)}
      onDragEnd={onDragEnd}
    >
      <div className="card-header">
        <div className="card-title">{highlightText(snippet.title, highlightQuery)}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
          <GripVertical size={14} style={{ color: 'var(--text-muted)', opacity: 0.4, cursor: 'grab' }} />
        </div>
      </div>

      <div className="card-content-preview">
        {highlightText(plainContent, highlightQuery)}
      </div>

      {snippet.tags.length > 0 && (
        <div className="card-tags">
          {snippet.tags.map(tag => (
            <span key={tag} className="card-tag">{tag}</span>
          ))}
        </div>
      )}

      <div className="card-footer">
        <span className="card-date">{formatDate(snippet.updatedAt)}</span>
        <div className="card-actions">
          <button className="card-action-btn" onClick={handleEdit} title="编辑">
            <Pencil size={13} />
          </button>
          <button className="card-action-btn delete" onClick={handleDelete} title="删除">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
});

export default SnippetCard;
