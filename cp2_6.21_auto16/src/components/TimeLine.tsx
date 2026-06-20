import type { Bid } from '@/store';

interface TimeLineProps {
  bids: Bid[];
  newBidId: number | null;
}

export default function TimeLine({ bids, newBidId }: TimeLineProps) {
  const formatTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60 * 1000) {
      return '刚刚';
    }
    if (diff < 60 * 60 * 1000) {
      const minutes = Math.floor(diff / (60 * 1000));
      return `${minutes}分钟前`;
    }
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000));
      return `${hours}小时前`;
    }
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="timeline-section">
      <h3 className="timeline-title">出价历史</h3>
      <div className="timeline-container">
        <div className="timeline-line"></div>
        {bids.length === 0 ? (
          <p className="timeline-empty">暂无出价记录</p>
        ) : (
          bids.map((bid) => (
            <div
              key={bid.id}
              className={`timeline-item ${bid.id === newBidId ? 'highlight' : ''}`}
            >
              <div className="timeline-dot"></div>
              <img
                src={bid.avatar}
                alt={bid.username}
                className="timeline-avatar"
              />
              <div className="timeline-content">
                <div className="timeline-header">
                  <span className="timeline-username">{bid.username}</span>
                  <span className="timeline-amount">¥{bid.amount.toLocaleString()}</span>
                </div>
                <span className="timeline-time">{formatTime(bid.createdAt)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
