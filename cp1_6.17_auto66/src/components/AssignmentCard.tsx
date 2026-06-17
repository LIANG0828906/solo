import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import type { Submission } from '../types';
import { getRelativeTime } from '../utils';
import '../styles/AssignmentCard.css';

interface AssignmentCardProps {
  submission: Submission;
  onClick: () => void;
  expanded?: boolean;
}

const AssignmentCard: React.FC<AssignmentCardProps> = ({ submission, onClick, expanded = false }) => {
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const isGraded = submission.status === 'graded';
  const relativeTime = getRelativeTime(submission.submittedAt);

  return (
    <div
      className={`assignment-card ${expanded ? 'expanded' : ''} ${isGraded ? 'graded' : 'pending'}`}
      onClick={onClick}
    >
      <div className="card-header">
        <div className="status-indicator">
          <span className={`status-dot ${isGraded ? 'status-graded' : 'status-pending'}`} />
          <span className="status-text">{isGraded ? '已批改' : '待批改'}</span>
        </div>
        <span className="student-name">{submission.studentName}</span>
      </div>
      
      <div className="card-content">
        <p className="content-preview">
          {submission.content.length > 100
            ? submission.content.substring(0, 100) + '...'
            : submission.content}
        </p>
        {submission.fileUrl && (
          <a
            href={submission.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="file-link"
            onClick={(e) => e.stopPropagation()}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            查看附件
          </a>
        )}
      </div>
      
      <div className="card-footer">
        {isGraded && submission.grade !== undefined && (
          <div className="grade-badge">
            <span className="grade-score">{submission.grade}</span>
            <span className="grade-label">分</span>
          </div>
        )}
        <span className="submit-time">{relativeTime}</span>
      </div>
    </div>
  );
};

export default AssignmentCard;
