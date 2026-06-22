import React, { useState } from 'react';
import type { Feedback } from '../App';

interface TimelineBoardProps {
  feedbacks: Feedback[];
}

function getSentimentType(
  sentiment: Feedback['sentiment'],
): 'positive' | 'negative' | 'neutral' {
  if (sentiment.positive > sentiment.negative && sentiment.positive > sentiment.neutral)
    return 'positive';
  if (sentiment.negative > sentiment.positive && sentiment.negative > sentiment.neutral)
    return 'negative';
  return 'neutral';
}

function truncate(text: string, maxLen: number): string {
  return text.length > maxLen ? text.slice(0, maxLen) + '...' : text;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function TimelineBoard({ feedbacks }: TimelineBoardProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="timeline-list">
      {feedbacks.map((fb, index) => {
        const sentimentType = getSentimentType(fb.sentiment);
        const isExpanded = expandedId === fb.id;
        const summary = truncate(fb.good + ' | ' + fb.bad + ' | ' + fb.improve, 30);

        return (
          <div
            className="timeline-item"
            key={fb.id}
            style={{ animationDelay: `${index * 100}ms` }}
            onClick={() => toggleExpand(fb.id)}
          >
            <div className={`timeline-dot ${sentimentType}`} />
            <div className="timeline-content">
              <div className="timeline-summary">{summary}</div>
              <div className="timeline-date">
                迭代 {fb.iteration} · {formatDate(fb.createdAt)}
              </div>
              <div className={`timeline-expand ${isExpanded ? 'expanded' : 'collapsed'}`}>
                <div className="timeline-detail">
                  <div className="timeline-detail-section">
                    <div className="timeline-detail-label good">👍 做得好的</div>
                    <div className="timeline-detail-text">{fb.good}</div>
                  </div>
                  <div className="timeline-detail-section">
                    <div className="timeline-detail-label bad">👎 做得差的</div>
                    <div className="timeline-detail-text">{fb.bad}</div>
                  </div>
                  <div className="timeline-detail-section">
                    <div className="timeline-detail-label improve">🔄 待改进的</div>
                    <div className="timeline-detail-text">{fb.improve}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
