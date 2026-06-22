import { Exchange } from '../store';

interface ExchangeCardProps {
  exchange: Exchange;
  onConfirm?: (exchange: Exchange) => void;
  onComplete?: (exchange: Exchange) => void;
  onCancel?: (exchange: Exchange) => void;
  index?: number;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: '待确认', color: '#f59e0b', bgColor: '#fffbeb' },
  confirmed: { label: '已确认', color: '#3b82f6', bgColor: '#eff6ff' },
  completed: { label: '已完成', color: '#10b981', bgColor: '#ecfdf5' },
  cancelled: { label: '已取消', color: '#6b7280', bgColor: '#f3f4f6' },
};

function ExchangeCard({ exchange, onConfirm, onComplete, onCancel, index = 0 }: ExchangeCardProps) {
  const config = statusConfig[exchange.status] || statusConfig.pending;
  const otherUser = exchange.otherUser;
  const skill = exchange.skill;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      className={`exchange-card status-${exchange.status}`}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="exchange-header">
        <div className="user-info">
          <div
            className="avatar"
            style={{ backgroundColor: otherUser?.avatar || '#ccc }}
          >
            {otherUser?.username?.charAt(0).toUpperCase() || '?'}
          </div>
          <div className="user-details">
            <span className="username">{otherUser?.username || '未知用户'}</span>
            <span className="exchange-role">
              {exchange.isRequester ? '对方提供方' : '预约方'}
            </span>
          </div>
        </div>
        <span
          className="status-badge"
          style={{ backgroundColor: config.bgColor, color: config.color }}
        >
          {config.label}
        </span>
      </div>

      <div className="exchange-body">
        <div className="skill-info">
          <span className="skill-label">技能</span>
          <span className="skill-name">{skill?.skill_name || '未知技能'}</span>
        </div>
        <div className="time-info">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12,6 12,12 16,14" />
          </svg>
          <span>{formatDate(exchange.exchange_time)}</span>
        </div>
        <div className="points-info">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2" />
          </svg>
          <span>{exchange.points} 积分</span>
        </div>
      </div>

      <div className="exchange-actions">
        {exchange.status === 'pending' && !exchange.isRequester && onConfirm && (
          <button className="action-btn confirm" onClick={() => onConfirm(exchange)}>
            确认交换
          </button>
        )}
        {exchange.status === 'confirmed' && onComplete && (
          <button className="action-btn complete" onClick={() => onComplete(exchange)}>
            完成交换
          </button>
        )}
        {(exchange.status === 'pending' || exchange.status === 'confirmed') && onCancel && (
          <button className="action-btn cancel" onClick={() => onCancel(exchange)}>
            取消
          </button>
        )}
      </div>

      <style>{`
        .exchange-card {
          background: white;
          border-radius: 16px;
          padding: 20px;
          border: 1px solid var(--border-color);
          transition: all var(--transition-fast);
          animation: slideInLeft 0.3s ease backwards;
          position: relative;
          overflow: hidden;
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .exchange-card::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          transition: background-color 0.3s ease;
        }

        .exchange-card.status-pending::before {
          background: #f59e0b;
        }

        .exchange-card.status-confirmed::before {
          background: #3b82f6;
        }

        .exchange-card.status-completed {
          background: linear-gradient(135deg, #ecfdf5 0%, white 100%);
        }

        .exchange-card.status-completed::before {
          background: #10b981;
        }

        .exchange-card.status-cancelled {
          opacity: 0.7;
        }

        .exchange-card.status-cancelled::before {
          background: #6b7280;
        }

        .exchange-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 16px;
        }

        .user-details {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .username {
          font-weight: 600;
          color: var(--text-primary);
          font-size: 15px;
        }

        .exchange-role {
          font-size: 12px;
          color: var(--text-secondary);
        }

        .status-badge {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          transition: all var(--transition-fast);
        }

        .exchange-body {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border-color);
          margin-bottom: 16px;
        }

        .skill-info {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .skill-label {
          font-size: 13px;
          color: var(--text-secondary);
        }

        .skill-name {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary);
        }

        .time-info,
        .points-info {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--text-secondary);
        }

        .exchange-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
        }

        .action-btn {
          padding: 8px 16px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 500;
          border: 1px solid;
          background: white;
          transition: all var(--transition-fast);
        }

        .action-btn.confirm {
          color: var(--accent-green);
          border-color: var(--accent-green);
        }

        .action-btn.confirm:hover {
          background: var(--accent-green);
          color: white;
        }

        .action-btn.complete {
          color: var(--accent-blue);
          border-color: var(--accent-blue);
        }

        .action-btn.complete:hover {
          background: var(--accent-blue);
          color: white;
        }

        .action-btn.cancel {
          color: var(--text-secondary);
          border-color: var(--border-color);
        }

        .action-btn.cancel:hover {
          background: var(--bg-secondary);
          color: var(--text-primary);
        }
      `}</style>
    </div>
  );
}

export default ExchangeCard;
