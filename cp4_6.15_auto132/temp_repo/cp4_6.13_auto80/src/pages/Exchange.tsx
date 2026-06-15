import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore, Exchange } from '../store';

function Exchange() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { exchanges, fetchExchanges, updateExchangeStatus } = useAppStore();
  const [exchange, setExchange] = useState<Exchange | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [hasRated, setHasRated] = useState(false);

  useEffect(() => {
    fetchExchanges();
  }, [fetchExchanges]);

  useEffect(() => {
    const found = exchanges.find(e => e.id === id);
    if (found) {
      setExchange(found);
    }
  }, [id, exchanges]);

  const handleStatusChange = async (status: string) => {
    if (!exchange) return;
    await updateExchangeStatus(exchange.id, status);
  };

  const handleSubmitReview = () => {
    setHasRated(true);
    setTimeout(() => {
      navigate('/home');
    }, 1500);
  };

  if (!exchange) {
    return (
      <div className="exchange-page">
        <div className="loading">加载中...</div>
      </div>
    );
  }

  const otherUser = exchange.otherUser;
  const skill = exchange.skill;

  const statusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: '待确认', color: '#f59e0b' },
    confirmed: { label: '已确认', color: '#3b82f6' },
    completed: { label: '已完成', color: '#10b981' },
    cancelled: { label: '已取消', color: '#6b7280' },
  };

  const config = statusConfig[exchange.status] || statusConfig.pending;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="exchange-page">
      <div className="exchange-container">
        <button className="back-btn" onClick={() => navigate('/home')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15,18 9,12 15,6" />
          </svg>
          返回
        </button>

        <div className="exchange-detail-card">
          <div className="status-banner" style={{ backgroundColor: config.color }}>
            <span className="status-label">{config.label}</span>
          </div>

          <div className="detail-header">
            <div
              className="avatar-large"
              style={{ backgroundColor: otherUser?.avatar || '#ccc' }}
            >
              {otherUser?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="user-info">
              <h2>{otherUser?.username || '未知用户'}</h2>
              <p className="role-text">
                {exchange.isRequester ? '技能提供方' : '技能预约方'}
              </p>
            </div>
          </div>

          <div className="detail-section">
            <h3>交换技能</h3>
            <div className="skill-detail">
              <span className="skill-name">{skill?.skill_name || '未知技能'}</span>
              <span className="skill-type">{skill?.skill_type}</span>
            </div>
            {skill?.description && (
              <p className="skill-description">{skill.description}</p>
            )}
          </div>

          <div className="detail-section">
            <h3>交换时间</h3>
            <div className="time-detail">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12,6 12,12 16,14" />
              </svg>
              <span>{formatDate(exchange.exchange_time)}</span>
            </div>
          </div>

          <div className="detail-section">
            <h3>积分</h3>
            <div className="points-detail">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2" />
              </svg>
              <span className="points-amount">{exchange.points}</span>
              <span className="points-unit">积分</span>
            </div>
          </div>

          {exchange.status === 'pending' && !exchange.isRequester && (
            <div className="action-buttons">
              <button className="btn-cancel" onClick={() => handleStatusChange('cancelled')}>
                拒绝
              </button>
              <button className="btn-confirm" onClick={() => handleStatusChange('confirmed')}>
                确认交换
              </button>
            </div>
          )}

          {exchange.status === 'confirmed' && (
            <div className="action-buttons">
              <button className="btn-cancel" onClick={() => handleStatusChange('cancelled')}>
                取消交换
              </button>
              <button className="btn-complete" onClick={() => handleStatusChange('completed')}>
                完成交换
              </button>
            </div>
          )}

          {exchange.status === 'completed' && !hasRated && (
            <div className="rating-section">
              <h3>评价</h3>
              <div className="star-rating">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    className={`star ${star <= rating ? 'active' : ''}`}
                    onClick={() => setRating(star)}
                  >
                    ★
                  </button>
                ))}
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="写下你的交换体验..."
                rows={4}
              />
              <button className="btn-submit-review" onClick={handleSubmitReview}>
                提交评价
              </button>
            </div>
          )}

          {hasRated && (
            <div className="review-success">
              <div className="success-icon">✓</div>
              <p>评价提交成功！</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .exchange-page {
          min-height: 100vh;
          padding: 20px;
        }

        .exchange-container {
          max-width: 600px;
          margin: 0 auto;
        }

        .back-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: rgba(255, 255, 255, 0.15);
          color: white;
          border-radius: 12px;
          font-size: 14px;
          margin-bottom: 20px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .back-btn:hover {
          background: rgba(255, 255, 255, 0.25);
        }

        .exchange-detail-card {
          background: white;
          border-radius: 24px;
          overflow: hidden;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .status-banner {
          padding: 16px 24px;
          text-align: center;
        }

        .status-label {
          color: white;
          font-weight: 600;
          font-size: 16px;
        }

        .detail-header {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 24px;
          border-bottom: 1px solid var(--border-color);
        }

        .avatar-large {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 24px;
          font-weight: 600;
        }

        .user-info h2 {
          font-size: 20px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 4px;
        }

        .role-text {
          font-size: 14px;
          color: var(--text-secondary);
        }

        .detail-section {
          padding: 20px 24px;
          border-bottom: 1px solid var(--border-color);
        }

        .detail-section:last-child {
          border-bottom: none;
        }

        .detail-section h3 {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-secondary);
          margin-bottom: 12px;
        }

        .skill-detail {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
        }

        .skill-name {
          font-size: 18px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .skill-type {
          padding: 4px 10px;
          background: var(--bg-secondary);
          border-radius: 20px;
          font-size: 12px;
          color: var(--text-secondary);
        }

        .skill-description {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        .time-detail,
        .points-detail {
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--text-primary);
        }

        .time-detail svg,
        .points-detail svg {
          color: var(--accent-purple);
        }

        .points-amount {
          font-size: 24px;
          font-weight: 700;
          color: var(--accent-purple);
        }

        .points-unit {
          font-size: 14px;
          color: var(--text-secondary);
        }

        .action-buttons {
          display: flex;
          gap: 12px;
          padding: 24px;
        }

        .btn-cancel,
        .btn-confirm,
        .btn-complete {
          flex: 1;
          padding: 14px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
        }

        .btn-cancel {
          background: var(--bg-secondary);
          color: var(--text-primary);
        }

        .btn-cancel:hover {
          background: var(--border-color);
        }

        .btn-confirm {
          background: var(--accent-blue);
          color: white;
        }

        .btn-complete {
          background: var(--accent-green);
          color: white;
        }

        .btn-confirm:hover,
        .btn-complete:hover {
          transform: translateY(-1px);
          box-shadow: var(--shadow-md);
        }

        .rating-section {
          padding: 24px;
        }

        .rating-section h3 {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 16px;
        }

        .star-rating {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
        }

        .star {
          font-size: 32px;
          background: none;
          border: none;
          color: #d1d5db;
          padding: 0;
        }

        .star.active {
          color: #fbbf24;
        }

        .star:hover {
          transform: scale(1.1);
        }

        .rating-section textarea {
          width: 100%;
          padding: 14px;
          border: 1px solid var(--border-color);
          border-radius: 12px;
          font-size: 14px;
          resize: vertical;
          margin-bottom: 16px;
          font-family: inherit;
        }

        .rating-section textarea:focus {
          border-color: var(--accent-purple);
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
        }

        .btn-submit-review {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, var(--accent-purple), var(--accent-blue));
          color: white;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
        }

        .btn-submit-review:hover {
          transform: translateY(-1px);
          box-shadow: var(--shadow-md);
        }

        .review-success {
          padding: 40px 24px;
          text-align: center;
        }

        .success-icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 16px;
          background: var(--accent-green);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          animation: pulse 0.5s ease;
        }

        @keyframes pulse {
          0% { transform: scale(0.8); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }

        .review-success p {
          font-size: 16px;
          color: var(--text-primary);
          font-weight: 500;
        }

        .loading {
          text-align: center;
          padding: 60px;
          color: white;
        }

        @media (max-width: 640px) {
          .exchange-page {
            padding: 16px;
          }

          .detail-header {
            padding: 20px;
          }

          .detail-section {
            padding: 16px 20px;
          }

          .action-buttons {
            padding: 20px;
          }
        }
      `}</style>
    </div>
  );
}

export default Exchange;
