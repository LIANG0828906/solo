import { memo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Entry } from '../types';
import { MOOD_CONFIG } from '../types';
import { formatDate } from '../utils/dateUtils';
import { Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

interface EntryCardProps {
  entry: Entry;
  onEdit: (entry: Entry) => void;
  onDelete: (id: string) => void;
}

const EntryCard = memo(function EntryCard({ entry, onEdit, onDelete }: EntryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const moodConfig = MOOD_CONFIG[entry.mood];
  const shouldTruncate = entry.summary.length > 150 && !isExpanded;
  const displaySummary = shouldTruncate ? entry.summary.slice(0, 150) + '...' : entry.summary;

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    onDelete(entry.id);
    setShowDeleteConfirm(false);
  };

  return (
    <div className="entry-card">
      <div className="card-date">{formatDate(entry.createdAt)}</div>

      <div className="card-actions">
        <button
          type="button"
          className="card-action-btn"
          onClick={() => onEdit(entry)}
          aria-label="编辑"
        >
          <Pencil size={16} />
        </button>
        <button
          type="button"
          className="card-action-btn delete-btn"
          onClick={handleDelete}
          aria-label="删除"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <h4 className="card-title">{entry.title}</h4>

      {entry.source && (
        <div className="card-source">来源：{entry.source}</div>
      )}

      <div className={`card-summary ${isExpanded ? 'expanded' : ''}`}>
        {shouldTruncate ? (
          <div className="summary-text truncate-3">{displaySummary}</div>
        ) : (
          <ReactMarkdown className="markdown-content">{displaySummary}</ReactMarkdown>
        )}
      </div>

      {entry.summary.length > 150 && (
        <button
          type="button"
          className="expand-btn"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <>收起 <ChevronUp size={14} /></>
          ) : (
            <>显示更多 <ChevronDown size={14} /></>
          )}
        </button>
      )}

      <div className="card-footer">
        <span
          className="mood-indicator"
          style={{ backgroundColor: moodConfig.color }}
          title={moodConfig.label}
        />
        <span className="mood-label-text">{moodConfig.label}</span>
      </div>

      {showDeleteConfirm && (
        <div className="delete-confirm-overlay">
          <div className="delete-confirm-dialog">
            <p className="confirm-text">确定删除此条目？</p>
            <div className="confirm-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowDeleteConfirm(false)}
              >
                取消
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={confirmDelete}
              >
                确定删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default EntryCard;
