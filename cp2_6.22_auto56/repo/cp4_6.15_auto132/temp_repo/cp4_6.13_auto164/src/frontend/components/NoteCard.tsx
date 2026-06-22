import React, { memo, useState, useEffect } from 'react';

export interface Note {
  id: string;
  book_id: string;
  excerpt: string;
  reflection: string;
  created_at: string;
}

interface NoteCardProps {
  note: Note;
  index: number;
  onDelete?: (id: string) => void;
  style?: React.CSSProperties;
}

const NoteCard: React.FC<NoteCardProps> = memo(({ note, index, onDelete, style }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), Math.min(index * 60, 600));
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <div
      style={{
        padding: '18px 0',
        borderBottom: '1px dashed #ddd',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
        ...style,
      }}
    >
      <div
        style={{
          background: '#ecf0f1',
          borderLeft: '3px solid #3498db',
          padding: '12px 16px',
          borderRadius: '0 6px 6px 0',
          marginBottom: 14,
          fontSize: 14,
          color: '#2c3e50',
          lineHeight: 1.6,
          fontStyle: 'italic',
          position: 'relative',
        }}
      >
        <span style={{
          position: 'absolute',
          left: -2,
          top: 4,
          fontSize: 22,
          color: '#3498db',
          fontFamily: 'Georgia, serif',
          opacity: 0.4,
        }}>
          "
        </span>
        <span style={{ paddingLeft: 12 }}>{note.excerpt}</span>
      </div>

      <div style={{ position: 'relative' }}>
        <p style={{
          fontSize: 16,
          color: '#2c3e50',
          lineHeight: 1.75,
          margin: 0,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}>
          {note.reflection}
        </p>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 12,
        }}>
          <span style={{ fontSize: 12, color: '#95a5a6' }}>
            {new Date(note.created_at).toLocaleString('zh-CN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          {onDelete && (
            <button
              onClick={() => onDelete(note.id)}
              className="note-delete-btn"
              style={{
                border: 'none',
                background: 'none',
                color: '#e74c3c',
                fontSize: 12,
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: 4,
                transition: 'background 0.2s ease',
              }}
            >
              删除
            </button>
          )}
        </div>
      </div>

      <style>{`
        .note-delete-btn:hover {
          background: rgba(231, 76, 60, 0.1);
        }
      `}</style>
    </div>
  );
});

NoteCard.displayName = 'NoteCard';

export default NoteCard;
