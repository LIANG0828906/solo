import { memo, useMemo, type FC, type DragEvent } from 'react';
import type { Order } from '../types';
import { useOrderStore } from '../store/orderStore';

interface OrderCardProps {
  order: Order;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

function getTimeColor(seconds: number): { color: string; pulse: boolean } {
  if (seconds < 300) return { color: '#ff4757', pulse: true };
  if (seconds < 600) return { color: '#ffd93d', pulse: false };
  return { color: '#ffffff', pulse: false };
}

const OrderCard: FC<OrderCardProps> = memo(({ order }) => {
  const { setDragging } = useOrderStore();
  const timeStyle = useMemo(() => getTimeColor(order.remainingTime), [order.remainingTime]);

  const handleDragStart = (e: DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', order.id);
    setDragging(order);
    const target = e.currentTarget as HTMLElement;
    target.style.transform = 'scale(1.1)';
    target.style.opacity = '0.9';
    target.style.zIndex = '1000';
  };

  const handleDragEnd = (e: DragEvent) => {
    setDragging(null);
    const target = e.currentTarget as HTMLElement;
    target.style.transform = '';
    target.style.opacity = '';
    target.style.zIndex = '';
  };

  const stationBadge = order.assignedStation
    ? {
        wok: { label: '炒锅', bg: '#0ea5e9' },
        grill: { label: '烤炉', bg: '#f97316' },
        cold: { label: '冷盘', bg: '#22c55e' },
      }[order.assignedStation]
    : null;

  return (
    <div
      className={`order-card ${timeStyle.pulse ? 'order-card--urgent' : ''}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="order-card__header">
        <span className="order-card__table">#{order.tableNumber}</span>
        <span
          className={`order-card__time ${timeStyle.pulse ? 'order-card__time--pulse' : ''}`}
          style={{ color: timeStyle.color }}
        >
          {formatTime(order.remainingTime)}
        </span>
      </div>

      <div className="order-card__dishes">
        {order.dishes.map((dish, i) => (
          <div key={i} className="order-card__dish">
            <span className="order-card__dish-emoji">{dish.emoji}</span>
            <span className="order-card__dish-name">{dish.name}</span>
            <span className="order-card__dish-qty">x{dish.quantity}</span>
          </div>
        ))}
      </div>

      {stationBadge && (
        <div className="order-card__station" style={{ background: stationBadge.bg }}>
          {stationBadge.label}
        </div>
      )}

      {order.priority >= 8 && (
        <div className="order-card__priority">高优先</div>
      )}
    </div>
  );
});

OrderCard.displayName = 'OrderCard';

export default OrderCard;
