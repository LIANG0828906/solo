import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaImage,
  FaFileAudio,
  FaVideo,
  FaFileAlt,
  FaCheck,
  FaCircle,
  FaChevronDown,
  FaChevronUp,
} from 'react-icons/fa';
import {
  useFeedback,
  Feedback,
  FeedbackType,
  formatRelativeTime,
  formatFileSize,
  FeedbackStatus,
  STATUS_COLORS,
} from '../store/feedbackReducer';

const FeedbackBoard: React.FC = () => {
  const { state, dispatch } = useFeedback();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sortedFeedbacks = useMemo(
    () =>
      [...state.feedbacks].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      ),
    [state.feedbacks]
  );

  const getTypeIcon = (type: FeedbackType) => {
    switch (type) {
      case 'image':
        return FaImage;
      case 'audio':
        return FaFileAudio;
      case 'video':
        return FaVideo;
      case 'text':
        return FaFileAlt;
    }
  };

  const toggleStatus = (id: string, current: FeedbackStatus) => {
    const next: FeedbackStatus = current === 'pending' ? 'processed' : 'pending';
    dispatch({ type: 'UPDATE_STATUS', payload: { id, status: next } });
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const renderMediaPreview = (fb: Feedback) => {
    switch (fb.type) {
      case 'image':
        return (
          <img
            src={fb.content}
            alt={fb.fileName}
            className="preview-media"
            style={{ maxWidth: '100%', borderRadius: 8 }}
          />
        );
      case 'audio':
        return (
          <audio controls src={fb.content} className="preview-media" />
        );
      case 'video':
        return (
          <video
            controls
            src={fb.content}
            className="preview-media"
            style={{ maxWidth: '100%', borderRadius: 8 }}
          />
        );
      case 'text':
        return (
          <div className="preview-text">{fb.content}</div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="board-container">
      <style>{boardStyles}</style>

      <h2 className="page-title">反馈看板</h2>

      {sortedFeedbacks.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="empty-state"
        >
          <FaFileAlt className="empty-icon" />
          <p className="empty-title">暂无反馈</p>
          <p className="empty-hint">前往「反馈收录」模块添加第一条反馈</p>
        </motion.div>
      ) : (
        <div className="waterfall">
          <React.Fragment>
            {sortedFeedbacks.map((fb) => {
              const Icon = getTypeIcon(fb.type);
              const isExpanded = expandedId === fb.id;
              return (
                <motion.div
                  key={fb.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ ease: 'easeOut' }}
                  className={`card ${isExpanded ? 'expanded' : ''}`}
                  onClick={() => toggleExpand(fb.id)}
                >
                  <div className="status-badge-wrapper">
                    <button
                      className="status-toggle-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStatus(fb.id, fb.status);
                      }}
                      title={
                        fb.status === 'pending'
                          ? '待处理，点击标记为已处理'
                          : '已处理，点击标记为待处理'
                      }
                    >
                      {fb.status === 'processed' ? (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 500 }}
                          style={{ color: STATUS_COLORS.processed }}
                        >
                          <FaCheck className="status-icon" />
                        </motion.span>
                      ) : (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          style={{ color: STATUS_COLORS.pending }}
                        >
                          <FaCircle className="status-icon pending" />
                        </motion.span>
                      )}
                    </button>
                  </div>

                  <div className="card-header">
                    <div className="card-type-icon">
                      <Icon />
                    </div>
                    <div className="card-title-wrap">
                      <div className="card-title" title={fb.fileName}>
                        {fb.fileName}
                      </div>
                      <div className="card-meta">
                        <span className="card-time">
                          {formatRelativeTime(new Date(fb.createdAt))}
                        </span>
                        {fb.type !== 'text' && (
                          <span className="card-size">
                            · {formatFileSize(fb.fileSize)}
                          </span>
                        )}
                      </div>
                    </div>
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className="expand-indicator"
                    >
                      <FaChevronDown />
                    </motion.div>
                  </div>

                  {fb.tags.length > 0 && (
                    <div className="card-tags">
                      {fb.tags.map((tag) => (
                        <span
                          key={tag.name}
                          className="tag-chip"
                          style={{ background: tag.color }}
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}

                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="card-expand-wrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="card-expand-content">
                          {renderMediaPreview(fb)}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </React.Fragment>
        </div>
      )}
    </div>
  );
};

export default FeedbackBoard;

const boardStyles = `
.board-container {
  padding: 24px 32px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-title {
  font-size: 20px;
  font-weight: 700;
  color: #2C3E50;
  margin: 0 0 24px 0;
}

.empty-state {
  text-align: center;
  padding: 80px 24px;
  background: #F7F9FC;
  border-radius: 16px;
  color: #7F8C8D;
}

.empty-icon {
  font-size: 56px;
  margin-bottom: 16px;
  opacity: 0.3;
}

.empty-title {
  font-size: 16px;
  font-weight: 600;
  color: #2C3E50;
  margin: 0 0 4px 0;
}

.empty-hint {
  font-size: 13px;
  margin: 0;
}

.waterfall {
  column-count: 2;
  column-gap: 12px;
}

@media (max-width: 768px) {
  .waterfall {
    column-count: 1;
  }
}

.card {
  position: relative;
  break-inside: avoid;
  margin-bottom: 12px;
  background: #F7F9FC;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: border-color 0.3s ease-out, transform 0.3s ease-out;
  overflow: hidden;
}

.card:hover {
  border-color: #2C3E50;
}

.card.expanded {
  border-color: #2C3E50;
}

.status-badge-wrapper {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 2;
}

.status-toggle-btn {
  background: white;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  transition: transform 0.2s ease-out, box-shadow 0.2s ease-out;
  padding: 0;
}

.status-toggle-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.status-icon {
  font-size: 14px;
}

.status-icon.pending {
  font-size: 10px;
}

.card-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding-right: 40px;
}

.card-type-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2C3E50;
  font-size: 14px;
  flex-shrink: 0;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}

.card-title-wrap {
  flex: 1;
  min-width: 0;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: #2C3E50;
  line-height: 1.4;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #95A5A6;
}

.expand-indicator {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #95A5A6;
  flex-shrink: 0;
  font-size: 11px;
  align-self: center;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
}

.tag-chip {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  color: white;
}

.card-expand-wrap {
  overflow: hidden;
  margin-top: 0;
}

.card-expand-content {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #ECF0F1;
}

.preview-media {
  width: 100%;
  display: block;
}

.preview-text {
  background: white;
  border-radius: 8px;
  padding: 14px 16px;
  font-size: 13px;
  line-height: 1.7;
  color: #34495E;
  white-space: pre-wrap;
  word-break: break-word;
  border: 1px solid #ECF0F1;
  max-height: 400px;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .board-container {
    padding: 16px;
  }
}
`;
