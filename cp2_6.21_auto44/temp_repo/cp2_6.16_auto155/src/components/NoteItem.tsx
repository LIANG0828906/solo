import { useState } from 'react';
import type { RecipeNote } from '@/types';

interface Props {
  note: RecipeNote;
  onDelete: () => void;
  onUpdate: (updates: Partial<Pick<RecipeNote, 'content' | 'rating'>>) => void;
}

const itemStyle: React.CSSProperties = {
  background: 'var(--note-bg)',
  borderRadius: 'var(--radius-md)',
  padding: 16,
  display: 'flex',
  gap: 16,
  border: '1px solid rgba(212, 163, 115, 0.25)'
};

const leftStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 6,
  minWidth: 70
};

export default function NoteItem({ note, onDelete, onUpdate }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content);
  const [editRating, setEditRating] = useState(note.rating);

  const renderStars = (count: number, interactive = false, onChange?: (v: number) => void) => {
    const stars = [];
    for (let i = 1; i <= 10; i++) {
      const v = i / 2;
      const filled = count >= v;
      stars.push(
        <span
          key={i}
          style={{
            fontSize: interactive ? 18 : 14,
            color: filled ? '#F4A261' : '#E0D5C7',
            cursor: interactive ? 'pointer' : 'default',
            display: 'inline-block',
            width: interactive ? 18 : 14,
            overflow: 'hidden',
            lineHeight: 1
          }}
          onClick={() => interactive && onChange && onChange(v)}
        >
          {filled ? '★' : '☆'}
        </span>
      );
    }
    return <span style={{ display: 'inline-flex', lineHeight: 1 }}>{stars}</span>;
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
  };

  const handleSave = () => {
    onUpdate({ content: editContent, rating: editRating });
    setIsEditing(false);
  };

  return (
    <div style={itemStyle} className="fade-in">
      <div style={leftStyle}>
        {renderStars(note.rating)}
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
          {formatDate(note.createdAt)}
        </span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <textarea
              value={editContent}
              onChange={e => setEditContent(e.target.value.slice(0, 500))}
              maxLength={500}
              rows={3}
              style={{ width: '100%' }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>评分：</span>
              {renderStars(editRating, true, setEditRating)}
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{editRating} 星</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { setIsEditing(false); setEditContent(note.content); setEditRating(note.rating); }}
                style={{ padding: '6px 16px', borderRadius: 'var(--radius-sm)', background: '#fff', border: '1px solid var(--border-color)', fontSize: 13, color: 'var(--text-secondary)' }}
              >
                取消
              </button>
              <button
                onClick={handleSave}
                style={{ padding: '6px 16px', borderRadius: 'var(--radius-sm)', background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 600 }}
              >
                保存
              </button>
            </div>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
              {note.content}
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
              <button
                onClick={() => setIsEditing(true)}
                style={{ fontSize: 13, color: 'var(--text-secondary)' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
              >
                ✏️ 编辑
              </button>
              <button
                onClick={onDelete}
                style={{ fontSize: 13, color: 'var(--text-secondary)' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
              >
                🗑 删除
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
