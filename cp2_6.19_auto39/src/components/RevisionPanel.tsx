import { useMemo } from 'react';
import { useContractStore } from '../store/useContractStore';
import type { FilterType, Comment } from '../types';
import './RevisionPanel.css';

const RevisionPanel = () => {
  const {
    comments,
    clauses,
    filterType,
    setFilterType,
    resolveComment,
    deleteComment,
    setHighlightedClause,
  } = useContractStore();

  const filteredComments = useMemo(() => {
    let result = [...comments];
    if (filterType === 'unresolved') {
      result = result.filter((c) => c.status === 'unresolved');
    } else if (filterType === 'resolved') {
      result = result.filter((c) => c.status === 'resolved');
    }
    return result.sort((a, b) => b.createdAt - a.createdAt);
  }, [comments, filterType]);

  const getClauseNumber = (clauseId: string): number => {
    const clause = clauses.find((c) => c.id === clauseId);
    return clause?.clauseNumber || 0;
  };

  const handleCommentClick = (comment: Comment) => {
    setHighlightedClause(comment.clauseId);
  };

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'unresolved', label: '未解决' },
    { key: 'resolved', label: '已解决' },
  ];

  const getRoleLabel = (role: string): string => {
    return role === 'initiator' ? '发起方' : '接收方';
  };

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <div className="revision-panel">
      <div className="panel-header">
        <h3 className="panel-title">批注与修订</h3>
        <span className="panel-count">{filteredComments.length} 条</span>
      </div>

      <div className="filter-tabs">
        {filters.map((filter) => (
          <button
            key={filter.key}
            className={`filter-tab ${
              filterType === filter.key ? 'active' : ''
            }`}
            onClick={() => setFilterType(filter.key)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="comment-list">
        {filteredComments.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" className="empty-icon">
              <path
                d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p>暂无批注记录</p>
          </div>
        ) : (
          <div key={filterType} className="comment-list-inner">
            {filteredComments.map((comment, index) => (
              <CommentItem
                key={`${filterType}-${comment.id}`}
                comment={comment}
                clauseNumber={getClauseNumber(comment.clauseId)}
                index={index}
                roleLabel={getRoleLabel(comment.authorRole)}
                timeLabel={formatTime(comment.createdAt)}
                onClick={() => handleCommentClick(comment)}
                onResolve={() => resolveComment(comment.id)}
                onDelete={() => deleteComment(comment.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface CommentItemProps {
  comment: Comment;
  clauseNumber: number;
  index: number;
  roleLabel: string;
  timeLabel: string;
  onClick: () => void;
  onResolve: () => void;
  onDelete: () => void;
}

function CommentItem({
  comment,
  clauseNumber,
  index,
  roleLabel,
  timeLabel,
  onClick,
  onResolve,
  onDelete,
}: CommentItemProps) {
  const isUnresolved = comment.status === 'unresolved';
  const summary =
    comment.content.length > 20
      ? comment.content.substring(0, 20) + '...'
      : comment.content;

  return (
    <div
      className={`comment-item ${isUnresolved ? 'unresolved' : 'resolved'}`}
      style={{
        animationDelay: `${index * 50}ms`,
      }}
      onClick={onClick}
    >
      <div className="comment-left-border" />
      <div className="comment-main">
        <div className="comment-meta">
          <span className={`comment-role role-${comment.authorRole}`}>
            {roleLabel}
          </span>
          <span className="comment-clause">第{clauseNumber}条</span>
        </div>
        <p className="comment-summary">{summary}</p>
        <div className="comment-footer">
          <span className="comment-time">{timeLabel}</span>
          <div className="comment-actions">
            {isUnresolved && (
              <button
                className="action-btn resolve-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onResolve();
                }}
                title="标记为已解决"
              >
                <svg viewBox="0 0 24 24" fill="none" className="action-icon">
                  <path
                    d="M20 6L9 17l-5-5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
            <button
              className="action-btn delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              title="删除"
            >
              <svg viewBox="0 0 24 24" fill="none" className="action-icon">
                <path
                  d="M18 6L6 18M6 6l12 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RevisionPanel;
