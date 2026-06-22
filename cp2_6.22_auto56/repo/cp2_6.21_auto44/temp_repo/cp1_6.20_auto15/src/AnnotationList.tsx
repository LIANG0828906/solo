import React, { useState, useCallback, useMemo } from 'react';
import type { Annotation } from './types';
import { formatRelativeTime, truncateText } from './utils';
import './AnnotationList.css';

interface AnnotationListProps {
  annotations: Annotation[];
  onToggleExpand: (id: string) => void;
  onAddReply: (annotationId: string, content: string) => void;
}

const AnnotationList: React.FC<AnnotationListProps> = ({
  annotations,
  onToggleExpand,
  onAddReply,
}) => {
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});

  const sortedAnnotations = useMemo(() => {
    return [...annotations].sort((a, b) => a.startLine - b.startLine);
  }, [annotations]);

  const handleReplyChange = useCallback((id: string, value: string) => {
    setReplyInputs((prev) => ({ ...prev, [id]: value }));
  }, []);

  const handleSubmitReply = useCallback((annotationId: string) => {
    const content = replyInputs[annotationId]?.trim();
    if (content) {
      onAddReply(annotationId, content);
      setReplyInputs((prev) => ({ ...prev, [annotationId]: '' }));
    }
  }, [replyInputs, onAddReply]);

  if (sortedAnnotations.length === 0) {
    return (
      <div className="annotation-list annotation-list-empty">
        <div className="annotation-list-placeholder">
          <div className="empty-icon">💬</div>
          <div className="empty-text">暂无批注</div>
          <div className="empty-hint">在左侧代码面板拖拽选择行来添加批注</div>
        </div>
      </div>
    );
  }

  return (
    <div className="annotation-list">
      <div className="annotation-list-header">
        <span className="annotation-count">{sortedAnnotations.length} 条批注</span>
      </div>
      <div className="annotation-list-content">
        {sortedAnnotations.map((annotation) => (
          <div
            key={annotation.id}
            className={`annotation-card ${annotation.isExpanded ? 'expanded' : ''}`}
          >
            <div
              className="annotation-card-header"
              onClick={() => onToggleExpand(annotation.id)}
            >
              <div className="annotation-line-range">
                <span className="line-badge">
                  {annotation.startLine === annotation.endLine
                    ? `第 ${annotation.startLine} 行`
                    : `第 ${annotation.startLine}-${annotation.endLine} 行`}
                </span>
              </div>
              <div className="annotation-summary">
                {truncateText(annotation.content, 60)}
              </div>
              <div className="annotation-meta">
                <span className="annotation-author">{annotation.author}</span>
                <span className="annotation-time">
                  {formatRelativeTime(annotation.createdAt)}
                </span>
                {annotation.replies.length > 0 && (
                  <span className="reply-count">
                    {annotation.replies.length} 条回复
                  </span>
                )}
              </div>
              <div className={`expand-icon ${annotation.isExpanded ? 'open' : ''}`}>
                ▼
              </div>
            </div>

            <div className="annotation-card-body">
              <div className="annotation-content">{annotation.content}</div>

              {annotation.replies.length > 0 && (
                <div className="replies-section">
                  <div className="replies-header">回复</div>
                  <div className="replies-list">
                    {annotation.replies.map((reply) => (
                      <div key={reply.id} className="reply-item">
                        <div className="reply-header">
                          <span className="reply-author">{reply.author}</span>
                          <span className="reply-time">
                            {formatRelativeTime(reply.createdAt)}
                          </span>
                        </div>
                        <div className="reply-content">{reply.content}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="reply-input-section">
                <textarea
                  className="reply-input"
                  value={replyInputs[annotation.id] || ''}
                  onChange={(e) => handleReplyChange(annotation.id, e.target.value)}
                  placeholder="添加回复..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      handleSubmitReply(annotation.id);
                    }
                  }}
                />
                <div className="reply-input-actions">
                  <button
                    className="btn btn-reply"
                    onClick={() => handleSubmitReply(annotation.id)}
                    disabled={!replyInputs[annotation.id]?.trim()}
                  >
                    回复
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default React.memo(AnnotationList);
