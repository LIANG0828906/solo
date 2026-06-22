import { useState, useCallback } from 'react';
import { tagOptions } from '@/utils/mockApi';
import { useNotesStore } from '@/store/useNotesStore';

interface NewNotePanelProps {
  open: boolean;
  onClose: () => void;
}

export const NewNotePanel = ({ open, onClose }: NewNotePanelProps) => {
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const addNote = useNotesStore(state => state.addNote);

  const toggleTag = useCallback((tagName: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tagName)) {
        return prev.filter(t => t !== tagName);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, tagName];
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    await addNote(content.trim(), selectedTags);
    setContent('');
    setSelectedTags([]);
    setSubmitting(false);
    onClose();
  }, [content, selectedTags, submitting, addNote, onClose]);

  if (!open) return null;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 99,
        }}
      />
      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          background: 'var(--panel-bg)',
          borderRadius: '24px 24px 0 0',
          padding: '28px 24px 32px',
          zIndex: 100,
          animation: 'slideUp 300ms ease-out forwards',
          borderTop: '1px solid var(--card-border)',
        }}
      >
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>
              写点什么
            </h2>
            <button
              onClick={onClose}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--input-bg)',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                transition: 'color 300ms ease',
              }}
            >
              ×
            </button>
          </div>

          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="此刻的想法..."
            autoFocus
            style={{
              width: '90%',
              height: '100px',
              background: 'var(--input-bg)',
              borderRadius: '12px',
              color: 'var(--text-primary)',
              fontSize: '14px',
              padding: '14px',
              resize: 'none',
              lineHeight: 1.6,
              display: 'block',
              margin: '0 auto 20px',
              border: '1px solid transparent',
              transition: 'border-color 300ms ease',
            }}
            onFocus={e => {
              e.currentTarget.style.borderColor = 'var(--accent)';
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = 'transparent';
            }}
          />

          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
              选择标签（最多3个）
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {tagOptions.map(tag => {
                const isSelected = selectedTags.includes(tag.name);
                return (
                  <button
                    key={tag.name}
                    onClick={() => toggleTag(tag.name)}
                    disabled={!isSelected && selectedTags.length >= 3}
                    style={{
                      padding: '4px 14px',
                      height: '28px',
                      borderRadius: '14px',
                      fontSize: '12px',
                      fontWeight: 500,
                      background: isSelected ? tag.color : 'var(--input-bg)',
                      color: isSelected ? '#fff' : 'var(--text-secondary)',
                      opacity: !isSelected && selectedTags.length >= 3 ? 0.4 : 1,
                      transition: 'all 300ms ease',
                      cursor: !isSelected && selectedTags.length >= 3 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    #{tag.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 24px',
                borderRadius: '12px',
                background: 'var(--input-bg)',
                color: 'var(--text-secondary)',
                fontSize: '14px',
                fontWeight: 500,
                transition: 'all 300ms ease',
              }}
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={!content.trim() || submitting}
              style={{
                padding: '10px 28px',
                borderRadius: '12px',
                background: 'var(--accent)',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 600,
                opacity: !content.trim() || submitting ? 0.5 : 1,
                cursor: !content.trim() || submitting ? 'not-allowed' : 'pointer',
                transition: 'all 300ms ease',
              }}
            >
              {submitting ? '发布中...' : '发布'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
