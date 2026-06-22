import { useState, useCallback, memo } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useAppStore } from '@/store';
import { ANNOTATION_LABELS } from '@/utils/colors';
import type { AnnotationItem } from '@/types';
import styles from './AnnotationPanel.module.css';

interface AnnotationPanelProps {
  documentId: string;
}

function AnnotationPanel({ documentId }: AnnotationPanelProps) {
  const annotations = useAppStore((state) => state.getAnnotationsForDocument(documentId));
  const addReply = useAppStore((state) => state.addReply);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [replyText, setReplyText] = useState<Record<string, string>>({});

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleReplyChange = useCallback((id: string, value: string) => {
    setReplyText((prev) => ({ ...prev, [id]: value }));
  }, []);

  const handleSubmitReply = useCallback(
    async (annotationId: string) => {
      const text = replyText[annotationId];
      if (!text?.trim()) return;

      await addReply(annotationId, documentId, text.trim());
      setReplyText((prev) => ({ ...prev, [annotationId]: '' }));
      setExpandedIds((prev) => new Set(prev).add(annotationId));
    },
    [replyText, documentId, addReply],
  );

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>批注列表</div>
      <div className={styles.list}>
        {annotations.length === 0 ? (
          <div className={styles.emptyState}>暂无批注，选中文本开始添加</div>
        ) : (
          annotations.map((annotation) => (
            <AnnotationItemComponent
              key={annotation.id}
              annotation={annotation}
              expanded={expandedIds.has(annotation.id)}
              replyText={replyText[annotation.id] || ''}
              onToggleExpand={toggleExpand}
              onReplyChange={handleReplyChange}
              onSubmitReply={handleSubmitReply}
              getInitials={getInitials}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface AnnotationItemProps {
  annotation: AnnotationItem;
  expanded: boolean;
  replyText: string;
  onToggleExpand: (id: string) => void;
  onReplyChange: (id: string, value: string) => void;
  onSubmitReply: (id: string) => void;
  getInitials: (name: string) => string;
}

const AnnotationItemComponent = memo(function AnnotationItemComponent({
  annotation,
  expanded,
  replyText,
  onToggleExpand,
  onReplyChange,
  onSubmitReply,
  getInitials,
}: AnnotationItemProps) {
  const typeCapitalized = annotation.type.charAt(0).toUpperCase() + annotation.type.slice(1);

  return (
    <div className={`${styles.item} ${styles[`item${typeCapitalized}`]}`}>
      <div className={styles.itemHeader}>
        <div
          className={styles.avatar}
          style={{ backgroundColor: annotation.authorColor }}
        >
          {getInitials(annotation.author)}
        </div>
        <div className={styles.itemContent}>
          <div className={styles.author}>{annotation.author}</div>
          <div className={styles.time}>
            {format(new Date(annotation.createdAt), 'MM-dd HH:mm', { locale: zhCN })}
          </div>
        </div>
      </div>
      <span className={`${styles.typeTag} ${styles[`type${typeCapitalized}`]}`}>
        {ANNOTATION_LABELS[annotation.type]}
      </span>
      <p className={styles.text}>{annotation.content}</p>
      <div className={styles.selectedText}>"{annotation.selectedText}"</div>

      <div className={styles.replySection}>
        {annotation.replies.length > 0 && (
          <div
            className={styles.replyCount}
            onClick={() => onToggleExpand(annotation.id)}
          >
            {expanded ? '收起回复' : `展开 ${annotation.replies.length} 条回复`}
          </div>
        )}

        {expanded && annotation.replies.length > 0 && (
          <div className={styles.replies}>
            {annotation.replies.map((reply) => (
              <div key={reply.id} className={styles.replyItem}>
                <div
                  className={styles.replyAvatar}
                  style={{ backgroundColor: reply.authorColor }}
                >
                  {getInitials(reply.author)}
                </div>
                <div className={styles.replyContent}>
                  <div className={styles.replyAuthor}>{reply.author}</div>
                  <div className={styles.replyText}>{reply.content}</div>
                  <div className={styles.replyTime}>
                    {format(new Date(reply.createdAt), 'MM-dd HH:mm', { locale: zhCN })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className={styles.replyInputWrapper}>
          <input
            type="text"
            className={styles.replyInput}
            placeholder="输入回复..."
            value={replyText}
            onChange={(e) => onReplyChange(annotation.id, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onSubmitReply(annotation.id);
              }
            }}
          />
          <button
            className={styles.replyButton}
            onClick={() => onSubmitReply(annotation.id)}
          >
            回复
          </button>
        </div>
      </div>
    </div>
  );
});

export default AnnotationPanel;
