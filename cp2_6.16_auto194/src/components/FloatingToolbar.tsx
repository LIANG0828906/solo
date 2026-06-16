import { useState, useCallback } from 'react';
import type { AnnotationType } from '@/types';
import { ANNOTATION_LABELS } from '@/utils/colors';
import styles from './FloatingToolbar.module.css';

interface FloatingToolbarProps {
  position: { top: number; left: number };
  selectedText: string;
  onSubmit: (type: AnnotationType, content: string) => void;
  onClose: () => void;
}

function FloatingToolbar({ position, selectedText, onSubmit, onClose }: FloatingToolbarProps) {
  const [type, setType] = useState<AnnotationType>('suggestion');
  const [content, setContent] = useState('');

  const handleSubmit = useCallback(() => {
    if (!content.trim()) return;
    onSubmit(type, content.trim());
    setContent('');
  }, [type, content, onSubmit]);

  return (
    <div
      className={`${styles.toolbar} ${styles[type]}`}
      style={{ top: position.top, left: position.left }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className={styles.selectedText}>
        选中："{selectedText.length > 20 ? selectedText.slice(0, 20) + '...' : selectedText}"
      </div>
      <div className={styles.typeSelector}>
        {(['suggestion', 'question', 'error'] as AnnotationType[]).map((t) => (
          <button
            key={t}
            className={`${styles.typeButton} ${type === t ? styles.active : ''}`}
            onClick={() => setType(t)}
          >
            {ANNOTATION_LABELS[t]}
          </button>
        ))}
      </div>
      <input
        className={styles.input}
        type="text"
        placeholder="输入批注内容..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleSubmit();
          }
          if (e.key === 'Escape') {
            onClose();
          }
        }}
        autoFocus
      />
      <button className={styles.submitButton} onClick={handleSubmit}>
        添加批注
      </button>
    </div>
  );
}

export default FloatingToolbar;
