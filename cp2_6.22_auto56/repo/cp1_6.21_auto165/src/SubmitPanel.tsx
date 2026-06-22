import { useState, useEffect, useRef } from 'react';
import { useMemeContext } from './App';

const AVAILABLE_TAGS = ['今日梗', '暖心', '冷笑话', '金句', '吐槽'];

const TAG_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  '今日梗': { bg: '#FEF3C7', text: '#D97706', border: '#F59E0B' },
  '暖心': { bg: '#DBEAFE', text: '#2563EB', border: '#3B82F6' },
  '冷笑话': { bg: '#D1FAE5', text: '#059669', border: '#10B981' },
  '金句': { bg: '#FCE7F3', text: '#DB2777', border: '#EC4899' },
  '吐槽': { bg: '#E0E7FF', text: '#4F46E5', border: '#6366F1' },
};

export default function SubmitPanel() {
  const { addMeme } = useMemeContext();
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedAuthor = localStorage.getItem('meme-wall-author');
    if (savedAuthor) setAuthor(savedAuthor);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node) && isOpen) {
        setIsOpen(false);
      }
    };

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEsc);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (!content.trim() || !author.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      localStorage.setItem('meme-wall-author', author.trim());
      await addMeme(content.trim(), selectedTags, author.trim());
      setContent('');
      setSelectedTags([]);
      setIsOpen(false);
    } catch (err) {
      console.error('Submit failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFabClick = () => {
    setIsOpen(!isOpen);
  };

  const canSubmit = content.trim().length > 0 && author.trim().length > 0 && !isSubmitting;

  return (
    <>
      <button
        className="fab-btn"
        onClick={handleFabClick}
        style={{
          transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
        }}
        aria-label="发布妙语"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {isOpen && (
        <div style={styles.backdrop}>
          <div
            ref={panelRef}
            style={styles.panel}
          >
            <h2 style={styles.panelTitle}>发布妙语</h2>

            <div style={styles.field}>
              <label style={styles.label}>你的名字</label>
              <input
                type="text"
                value={author}
                onChange={e => setAuthor(e.target.value)}
                placeholder="请输入你的名字"
                style={styles.input}
                maxLength={20}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>
                妙语内容
                <span style={styles.charCount}>
                  {content.length}/100
                </span>
              </label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value.slice(0, 100))}
                placeholder="分享你的梗、金句或暖心鼓励..."
                style={{
                  ...styles.textarea,
                  borderColor: content.length > 90 ? '#EF4444' : '#E2E8F0',
                }}
                rows={4}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>选择标签</label>
              <div style={styles.tagSelector}>
                {AVAILABLE_TAGS.map(tag => {
                  const colors = TAG_COLORS[tag];
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      className="tag-option-btn"
                      onClick={() => toggleTag(tag)}
                      style={{
                        backgroundColor: isSelected ? colors.bg : '#F8FAFC',
                        color: isSelected ? colors.text : '#64748B',
                        borderColor: isSelected ? colors.border : '#E2E8F0',
                        fontWeight: isSelected ? 600 : 500,
                      }}
                    >
                      #{tag}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              className="submit-btn"
              onClick={handleSubmit}
              disabled={!canSubmit}
            >
              {isSubmitting ? '提交中...' : '发布妙语'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 400,
    animation: 'fadeIn 0.2s ease',
    padding: 20,
  },
  panel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: '28px',
    width: '100%',
    maxWidth: 440,
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    animation: 'slideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  panelTitle: {
    color: '#1E293B',
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 20,
    textAlign: 'center',
  },
  field: {
    marginBottom: 18,
  },
  label: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: '#475569',
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 8,
  },
  charCount: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: 500,
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 10,
    border: '2px solid #E2E8F0',
    fontSize: 14,
    color: '#1E293B',
    outline: 'none',
    transition: 'border-color 0.2s ease',
    fontFamily: 'inherit',
  },
  textarea: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 10,
    border: '2px solid #E2E8F0',
    fontSize: 14,
    color: '#1E293B',
    outline: 'none',
    resize: 'none',
    transition: 'border-color 0.2s ease',
    fontFamily: 'inherit',
    lineHeight: 1.5,
  },
  tagSelector: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
};
