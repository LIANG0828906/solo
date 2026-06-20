import { useState, useEffect, useCallback } from 'react';
import type { Annotation } from '../data/galleryData';
import {
  getAnnotationsByArtworkId,
  addAnnotation,
} from '../data/galleryData';

interface AnnotationPanelProps {
  artworkId: string | null;
}

const AnnotationPanel = ({ artworkId }: AnnotationPanelProps) => {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [commentInput, setCommentInput] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (artworkId) {
      setAnnotations(getAnnotationsByArtworkId(artworkId));
    } else {
      setAnnotations([]);
    }
  }, [artworkId]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!artworkId || !tagInput.trim() || !commentInput.trim()) return;

      const newAnnotation = addAnnotation(artworkId, tagInput.trim(), commentInput.trim());
      setAnnotations((prev) => [...prev, newAnnotation]);
      setTagInput('');
      setCommentInput('');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    },
    [artworkId, tagInput, commentInput]
  );

  const styles = {
    panel: {
      width: '300px',
      background: '#fff',
      border: '1px solid #e0e0e0',
      borderRadius: '4px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '16px',
      maxHeight: 'calc(100vh - 100px)',
      overflow: 'auto' as const,
    },
    panelResponsive: {
      width: '100%',
      maxHeight: 'none',
    },
    title: {
      fontSize: '16px',
      fontWeight: 600,
      color: '#333',
      marginBottom: '4px',
    },
    emptyState: {
      fontSize: '13px',
      color: '#999',
      textAlign: 'center' as const,
      padding: '20px 0',
    },
    list: {
      listStyle: 'none',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '12px',
      maxHeight: '300px',
      overflow: 'auto' as const,
      paddingRight: '4px',
    },
    listItem: {
      padding: '12px',
      background: '#f9f9f9',
      borderRadius: '6px',
      border: '1px solid #f0f0f0',
    },
    tagBadge: {
      display: 'inline-block',
      padding: '4px 10px',
      background: '#4a90d9',
      color: '#fff',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: 500,
      marginBottom: '8px',
    },
    commentText: {
      fontSize: '13px',
      color: '#555',
      lineHeight: 1.5,
      wordBreak: 'break-word' as const,
    },
    dateText: {
      fontSize: '11px',
      color: '#aaa',
      marginTop: '6px',
    },
    form: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '10px',
      marginTop: '8px',
      paddingTop: '16px',
      borderTop: '1px solid #f0f0f0',
    },
    label: {
      fontSize: '13px',
      fontWeight: 500,
      color: '#555',
    },
    input: {
      width: '100%',
      padding: '8px 12px',
      fontSize: '13px',
      border: '1px solid #ccc',
      borderRadius: '4px',
      outline: 'none',
      transition: 'border-color 0.2s ease',
      color: '#333',
    },
    textarea: {
      width: '100%',
      padding: '8px 12px',
      fontSize: '13px',
      border: '1px solid #ccc',
      borderRadius: '4px',
      outline: 'none',
      resize: 'vertical' as const,
      minHeight: '80px',
      transition: 'border-color 0.2s ease',
      color: '#333',
      fontFamily: 'inherit',
    },
    submitButton: {
      width: '100%',
      padding: '10px',
      background: '#4a90d9',
      color: '#fff',
      border: 'none',
      borderRadius: '4px',
      fontSize: '14px',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'transform 0.1s ease, opacity 0.2s ease',
    },
    submitButtonHover: {
      opacity: 0.9,
    },
    successWrap: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      color: '#4CAF50',
      fontSize: '13px',
      fontWeight: 500,
    },
    checkIcon: {
      fontSize: '16px',
      fontWeight: 700,
    },
  };

  const [inputFocused, setInputFocused] = useState<string | null>(null);
  const [buttonPressed, setButtonPressed] = useState(false);
  const [buttonHover, setButtonHover] = useState(false);

  return (
    <div
      style={{
        ...styles.panel,
        ...(typeof window !== 'undefined' && window.innerWidth < 768
          ? styles.panelResponsive
          : {}),
      }}
      className="annotation-panel"
    >
      <h3 style={styles.title}>标注记录</h3>

      {annotations.length === 0 ? (
        <div style={styles.emptyState}>
          暂无标注，快来添加第一个吧！
        </div>
      ) : (
        <ul style={styles.list}>
          {annotations.map((ann) => (
            <li key={ann.id} style={styles.listItem}>
              <span style={styles.tagBadge}>{ann.tag}</span>
              <p style={styles.commentText}>{ann.comment}</p>
              <p style={styles.dateText}>
                {new Date(ann.createdAt).toLocaleString('zh-CN')}
              </p>
            </li>
          ))}
        </ul>
      )}

      {showSuccess && (
        <div style={styles.successWrap}>
          <span style={styles.checkIcon}>✓</span>
          <span>标注添加成功！</span>
        </div>
      )}

      <form style={styles.form} onSubmit={handleSubmit}>
        <label style={styles.label} htmlFor="tag-input">
          标签
        </label>
        <input
          id="tag-input"
          type="text"
          placeholder="如：风格、年代、艺术家..."
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onFocus={() => setInputFocused('tag')}
          onBlur={() => setInputFocused(null)}
          style={{
            ...styles.input,
            borderColor: inputFocused === 'tag' ? '#4a90d9' : '#ccc',
          }}
        />

        <label style={styles.label} htmlFor="comment-input">
          评论
        </label>
        <textarea
          id="comment-input"
          placeholder="写下你对这幅画的看法..."
          value={commentInput}
          onChange={(e) => setCommentInput(e.target.value)}
          onFocus={() => setInputFocused('comment')}
          onBlur={() => setInputFocused(null)}
          style={{
            ...styles.textarea,
            borderColor: inputFocused === 'comment' ? '#4a90d9' : '#ccc',
          }}
        />

        <button
          type="submit"
          disabled={!tagInput.trim() || !commentInput.trim() || !artworkId}
          onMouseDown={() => setButtonPressed(true)}
          onMouseUp={() => setButtonPressed(false)}
          onMouseLeave={() => {
            setButtonPressed(false);
            setButtonHover(false);
          }}
          onMouseEnter={() => setButtonHover(true)}
          style={{
            ...styles.submitButton,
            transform: buttonPressed ? 'scale(0.95)' : 'scale(1)',
            opacity: !tagInput.trim() || !commentInput.trim() || !artworkId
              ? 0.5
              : buttonHover
              ? 0.9
              : 1,
            cursor: !tagInput.trim() || !commentInput.trim() || !artworkId
              ? 'not-allowed'
              : 'pointer',
          }}
        >
          提交标注
        </button>
      </form>
    </div>
  );
};

export default AnnotationPanel;
