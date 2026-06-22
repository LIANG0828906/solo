import { useState } from 'react';
import type { NoteItem } from './types';

interface NotePanelProps {
  notes: NoteItem[];
  onDelete: (id: string) => void;
}

const NotePanel = ({ notes, onDelete }: NotePanelProps) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (word: string, id: string) => {
    try {
      await navigator.clipboard.writeText(word);
      setCopiedId(id);
      setTimeout(() => {
        setCopiedId(null);
      }, 500);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div>
      <h3 style={styles.title}>
        <span>📝</span>
        <span>灵感笔记</span>
        <span style={styles.count}>{notes.length} 个关键词</span>
      </h3>

      {notes.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>💡</div>
          <div style={styles.emptyText}>点击词云中的关键词添加到笔记</div>
        </div>
      ) : (
        <div style={styles.noteList}>
          {notes.map((note, index) => (
            <div
              key={note.id}
              className="slide-up"
              style={{
                ...styles.noteItem,
                animationDelay: `${index * 0.05}s`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#EDE9FE';
                e.currentTarget.style.borderColor = '#6366F1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = '#374151';
              }}
            >
              <div style={styles.noteLeft}>
                <div
                  style={{
                    ...styles.colorDot,
                    backgroundColor: note.color
                  }}
                />
                <span style={styles.noteWord}>{note.word}</span>
                <span style={styles.noteWeight}>权重: {note.weight}</span>
              </div>
              
              <div style={styles.noteActions}>
                <button
                  style={styles.actionButton}
                  onClick={() => handleCopy(note.word, note.id)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {copiedId === note.id ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                  )}
                </button>
                
                <button
                  style={styles.actionButton}
                  onClick={() => onDelete(note.id)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  title: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  count: {
    fontSize: '13px',
    fontWeight: '400',
    color: '#9CA3AF',
    marginLeft: '8px',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '150px',
    gap: '12px',
  },
  emptyIcon: {
    fontSize: '48px',
    opacity: '0.3',
  },
  emptyText: {
    fontSize: '14px',
    color: '#9CA3AF',
  },
  noteList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    maxHeight: '280px',
    overflowY: 'auto',
  },
  noteItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    height: '52px',
    padding: '0 16px',
    borderRadius: '8px',
    border: '1px solid #374151',
    backgroundColor: 'transparent',
    transition: 'all 0.2s ease',
    opacity: 0,
    animation: 'slideUp 0.3s ease-out forwards',
  },
  noteLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  colorDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  noteWord: {
    fontSize: '15px',
    fontWeight: '500',
    color: '#F9FAFB',
  },
  noteWeight: {
    fontSize: '12px',
    color: '#6B7280',
  },
  noteActions: {
    display: 'flex',
    gap: '4px',
  },
  actionButton: {
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
};

export default NotePanel;
