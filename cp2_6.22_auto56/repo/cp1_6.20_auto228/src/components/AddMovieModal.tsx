import { useState, useEffect } from 'react';
import type { MovieFormData } from '../api';

interface AddMovieModalProps {
  onClose: () => void;
  onSubmit: (data: MovieFormData) => Promise<void>;
}

function AddMovieModal({ onClose, onSubmit }: AddMovieModalProps) {
  const [title, setTitle] = useState('');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [director, setDirector] = useState('');
  const [rating, setRating] = useState(3);
  const [review, setReview] = useState('');
  const [isEntering, setIsEntering] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsEntering(false), 20);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => onClose(), 350);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !director.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        year,
        director: director.trim(),
        rating,
        review: review.trim(),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = title.trim() && director.trim();

  return (
    <div
      style={{
        ...styles.overlay,
        opacity: isClosing ? 0 : isEntering ? 0 : 1,
        transition: 'opacity 0.35s ease-out',
      }}
      onClick={handleClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          ...styles.modal,
          transform: isClosing
            ? 'scale(0.85)'
            : isEntering
            ? 'scale(0.8)'
            : 'scale(1)',
          opacity: isClosing ? 0 : isEntering ? 0 : 1,
          transition:
            'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.35s ease-out',
        }}
      >
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>➕ 添加电影到书架</h2>
          <button style={styles.closeBtn} onClick={handleClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>电影名称 *</label>
            <input
              style={styles.input}
              type="text"
              placeholder="例如：肖申克的救赎"
              value={title}
              onChange={e => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div style={styles.fieldRow}>
            <div style={{ ...styles.field, flex: 1 }}>
              <label style={styles.label}>上映年份 *</label>
              <input
                style={styles.input}
                type="number"
                min="1900"
                max="2100"
                value={year}
                onChange={e => setYear(Number(e.target.value))}
              />
            </div>
            <div style={{ width: '16px' }} />
            <div style={{ ...styles.field, flex: 1.5 }}>
              <label style={styles.label}>导演 *</label>
              <input
                style={styles.input}
                type="text"
                placeholder="例如：弗兰克·德拉邦特"
                value={director}
                onChange={e => setDirector(e.target.value)}
              />
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>
              评分: <span style={{ color: '#ffd700' }}>★ {rating}/5</span>
            </label>
            <div style={styles.ratingStars}>
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  style={{
                    ...styles.starBtn,
                    color: star <= rating ? '#ffd700' : '#adb5bd',
                  }}
                >
                  {star <= rating ? '★' : '☆'}
                </button>
              ))}
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>个人短评</label>
            <textarea
              style={styles.textarea}
              placeholder="写下你的观影感受..."
              rows={4}
              value={review}
              onChange={e => setReview(e.target.value)}
            />
          </div>

          <div style={styles.actions}>
            <button
              type="button"
              style={styles.cancelBtn}
              onClick={handleClose}
            >
              取消
            </button>
            <button
              type="submit"
              style={{
                ...styles.submitBtn,
                opacity: canSubmit && !isSubmitting ? 1 : 0.6,
                cursor: canSubmit && !isSubmitting ? 'pointer' : 'not-allowed',
              }}
              disabled={!canSubmit || isSubmitting}
            >
              {isSubmitting ? '添加中...' : '放入书架'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modal: {
    width: '100%',
    maxWidth: '480px',
    backgroundColor: 'rgba(45, 45, 68, 0.85)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: '20px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 24px 64px rgba(0, 0, 0, 0.5)',
    overflow: 'hidden',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px 24px 16px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  },
  modalTitle: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 700,
    color: '#fff',
  },
  closeBtn: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
    fontSize: '18px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  form: {
    padding: '20px 24px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  fieldRow: {
    display: 'flex',
    alignItems: 'flex-end',
  },
  label: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  input: {
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(26, 26, 46, 0.6)',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
  },
  textarea: {
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(26, 26, 46, 0.6)',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.2s',
    resize: 'vertical',
    fontFamily: 'inherit',
    lineHeight: 1.5,
  },
  ratingStars: {
    display: 'flex',
    gap: '8px',
  },
  starBtn: {
    fontSize: '32px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    transition: 'color 0.2s',
    lineHeight: 1,
  },
  actions: {
    display: 'flex',
    gap: '12px',
    marginTop: '8px',
  },
  cancelBtn: {
    flex: 1,
    padding: '12px 20px',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    backgroundColor: 'transparent',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
  },
  submitBtn: {
    flex: 1.5,
    padding: '12px 20px',
    borderRadius: '12px',
    border: 'none',
    backgroundColor: '#667eea',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
    boxShadow: '0 4px 16px rgba(102, 126, 234, 0.4)',
  },
};

export default AddMovieModal;
