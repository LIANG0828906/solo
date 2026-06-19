import { useState, useMemo } from 'react';
import { useStore } from './store';

function SentimentIcon({ sentiment }: { sentiment: 'positive' | 'neutral' | 'negative' }) {
  if (sentiment === 'positive') return <span className="sentiment-icon" style={{ color: '#4CAF50' }}>✓</span>;
  if (sentiment === 'negative') return <span className="sentiment-icon" style={{ color: '#F44336' }}>✗</span>;
  return <span className="sentiment-icon" style={{ color: '#FFC107' }}>—</span>;
}

function ReadOnlyStars({ value }: { value: number }) {
  return (
    <div className="feedback-card-stars">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={`star readonly ${s <= value ? 'filled' : 'empty'}`}>
          {s <= value ? '★' : '☆'}
        </span>
      ))}
    </div>
  );
}

const PAGE_SIZE = 10;

export default function FeedbackList() {
  const { feedbacks, sortOrder, currentPage, dateRange, setSortOrder, setCurrentPage } = useStore();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const filteredFeedbacks = useMemo(() => {
    let result = feedbacks.filter((f) => {
      if (dateRange.start && f.date < dateRange.start) return false;
      if (dateRange.end && f.date > dateRange.end) return false;
      return true;
    });

    result.sort((a, b) => {
      if (sortOrder === 'newest') return b.date.localeCompare(a.date);
      return a.date.localeCompare(b.date);
    });

    return result;
  }, [feedbacks, sortOrder, dateRange]);

  const totalPages = Math.max(1, Math.ceil(filteredFeedbacks.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pagedFeedbacks = filteredFeedbacks.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const avgScore = (cq: number, ie: number, pv: number) =>
    ((cq + ie + pv) / 3).toFixed(1);

  return (
    <div className="feedback-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4>💬 反馈列表 ({filteredFeedbacks.length}条)</h4>
        <span className="sort-toggle" onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}>
          {sortOrder === 'newest' ? '↓ 最新优先' : '↑ 最旧优先'}
        </span>
      </div>

      {pagedFeedbacks.length === 0 ? (
        <div className="no-data">暂无反馈数据</div>
      ) : (
        <div className="feedback-list">
          {pagedFeedbacks.map((f) => {
            const isExpanded = expandedIds.has(f.id);
            const isTruncated = f.comment.length > 80;
            const displayComment = !isExpanded && isTruncated
              ? f.comment.slice(0, 80) + '...'
              : f.comment;

            return (
              <div
                key={f.id}
                className="feedback-card"
                onClick={() => isTruncated && toggleExpand(f.id)}
              >
                <div className="feedback-card-header">
                  <div className="avatar" style={{ background: f.avatarGradient }}>
                    {f.employeeName.charAt(0)}
                  </div>
                  <div className="feedback-card-info">
                    <div className="feedback-card-name">{f.employeeName}</div>
                    <div className="feedback-card-date">{f.date}</div>
                  </div>
                  <SentimentIcon sentiment={f.sentiment} />
                </div>
                <ReadOnlyStars value={Math.round((f.contentQuality + f.instructorExpression + f.practicalValue) / 3)} />
                <div style={{ fontSize: 11, color: '#A0AEC0', marginBottom: 4 }}>
                  内容{f.contentQuality} · 讲师{f.instructorExpression} · 实用{f.practicalValue} · 均分{avgScore(f.contentQuality, f.instructorExpression, f.practicalValue)}
                </div>
                <div className={`feedback-card-comment ${isExpanded ? 'expanded' : isTruncated ? 'truncated' : 'expanded'}`}>
                  {displayComment}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="pagination">
        <button
          className="page-btn"
          disabled={safePage <= 1}
          onClick={() => setCurrentPage(safePage - 1)}
        >
          上一页
        </button>
        <span>
          {safePage} / {totalPages}
        </span>
        <button
          className="page-btn"
          disabled={safePage >= totalPages}
          onClick={() => setCurrentPage(safePage + 1)}
        >
          下一页
        </button>
      </div>
    </div>
  );
}
