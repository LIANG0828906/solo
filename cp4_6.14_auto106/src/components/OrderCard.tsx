import React, { useState } from 'react';
import { Order, OrderStatus } from '../api';

interface OrderCardProps {
  order: Order;
  status: OrderStatus;
  onDragEnd: (orderId: string, newStatus: OrderStatus) => void;
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

export const OrderCard: React.FC<OrderCardProps> = ({ order, status, onDragEnd }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isDropped, setIsDropped] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', order.id);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setIsDragging(false);
    const targetStatus = e.dataTransfer.dropEffect === 'none'
      ? null
      : (e.currentTarget.closest('[data-status]') as HTMLElement | null)?.dataset.status;
    if (targetStatus && targetStatus !== status) {
      setIsDropped(true);
      setTimeout(() => setIsDropped(false), 300);
      onDragEnd(order.id, targetStatus as OrderStatus);
    }
  };

  return (
    <div
      className={`order-card ${isDragging ? 'dragging' : ''} ${isDropped ? 'dropped' : ''}`}
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
