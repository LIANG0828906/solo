import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Order } from '../types';
import './OrderCard.css';

interface OrderCardProps {
  order: Order;
}

const typeLabels: Record<string, string> = {
  shopping: '🛒 凑满减',
  carpool: '🚗 拼车',
  food: '🍔 拼外卖',
};

export default function OrderCard({ order }: OrderCardProps) {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState('');
  const [showFlash, setShowFlash] = useState(false);
  const [prevStatus, setPrevStatus] = useState(order.status);

  useEffect(() => {
    if (order.status !== prevStatus) {
      setShowFlash(true);
      const timer = setTimeout(() => setShowFlash(false), 500);
      setPrevStatus(order.status);
      return () => clearTimeout(timer);
    }
  }, [order.status, prevStatus]);

  useEffect(() => {
    const updateTimeLeft = () => {
      const now = new Date().getTime();
      const deadline = new Date(order.deadline).getTime();
      const diff = deadline - now;

      if (diff <= 0) {
        setTimeLeft('已结束');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 24) {
        setTimeLeft(`${Math.floor(hours / 24)}天${hours % 24}时`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}时${minutes}分`);
      } else {
        setTimeLeft(`${minutes}分${seconds}秒`);
      }
    };

    updateTimeLeft();
    const timer = setInterval(updateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [order.deadline]);

  const isCompleted = order.status === 'completed' || order.status === 'archived';

  return (
    <div
      className={`order-card ${isCompleted ? 'completed' : ''} ${showFlash ? 'flash' : ''}`}
      onClick={() => navigate(`/order/${order.id}`)}
    >
      <div className="card-header">
        <span className="card-type">{typeLabels[order.type] || order.type}</span>
        {isCompleted && <span className="card-status-badge">已完成</span>}
      </div>

      <h3 className="card-title">{order.title}</h3>

      <div className="card-creator">
        <img src={order.creatorAvatar} alt={order.creatorName} className="creator-avatar" />
        <span className="creator-name">{order.creatorName}</span>
      </div>

      <div className="card-info">
        <div className="info-item">
          <span className="info-label">金额</span>
          <span className="info-value">¥{order.totalAmount}</span>
        </div>
        <div className="info-item">
          <span className="info-label">人均</span>
          <span className="info-value">¥{(order.totalAmount / order.targetMembers).toFixed(2)}</span>
        </div>
      </div>

      <div className="card-progress">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${(order.currentMembers / order.targetMembers) * 100}%` }}
          />
        </div>
        <span className="progress-text">
          {order.currentMembers}/{order.targetMembers} 人
        </span>
      </div>

      <div className="card-footer">
        <span className="time-left">⏱ {timeLeft}</span>
        {order.matchRule && (
          <span className="match-rule-badge">自动匹配</span>
        )}
      </div>

      {order.matchRule && (
        <div className="match-rules">
          {order.matchRule.minAmount && (
            <span>最低 ¥{order.matchRule.minAmount}</span>
          )}
          {order.matchRule.maxMembers && (
            <span>最多 {order.matchRule.maxMembers} 人</span>
          )}
        </div>
      )}
    </div>
  );
}
