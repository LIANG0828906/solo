import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Order, OrderStatus } from '../api';

interface OrderCardProps {
  order: Order;
  status: OrderStatus;
  justDroppedKey?: string;
}

const statusLabels: Record<OrderStatus, string> = {
  pending: '待处理',
  processing: '处理中',
  completed: '已完成',
};

const formatTime = (iso: string) => {
  const d = new Date(iso);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');
  return `${month}/${day} ${hour}:${minute}`;
};

export const OrderCard: React.FC<OrderCardProps> = ({ order, status, justDroppedKey }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [playDropAnim, setPlayDropAnim] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (justDroppedKey && justDroppedKey === order.id) {
      setPlayDropAnim(true);
      const t = window.setTimeout(() => setPlayDropAnim(false), 320);
      return () => window.clearTimeout(t);
    }
  }, [justDroppedKey, order.id]);

  const handleDragStart = useCallback((e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', order.id);
    const el = cardRef.current;
    if (el) {
      el.style.opacity = '0.7';
      el.style.transform = 'scale(0.95)';
      el.style.boxShadow = '0 16px 40px rgba(0, 0, 0, 0.16)';
    }
  }, [order.id]);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    setIsDragging(false);
    const el = cardRef.current;
    if (el) {
      el.style.opacity = '';
      el.style.transform = '';
      el.style.boxShadow = '';
    }
    e.preventDefault();
  }, []);

  const draggableClass = [
    'order-card',
    isDragging ? 'dragging' : '',
    playDropAnim ? 'dropped' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={cardRef}
      className={draggableClass}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={`order-card-status-bar ${status}`} />
      <div className="order-card-body">
        <div className="order-card-customer">{order.customerName}</div>
        <div className="order-card-info">
          <span>{order.items.length} 件商品</span>
          <span className="order-card-total">¥{order.totalAmount.toFixed(2)}</span>
        </div>
        <div className="order-card-items">
          {order.items.slice(0, 4).map((item) => (
            <img
              key={item.productId}
              src={item.productImage}
              alt={item.productName}
              className="order-card-item-thumb"
            />
          ))}
          {order.items.length > 4 && (
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 6,
                backgroundColor: 'var(--color-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                color: 'var(--color-text-secondary)',
                fontWeight: 500,
              }}
            >
              +{order.items.length - 4}
            </div>
          )}
        </div>
        <div className="order-card-time">{formatTime(order.createdAt)}</div>
      </div>
    </div>
  );
};

export { statusLabels };
