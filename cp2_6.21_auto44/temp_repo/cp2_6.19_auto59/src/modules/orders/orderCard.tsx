import React, { memo, useState, useEffect } from 'react';
import type { Order, OrderStatus } from '@/types';
import { STATUS_TRANSITION, ORDER_STATUS_LABELS } from '@/types';
import { StatusBadge } from './statusBadge';

interface OrderCardProps {
  order: Order;
  onStatusUpdate: (id: string, status: OrderStatus) => void;
}

export const OrderCard: React.FC<OrderCardProps> = memo(function OrderCard({
  order,
  onStatusUpdate,
}) {
  const [isFlashing, setIsFlashing] = useState(false);
  const [prevStatus, setPrevStatus] = useState(order.status);

  useEffect(() => {
    if (order.status !== prevStatus) {
      setIsFlashing(true);
      const timer = setTimeout(() => setIsFlashing(false), 400);
      setPrevStatus(order.status);
      return () => clearTimeout(timer);
    }
  }, [order.status, prevStatus]);

  const nextStatus = STATUS_TRANSITION[order.status];

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getInitials = (name: string) => {
    return name.slice(0, 1);
  };

  return (
    <div className={`order-card card ${isFlashing ? 'flash' : ''}`}>
      <div className="order-header">
        <div className="order-user">
          <div
            className="user-avatar"
            style={{ backgroundColor: order.userAvatar }}
          >
            {getInitials(order.userName)}
          </div>
          <div className="user-info">
            <div className="user-name">{order.userName}</div>
            <div className="order-time">{formatTime(order.createdAt)}</div>
          </div>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="order-items">
        {order.items.map((item, index) => (
          <div key={index} className="order-item">
            <span className="item-name">{item.productName}</span>
            <span className="item-quantity">×{item.quantity}</span>
            <span className="item-price">¥{(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="order-footer">
        <div className="order-total">
          <span className="total-label">合计</span>
          <span className="total-amount">¥{order.totalAmount.toFixed(2)}</span>
        </div>
        {nextStatus && (
          <button
            className="btn btn-primary btn-sm"
            onClick={() => onStatusUpdate(order.id, nextStatus)}
          >
            {ORDER_STATUS_LABELS[nextStatus]}
          </button>
        )}
      </div>
      <style>{`
        .order-card {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .order-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .order-user {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .user-avatar {
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
        .user-info {
          display: flex;
          flex-direction: column;
        }
        .user-name {
          font-weight: 600;
          color: var(--color-text);
          font-size: 15px;
        }
        .order-time {
          font-size: 12px;
          color: var(--color-text-light);
        }
        .order-items {
          background-color: var(--color-background);
          border-radius: var(--radius-sm);
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .order-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
        }
        .item-name {
          flex: 1;
          color: var(--color-text);
        }
        .item-quantity {
          color: var(--color-text-light);
          font-size: 13px;
        }
        .item-price {
          color: var(--color-text);
          font-weight: 500;
          min-width: 60px;
          text-align: right;
        }
        .order-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .order-total {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }
        .total-label {
          font-size: 14px;
          color: var(--color-text-light);
        }
        .total-amount {
          font-size: 20px;
          font-weight: 700;
          color: var(--color-accent);
        }
      `}</style>
    </div>
  );
});
