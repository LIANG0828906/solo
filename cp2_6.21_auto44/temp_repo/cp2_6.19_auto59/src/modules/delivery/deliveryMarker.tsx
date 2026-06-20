import React, { memo } from 'react';
import type { Order } from '@/types';

interface DeliveryMarkerProps {
  order: Order;
  position: { x: number; y: number };
  trail: { x: number; y: number }[];
}

export const DeliveryMarker: React.FC<DeliveryMarkerProps> = memo(function DeliveryMarker({
  order,
  position,
  trail,
}) {
  const isDelivered = order.status === 'delivered' || order.status === 'completed';
  const isDelivering = order.status === 'delivering';

  const shortId = order.id.slice(0, 4).toUpperCase();

  return (
    <>
      {trail.map((point, index) => (
        <div
          key={index}
          className="delivery-trail"
          style={{
            left: `${point.x}%`,
            top: `${point.y}%`,
            opacity: (index + 1) / (trail.length + 1) * 0.4,
            transform: `translate(-50%, -50%) scale(${(index + 1) / (trail.length + 1)})`,
          }}
        />
      ))}
      <div
        className={`delivery-marker ${isDelivering ? 'pulsing' : ''}`}
        style={{
          left: `${position.x}%`,
          top: `${position.y}%`,
          backgroundColor: isDelivered ? 'var(--color-success)' : 'var(--color-accent)',
        }}
      >
        <span className="marker-order-id">{shortId}</span>
        {isDelivered && <span className="marker-check">✓</span>}
      </div>
      <style>{`
        .delivery-marker {
          position: absolute;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 10px;
          font-weight: 700;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          z-index: 10;
          transition: background-color var(--transition-normal) ease,
            left 2s linear,
            top 2s linear;
          will-change: left, top;
        }
        .delivery-marker.pulsing {
          animation: pulse 2s ease-in-out infinite;
        }
        .marker-order-id {
          font-family: monospace;
        }
        .marker-check {
          position: absolute;
          top: -4px;
          right: -4px;
          width: 18px;
          height: 18px;
          background-color: var(--color-success);
          border: 2px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
        }
        .delivery-trail {
          position: absolute;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background-color: var(--color-accent);
          pointer-events: none;
          transition: all 2s linear;
        }
      `}</style>
    </>
  );
});
