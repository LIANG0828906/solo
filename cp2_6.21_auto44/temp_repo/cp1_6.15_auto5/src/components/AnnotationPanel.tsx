import { useState, useCallback, useRef, useEffect } from 'react';
import type { Annotation, User } from '../types';
import styles from './AnnotationPanel.module.css';

interface AnnotationPanelProps {
  annotations: Annotation[];
  user: User;
  onAdd: (annotation: Annotation) => void;
}

function AnnotationPanel({ annotations, user, onAdd }: AnnotationPanelProps) {
  const [newAnnotation, setNewAnnotation] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const latestAnnotationRef = useRef<HTMLDivElement>(null);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnotation.trim()) return;

    const annotation: Annotation = {
      id: Date.now().toString(),
      content: newAnnotation.trim(),
      author: user.name,
      avatar: user.avatar,
      createdAt: Date.now(),
    };

    onAdd(annotation);
    setNewAnnotation('');
  }, [newAnnotation, user, onAdd]);

  useEffect(() => {
    if (annotations.length > 0 && latestAnnotationRef.current) {
      latestAnnotationRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [annotations.length]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  const sortedAnnotations = [...annotations].sort((a, b) => a.createdAt - b.createdAt);

  return (
    <div className={styles.panel} data-no-toggle>
      <div className={styles.header}>
        <h4 className={styles.title}>💬 烹饪心得</h4>
        <span className={styles.count}>{annotations.length} 条批注</span>
      </div>

      <div className={styles.annotationsList}>
        {sortedAnnotations.length === 0 ? (
          <p className={styles.empty}>还没有批注，来说说你的想法吧～</p>
        ) : (
          sortedAnnotations.map((annotation, index) => {
            const isLatest = index === sortedAnnotations.length - 1;
            return (
              <div
                key={annotation.id}
                ref={isLatest ? latestAnnotationRef : null}
                className={`${styles.annotationItem} ${isLatest ? styles.latest : ''}`}
                style={{
                  animationDelay: `${Math.min(index * 0.05, 0.3)}s`,
                }}
              >
                <img src={annotation.avatar} alt={annotation.author} className={styles.avatar} />
                <div className={styles.annotationContent}>
                  <div className={styles.annotationHeader}>
                    <span className={styles.author}>{annotation.author}</span>
                    <span className={styles.time}>{formatTime(annotation.createdAt)}</span>
                  </div>
                  <p className={styles.text}>{annotation.content}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSubmit} className={styles.inputForm}>
        <div className={styles.inputWrapper}>
          <img src={user.avatar} alt={user.name} className={styles.inputAvatar} />
          <textarea
            ref={inputRef}
            className={styles.input}
            placeholder="添加你的烹饪心得或替代食材..."
            value={newAnnotation}
            onChange={(e) => setNewAnnotation(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            rows={2}
          />
        </div>
        <button
          type="submit"
          className={styles.submitBtn}
          disabled={!newAnnotation.trim()}
        >
          发送
        </button>
      </form>
    </div>
  );
}

export default AnnotationPanel;
