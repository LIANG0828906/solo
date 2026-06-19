import React, { useState } from 'react';
import type { Submission } from '../types';
import { useStore } from '../store/useStore';

interface SubmissionListPanelProps {
  submissions: Submission[];
  currentSubmissionId: string | null;
  onSelect: (id: string) => void;
  onAddClick: () => void;
  onBackClick: () => void;
  className?: string;
}

export const SubmissionListPanel: React.FC<SubmissionListPanelProps> = ({
  submissions,
  currentSubmissionId,
  onSelect,
  onAddClick,
  onBackClick,
  className = '',
}) => {
  const classData = useStore((state) =>
    state.classes.find((c) => c.id === state.currentClassId)
  );
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const togglePreview = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getPreviewText = (content: string) => {
    const plain = content.replace(/\n/g, ' ').trim();
    if (plain.length <= 100) return plain;
    return plain.slice(0, 100) + '…';
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    return `${month}/${day} ${hour}:${minute}`;
  };

  const getStatusText = (sub: Submission) => {
    if (sub.score !== null) return '已批改';
    if (sub.annotations.length > 0) return '批改中';
    return '待批改';
  };

  const getStatusClass = (sub: Submission) => {
    if (sub.score !== null) return 'status-graded';
    if (sub.annotations.length > 0) return 'status-grading';
    return 'status-pending';
  };

  return (
    <div className={`submission-list-panel ${className}`}>
      <div className="panel-header">
        <button className="back-btn" onClick={onBackClick}>
          ← 返回
        </button>
        <div className="panel-title-section">
          <h2 className="panel-title">{classData?.name || '班级'}</h2>
          <span className="submission-count">共 {submissions.length} 份作业</span>
        </div>
      </div>

      <div className="panel-actions">
        <button className="add-submission-btn" onClick={onAddClick}>
          + 添加作业
        </button>
      </div>

      <div className="submission-list">
        {submissions.length === 0 ? (
          <div className="empty-list">
            <p>暂无作业</p>
            <p className="empty-hint">点击上方按钮添加作业</p>
          </div>
        ) : (
          submissions.map((sub, index) => {
            const isExpanded = expandedIds.has(sub.id);
            return (
              <div
                key={sub.id}
                className={`submission-item fade-in-item ${
                  currentSubmissionId === sub.id ? 'active' : ''
                } ${isExpanded ? 'expanded' : ''}`}
                onClick={() => onSelect(sub.id)}
                style={{ animationDelay: `${index * 0.03}s` }}
              >
                <div className="item-left-bar"></div>
                <div className="item-content">
                  <div className="item-header">
                    <span className="student-name">{sub.studentName}</span>
                    <span className={`status-badge ${getStatusClass(sub)}`}>
                      {getStatusText(sub)}
                    </span>
                  </div>
                  <div className="item-title">{sub.title}</div>
                  <div className="item-footer">
                    <span className="submit-time">{formatDate(sub.submittedAt)}</span>
                    <div className="item-meta">
                      {sub.score !== null && (
                        <span className="score-badge">{sub.score}分</span>
                      )}
                      <span className="annotation-count">
                        {sub.annotations.length} 条批注
                      </span>
                    </div>
                  </div>
                  <button
                    className="preview-toggle-btn"
                    onClick={(e) => togglePreview(e, sub.id)}
                  >
                    {isExpanded ? '收起预览 ▲' : '展开预览 ▼'}
                  </button>
                  <div
                    className={`preview-area ${isExpanded ? 'open' : ''}`}
                  >
                    {isExpanded && (
                      <div className="preview-text">
                        {getPreviewText(sub.content)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <style>{`
        .submission-list-panel {
          width: 280px;
          background: #fff;
          border-right: 1px solid #e5e5e5;
          display: flex;
          flex-direction: column;
          height: 100vh;
          flex-shrink: 0;
        }

        .panel-header {
          padding: 16px 16px 12px;
          border-bottom: 1px solid #f0f0f0;
        }

        .back-btn {
          background: none;
          border: none;
          color: #4a90d9;
          font-size: 14px;
          padding: 4px 0;
          margin-bottom: 8px;
          cursor: pointer;
        }

        .back-btn:hover {
          color: #3a7bc8;
        }

        .panel-title-section {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }

        .panel-title {
          font-size: 18px;
          font-weight: 600;
          color: #333;
          margin: 0;
        }

        .submission-count {
          font-size: 12px;
          color: #999;
        }

        .panel-actions {
          padding: 12px 16px;
          border-bottom: 1px solid #f0f0f0;
        }

        .add-submission-btn {
          width: 100%;
          background: #ff8c42;
          color: white;
          padding: 10px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
        }

        .add-submission-btn:hover {
          background: #f57c2f;
        }

        .submission-list {
          flex: 1;
          overflow-y: auto;
          padding: 8px 0;
        }

        .empty-list {
          text-align: center;
          padding: 40px 16px;
          color: #999;
        }

        .empty-list p {
          margin: 4px 0;
          font-size: 14px;
        }

        .empty-hint {
          font-size: 12px !important;
          color: #bbb;
        }

        .submission-item {
          padding: 8px 16px 8px 0;
          cursor: pointer;
          display: flex;
          align-items: flex-start;
          position: relative;
          transition: background 0.2s;
          opacity: 0;
        }

        .submission-item.fade-in-item {
          animation: fadeInItem 0.3s ease forwards;
        }

        @keyframes fadeInItem {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .submission-item:hover {
          background: #f8f9fa;
        }

        .submission-item.active {
          background: #f0f6fc;
        }

        .submission-item:not(.expanded) {
          min-height: 52px;
          align-items: center;
        }

        .item-left-bar {
          width: 4px;
          align-self: stretch;
          background: transparent;
          margin-right: 12px;
          border-radius: 0 2px 2px 0;
          transition: background 0.2s;
          flex-shrink: 0;
        }

        .submission-item.active .item-left-bar {
          background: #4a90d9;
        }

        .item-content {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
        }

        .item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2px;
        }

        .student-name {
          font-size: 13px;
          font-weight: 600;
          color: #333;
        }

        .status-badge {
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 500;
        }

        .status-pending {
          background: #fff4e5;
          color: #ff8c42;
        }

        .status-grading {
          background: #e8f0fe;
          color: #4a90d9;
        }

        .status-graded {
          background: #e6f7ea;
          color: #2ecc71;
        }

        .item-title {
          font-size: 12px;
          color: #666;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 2px;
        }

        .item-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .submit-time {
          font-size: 11px;
          color: #aaa;
        }

        .item-meta {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .score-badge {
          font-size: 11px;
          font-weight: 600;
          color: #ff8c42;
        }

        .annotation-count {
          font-size: 11px;
          color: #999;
        }

        .preview-toggle-btn {
          background: none;
          border: none;
          color: #4a90d9;
          font-size: 11px;
          padding: 3px 0;
          margin-top: 4px;
          cursor: pointer;
          align-self: flex-start;
        }

        .preview-toggle-btn:hover {
          color: #3a7bc8;
          text-decoration: underline;
        }

        .preview-area {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.25s ease;
        }

        .preview-area.open {
          max-height: 120px;
        }

        .preview-text {
          margin-top: 6px;
          padding: 8px 10px;
          background: #f8f9fa;
          border-radius: 6px;
          font-size: 12px;
          color: #555;
          line-height: 1.6;
          border-left: 3px solid #4a90d9;
        }

        @media (max-width: 768px) {
          .submission-list-panel {
            width: 100%;
            height: auto;
            border-right: none;
            border-bottom: 1px solid #e5e5e5;
          }

          .submission-list {
            max-height: 200px;
          }
        }
      `}</style>
    </div>
  );
};
