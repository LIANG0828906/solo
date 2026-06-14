import React, { useState, useCallback } from 'react';
import { Order, OrderStatus } from '../api';

interface OrderCardProps {
  order: Order;
  status: OrderStatus;
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

export const OrderCard: React.FC<OrderCardProps> = ({ order, status }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [justDropped, setJustDropped] = useState(false);

  const handleDragStart = useCallback((e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', order.id);
    const el = e.currentTarget as HTMLElement;
    requestAnimationFrame(() => {
      el.style.opacity = '0.7';
      el.style.transform = 'scale(0.95)';
    });
  }, [order.id]);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    setIsDragging(false);
    const el = e.currentTarget as HTMLElement;
    el.style.opacity = '';
    el.style.transform = '';
    setJustDropped(true);
    setTimeout(() => setJustDropped(false), 300);
  }, []);

  return (
    <div
      className={`order-card ${isDragging ? 'dragging' : ''} ${justDropped ? 'dropped' : ''}`}
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
