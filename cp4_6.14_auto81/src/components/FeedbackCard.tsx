import React, { useState } from 'react';
import { Feedback } from '../api';

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(star => (
        <span key={star} style={{
          fontSize: 16,
          color: star <= rating ? '#f59e0b' : '#e2e8f0',
        }}>★</span>
      ))}
    </div>
  );
}

export default function FeedbackCard({ feedback }: { feedback: Feedback }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = feedback.comment.length > 200;
  const displayComment = isLong && !expanded
    ? feedback.comment.slice(0, 200) + '...'
    : feedback.comment;

  const date = new Date(feedback.timestamp);
  const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

  return (
    <div style={{
      width: '100%',
      maxWidth: 800,
      margin: '0 auto',
      padding: '16px 20px',
      borderBottom: '1px solid #e2e8f0',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            backgroundColor: '#3b82f6',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            fontWeight: 600,
          }}>
            {feedback.studentName.charAt(0)}
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{feedback.studentName}</span>
        </div>
        <span style={{ fontSize: 12, color: '#94a3b8' }}>{formattedDate}</span>
      </div>
      <StarDisplay rating={feedback.rating} />
      <div style={{
        fontSize: 14,
        color: '#334155',
        lineHeight: 1.6,
        marginTop: 8,
        maxHeight: expanded ? 500 : 80,
        overflow: 'hidden',
        transition: 'max-height 400ms ease-out',
      }}>
        {displayComment}
      </div>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            background: 'none',
            border: 'none',
            color: '#3b82f6',
            fontSize: 13,
            cursor: 'pointer',
            padding: '4px 0',
            fontWeight: 500,
          }}
        >
          {expanded ? '收起' : '展开'}
        </button>
      )}
    </div>
  );
}
