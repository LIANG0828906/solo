import React, { useState } from 'react';
import { Clock, Users } from 'lucide-react';
import type { TableRequest } from '@/types';
import { formatShortDate } from '@/data';

interface TableCardProps {
  table: TableRequest;
  onClick: () => void;
  onJoin: () => void;
}

const TableCard: React.FC<TableCardProps> = ({ table, onClick, onJoin }) => {
  const [flipping, setFlipping] = useState(false);
  const joinedCount = table.participants.length;
  const remaining = Math.max(0, table.maxPeople - joinedCount);
  const isFull = remaining <= 0 || table.status === 'full';
  const percent = Math.min(100, (joinedCount / table.maxPeople) * 100);
  const circumference = 2 * Math.PI * 22;
  const dashOffset = circumference * (1 - percent / 100);

  const handleCardClick = (e: React.MouseEvent) => {
    if (isFull) return;
    setFlipping(true);
    onClick();
  };

  const handleFlipEnd = () => {
    setFlipping(false);
  };

  const handleJoinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFull) return;
    onJoin();
  };

  const progressStroke = isFull ? '#868E96' : '#FF6B6B';
  const progressBgStroke = isFull ? '#DEE2E6' : '#F1F3F5';
  const progressNumColor = isFull ? '#868E96' : '#FF6B6B';
  const progressLabelColor = isFull ? '#ADB5BD' : '#ADB5BD';

  return (
    <div
      className={`table-card ${flipping ? 'flip' : ''} ${isFull ? 'full' : ''}`}
      onClick={handleCardClick}
      onAnimationEnd={handleFlipEnd}
    >
      <img src={table.foodImage} alt="" className="table-card-image" loading="lazy" />
      {isFull && <span className="card-full-badge">已满员</span>}
      <div className="table-card-body">
        <div className="card-host-row">
          <div className="host-avatar" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            background: 'var(--cream-dark)'
          }}>
            {table.host.avatar}
          </div>
          <div className="host-info">
            <div className="host-name">{table.host.nickname}</div>
            <div className="host-community">{table.host.community}</div>
          </div>
        </div>

        <div className="card-info-row">
          <div className="card-time">
            <Clock className="card-time-icon" strokeWidth={2} />
            {formatShortDate(table.time)}
          </div>
          <div className="card-time" style={{ color: 'var(--text-muted)' }}>
            <Users className="card-time-icon" style={{ color: 'var(--text-muted)', width: 15, height: 15 }} strokeWidth={2} />
            {joinedCount}/{table.maxPeople}人
          </div>
        </div>

        <div className="card-bottom">
          <div className="progress-wrapper">
            <svg className="progress-svg" width="54" height="54" viewBox="0 0 54 54">
              <circle className="progress-bg" cx="27" cy="27" r="22" style={{ stroke: progressBgStroke }} />
              <circle
                className="progress-fill"
                cx="27"
                cy="27"
                r="22"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                style={{ stroke: progressStroke }}
              />
            </svg>
            <div className="progress-text">
              <span className="progress-num" style={{ color: progressNumColor }}>
                {remaining > 0 ? remaining : '✓'}
              </span>
              <span className="progress-label" style={{ color: progressLabelColor }}>
                {remaining > 0 ? '缺' : '满'}
              </span>
            </div>
          </div>

          <div className="card-cost">
            <div className="cost-label">人均约</div>
            <div>
              <span className="cost-value" style={isFull ? { color: 'var(--text-secondary)' } : undefined}>¥{table.costPerPerson}</span>
              <span className="cost-unit">/人</span>
            </div>
          </div>

          <button
            className={`btn ${isFull ? 'btn-ghost' : 'btn-primary'} btn-sm`}
            onClick={handleJoinClick}
            disabled={isFull}
          >
            {isFull ? '已约满' : '加入'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TableCard;
